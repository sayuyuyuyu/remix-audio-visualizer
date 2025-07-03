import type { MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Audio Visualizer" },
    { name: "description", content: "A web-based audio visualizer" },
  ];
};

interface VisualizerConfig {
  circular: boolean;
  waveform: boolean;
  frequency: boolean;
  solar_system: boolean;
}

interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export default function Index() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerConfig, setVisualizerConfig] = useState<VisualizerConfig>({
    circular: true,
    waveform: false,
    frequency: false,
    solar_system: false,
  });
  const [colorTheme, setColorTheme] = useState<ColorTheme>({
    primary: "#6366f1",
    secondary: "#8b5cf6", 
    accent: "#ec4899"
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Solar system animation state - independent rotation
  const animationTimeRef = useRef<number>(0);

  // Initialize Image object only on the client
  useEffect(() => {
    imageRef.current = new Image();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && imageRef.current) {
          const imageUrl = e.target.result as string;
          setCenterImage(imageUrl);
          imageRef.current.src = imageUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVisualizerType = (type: keyof VisualizerConfig) => {
    setVisualizerConfig((prev: VisualizerConfig) => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const updateColorTheme = (colorKey: keyof ColorTheme, value: string) => {
    setColorTheme((prev: ColorTheme) => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const togglePlay = () => {
    if (!audioRef.current?.src) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;

        const source = audioContext.createMediaElementSource(audioRef.current);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }
      audioRef.current.play();
    }
  };
  
  useEffect(() => {
    const audioElement = audioRef.current;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioElement?.addEventListener('play', handlePlay);
    audioElement?.addEventListener('pause', handlePause);

    return () => {
      audioElement?.removeEventListener('play', handlePlay);
      audioElement?.removeEventListener('pause', handlePause);
    };
  }, []);


  useEffect(() => {
    const animationFrameId = requestAnimationFrame(visualize);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, visualizerConfig, colorTheme, centerImage]);

  const visualize = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const canvasCtx = canvas?.getContext("2d");

    if (!canvas || !canvasCtx) {
        requestAnimationFrame(visualize);
        return;
    }

    // Update animation time - continuous for solar system
    animationTimeRef.current += 0.01;

    // Create beautiful gradient background
    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
    gradient.addColorStop(0.5, "rgba(30, 41, 59, 0.9)");
    gradient.addColorStop(1, "rgba(51, 65, 85, 0.95)");
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (visualizerConfig.waveform) {
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.lineWidth = 4;
            
            // Create gradient for waveform using theme colors
            const waveGradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
            waveGradient.addColorStop(0, colorTheme.primary);
            waveGradient.addColorStop(0.5, colorTheme.secondary);
            waveGradient.addColorStop(1, colorTheme.accent);
            canvasCtx.strokeStyle = waveGradient;
            
            canvasCtx.beginPath();
            const sliceWidth = (canvas.width * 1.0) / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                // Adjusted amplitude to fit screen
                const y = (v * canvas.height) / 1.8;
                if (i === 0) canvasCtx.moveTo(x, y);
                else canvasCtx.lineTo(x, y);
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }

        if (visualizerConfig.frequency) {
            analyser.getByteFrequencyData(dataArray);
            // Adjusted bar width to fit screen width
            const maxBars = Math.min(bufferLength, 150); // Limit number of bars
            const barWidth = (canvas.width / maxBars) * 0.8;
            const barSpacing = (canvas.width / maxBars) * 0.2;
            let x = 0;
            
            for (let i = 0; i < maxBars; i++) {
                const dataIndex = Math.floor((i / maxBars) * bufferLength);
                // Adjusted height to fit screen
                const barHeight = Math.min(dataArray[dataIndex] * 1.8, canvas.height * 0.8);
                
                // Create gradient for each bar using theme colors
                const barGradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                const progress = i / maxBars;
                if (progress < 0.33) {
                    barGradient.addColorStop(0, colorTheme.primary + '80');
                    barGradient.addColorStop(1, colorTheme.primary);
                } else if (progress < 0.66) {
                    barGradient.addColorStop(0, colorTheme.secondary + '80');
                    barGradient.addColorStop(1, colorTheme.secondary);
                } else {
                    barGradient.addColorStop(0, colorTheme.accent + '80');
                    barGradient.addColorStop(1, colorTheme.accent);
                }
                
                canvasCtx.fillStyle = barGradient;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + barSpacing;
            }
        }

        if (visualizerConfig.circular) {
            analyser.getByteFrequencyData(dataArray);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const imageRadius = 100;

            // Adjusted radius to fit screen
            const maxRadius = Math.min(canvas.width, canvas.height) * 0.3;
            const radius = Math.min(imageRadius + 50, maxRadius);
            const bars = bufferLength * 0.8;

            for (let i = 0; i < bars; i++) {
                // Adjusted height to fit screen
                const maxBarHeight = Math.min(canvas.width, canvas.height) * 0.15;
                const barHeight = Math.min(dataArray[i] * 1.2, maxBarHeight);
                if (barHeight < 1) continue;

                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const progress = i / bars;
                
                // Create gradient for circular bars using theme colors
                let barColor;
                if (progress < 0.33) {
                    barColor = colorTheme.primary;
                } else if (progress < 0.66) {
                    barColor = colorTheme.secondary;
                } else {
                    barColor = colorTheme.accent;
                }
                
                const circularGradient = canvasCtx.createLinearGradient(
                    centerX + radius * Math.cos(angle), 
                    centerY + radius * Math.sin(angle),
                    centerX + (radius + barHeight) * Math.cos(angle), 
                    centerY + (radius + barHeight) * Math.sin(angle)
                );
                circularGradient.addColorStop(0, barColor + '60');
                circularGradient.addColorStop(1, barColor);
                
                canvasCtx.strokeStyle = circularGradient;
                canvasCtx.lineWidth = 5;

                const startX = centerX + radius * Math.cos(angle);
                const startY = centerY + radius * Math.sin(angle);
                const endX = centerX + (radius + barHeight) * Math.cos(angle);
                const endY = centerY + (radius + barHeight) * Math.sin(angle);

                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.lineTo(endX, endY);
                canvasCtx.stroke();
            }
        }

        if (visualizerConfig.solar_system) {
            analyser.getByteFrequencyData(dataArray);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate overall audio intensity for subtle effects (optional)
            const totalIntensity = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const intensityFactor = totalIntensity / 255;

            // Define orbital parameters with different rotation speeds
            const orbits = [
                { radius: 120, speed: 0.3, planetCount: 6, size: 4, waveAmplitude: 8, waveFreq: 4 },
                { radius: 180, speed: -0.2, planetCount: 8, size: 3.5, waveAmplitude: 12, waveFreq: 3 },
                { radius: 240, speed: 0.15, planetCount: 10, size: 3, waveAmplitude: 15, waveFreq: 5 },
                { radius: 300, speed: -0.1, planetCount: 12, size: 2.5, waveAmplitude: 10, waveFreq: 2 }
            ];

            // Draw wavy orbital paths
            canvasCtx.strokeStyle = "rgba(200, 200, 200, 0.2)";
            canvasCtx.lineWidth = 1;
            orbits.forEach(orbit => {
                canvasCtx.beginPath();
                let isFirstPoint = true;
                
                for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
                    // Create wavy radius using sine wave
                    const waveOffset = Math.sin(angle * orbit.waveFreq + animationTimeRef.current) * orbit.waveAmplitude;
                    const dynamicRadius = orbit.radius + waveOffset + intensityFactor * 5;
                    
                    const x = centerX + dynamicRadius * Math.cos(angle);
                    const y = centerY + dynamicRadius * Math.sin(angle);
                    
                    if (isFirstPoint) {
                        canvasCtx.moveTo(x, y);
                        isFirstPoint = false;
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                }
                canvasCtx.closePath();
                canvasCtx.stroke();
            });

            // Draw planets on each orbit with independent rotation
            orbits.forEach((orbit, orbitIndex) => {
                for (let i = 0; i < orbit.planetCount; i++) {
                    // Independent rotation for each orbit
                    const baseAngle = (i / orbit.planetCount) * Math.PI * 2;
                    const rotationAngle = animationTimeRef.current * orbit.speed;
                    const totalAngle = baseAngle + rotationAngle;
                    
                    // Wavy radius calculation
                    const waveOffset = Math.sin(totalAngle * orbit.waveFreq + animationTimeRef.current) * orbit.waveAmplitude;
                    const dynamicRadius = orbit.radius + waveOffset + intensityFactor * 5;
                    
                    const planetX = centerX + dynamicRadius * Math.cos(totalAngle);
                    const planetY = centerY + dynamicRadius * Math.sin(totalAngle);

                    // Calculate audio data index for this planet (optional effect)
                    const dataIndex = Math.floor((i / orbit.planetCount) * bufferLength);
                    const audioValue = dataArray[dataIndex] || 0;
                    const normalizedAudio = audioValue / 255;

                    // Planet size - subtle variation
                    const planetSize = orbit.size * (1 + normalizedAudio * 0.2);
                    
                    // Subtle planet colors using theme
                    const themeColors = [colorTheme.primary, colorTheme.secondary, colorTheme.accent];
                    const baseColor = themeColors[orbitIndex % themeColors.length];
                    
                    // Parse hex color to extract RGB values
                    const r = parseInt(baseColor.slice(1, 3), 16);
                    const g = parseInt(baseColor.slice(3, 5), 16);
                    const b = parseInt(baseColor.slice(5, 7), 16);
                    
                    // Create subtle planet color
                    const opacity = 0.6 + normalizedAudio * 0.2;
                    canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                    
                    canvasCtx.beginPath();
                    canvasCtx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
                    canvasCtx.fill();

                    // Very subtle trail effect
                    if (normalizedAudio > 0.4) {
                        const trailLength = 6;
                        for (let t = 1; t <= trailLength; t++) {
                            const trailAngle = totalAngle - (t * 0.03);
                            const trailWaveOffset = Math.sin(trailAngle * orbit.waveFreq + animationTimeRef.current) * orbit.waveAmplitude;
                            const trailRadius = orbit.radius + trailWaveOffset + intensityFactor * 5;
                            const trailX = centerX + trailRadius * Math.cos(trailAngle);
                            const trailY = centerY + trailRadius * Math.sin(trailAngle);
                            const trailOpacity = (1 - t / trailLength) * normalizedAudio * 0.15;
                            const trailSize = planetSize * (1 - t / trailLength) * 0.4;
                            
                            canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailOpacity})`;
                            canvasCtx.beginPath();
                            canvasCtx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
                            canvasCtx.fill();
                        }
                    }
                }
            });
        }
    } else {
        // Continue solar system animation even without audio
        if (visualizerConfig.solar_system) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Define orbital parameters with different rotation speeds
            const orbits = [
                { radius: 120, speed: 0.3, planetCount: 6, size: 4, waveAmplitude: 8, waveFreq: 4 },
                { radius: 180, speed: -0.2, planetCount: 8, size: 3.5, waveAmplitude: 12, waveFreq: 3 },
                { radius: 240, speed: 0.15, planetCount: 10, size: 3, waveAmplitude: 15, waveFreq: 5 },
                { radius: 300, speed: -0.1, planetCount: 12, size: 2.5, waveAmplitude: 10, waveFreq: 2 }
            ];

            // Draw wavy orbital paths
            canvasCtx.strokeStyle = "rgba(200, 200, 200, 0.2)";
            canvasCtx.lineWidth = 1;
            orbits.forEach(orbit => {
                canvasCtx.beginPath();
                let isFirstPoint = true;
                
                for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
                    // Create wavy radius using sine wave
                    const waveOffset = Math.sin(angle * orbit.waveFreq + animationTimeRef.current) * orbit.waveAmplitude;
                    const dynamicRadius = orbit.radius + waveOffset;
                    
                    const x = centerX + dynamicRadius * Math.cos(angle);
                    const y = centerY + dynamicRadius * Math.sin(angle);
                    
                    if (isFirstPoint) {
                        canvasCtx.moveTo(x, y);
                        isFirstPoint = false;
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
                }
                canvasCtx.closePath();
                canvasCtx.stroke();
            });

            // Draw planets on each orbit with independent rotation
            orbits.forEach((orbit, orbitIndex) => {
                for (let i = 0; i < orbit.planetCount; i++) {
                    // Independent rotation for each orbit
                    const baseAngle = (i / orbit.planetCount) * Math.PI * 2;
                    const rotationAngle = animationTimeRef.current * orbit.speed;
                    const totalAngle = baseAngle + rotationAngle;
                    
                    // Wavy radius calculation
                    const waveOffset = Math.sin(totalAngle * orbit.waveFreq + animationTimeRef.current) * orbit.waveAmplitude;
                    const dynamicRadius = orbit.radius + waveOffset;
                    
                    const planetX = centerX + dynamicRadius * Math.cos(totalAngle);
                    const planetY = centerY + dynamicRadius * Math.sin(totalAngle);

                    // Planet size
                    const planetSize = orbit.size;
                    
                    // Planet colors using theme
                    const themeColors = [colorTheme.primary, colorTheme.secondary, colorTheme.accent];
                    const baseColor = themeColors[orbitIndex % themeColors.length];
                    
                    // Parse hex color to extract RGB values
                    const r = parseInt(baseColor.slice(1, 3), 16);
                    const g = parseInt(baseColor.slice(3, 5), 16);
                    const b = parseInt(baseColor.slice(5, 7), 16);
                    
                    // Create planet color
                    canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
                    
                    canvasCtx.beginPath();
                    canvasCtx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
                    canvasCtx.fill();
                }
            });
        }
    }

    // Draw center image ALWAYS on top (moved to end)
    if (centerImage && imageRef.current?.complete) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const imageRadius = 100;
        
        // Add glow around center image using theme color
        canvasCtx.shadowColor = colorTheme.primary;
        canvasCtx.shadowBlur = 20;
        
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, imageRadius, 0, Math.PI * 2, false);
        canvasCtx.clip();
        canvasCtx.drawImage(imageRef.current, centerX - imageRadius, centerY - imageRadius, imageRadius * 2, imageRadius * 2);
        canvasCtx.restore();
        
        // Reset shadow
        canvasCtx.shadowBlur = 0;
    }

    requestAnimationFrame(visualize);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tracking-wider drop-shadow-sm">
            Creative Audio Visualizer
          </h1>
          <p className="text-lg text-slate-600 font-medium">Experience music like never before</p>
        </div>
        
        <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-2xl mb-8 border border-white/30 ring-1 ring-slate-200/50">
          <canvas ref={canvasRef} width="1024" height="500" className="w-full rounded-xl shadow-inner"></canvas>
        </div>

        <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full border border-white/30 ring-1 ring-slate-200/50">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            
            {/* File Upload Section */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col">
                <label htmlFor="audioFile" className="text-sm font-semibold mb-2 text-slate-700">🎵 Audio File</label>
                <input 
                  id="audioFile" 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange} 
                  className="file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-500 file:to-purple-600 file:text-white hover:file:from-indigo-600 hover:file:to-purple-700 file:transition-all file:shadow-lg cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="imageFile" className="text-sm font-semibold mb-2 text-slate-700">🖼️ Center Image</label>
                <input 
                  id="imageFile" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-rose-600 file:text-white hover:file:from-pink-600 hover:file:to-rose-700 file:transition-all file:shadow-lg cursor-pointer"
                />
              </div>
              <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}></audio>
            </div>
            
            {/* Controls Section */}
            <div className="flex flex-col gap-6 min-w-0 flex-1">
              
              {/* Play Button */}
              <div className="flex items-center justify-center lg:justify-end">
                <button 
                  onClick={togglePlay} 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3" 
                  disabled={!audioFile}
                >
                  <span className="text-xl">{isPlaying ? "⏸️" : "▶️"}</span>
                  {isPlaying ? "Pause" : "Play"}
                </button>
              </div>

              {/* Visualizer Selection */}
              <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/50">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span>🎨</span> Visualizer Modes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(visualizerConfig).map(([type, enabled]) => (
                    <label 
                      key={type} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleVisualizerType(type as keyof VisualizerConfig)}
                        className="w-5 h-5 text-indigo-600 bg-white border-2 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 capitalize">
                        {type === "solar_system" ? "Solar System" : type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Theme Customization */}
              <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/50">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span>🌈</span> Color Theme
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Primary</label>
                    <input 
                      type="color" 
                      value={colorTheme.primary} 
                      onChange={(e) => updateColorTheme('primary', e.target.value)} 
                      className="w-12 h-12 rounded-lg border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    />
                    <span className="text-xs text-slate-500">{colorTheme.primary}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Secondary</label>
                    <input 
                      type="color" 
                      value={colorTheme.secondary} 
                      onChange={(e) => updateColorTheme('secondary', e.target.value)} 
                      className="w-12 h-12 rounded-lg border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    />
                    <span className="text-xs text-slate-500">{colorTheme.secondary}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Accent</label>
                    <input 
                      type="color" 
                      value={colorTheme.accent} 
                      onChange={(e) => updateColorTheme('accent', e.target.value)} 
                      className="w-12 h-12 rounded-lg border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    />
                    <span className="text-xs text-slate-500">{colorTheme.accent}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => setColorTheme({primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899"})}
                    className="text-sm px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors text-slate-700"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            🎵 Select multiple visualizers and customize colors for unique combinations
          </p>
        </div>
      </div>
    </div>
  );
}
