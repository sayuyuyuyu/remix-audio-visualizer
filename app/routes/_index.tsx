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
  const [color, setColor] = useState("#6366f1");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Solar system animation state
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
  }, [isPlaying, visualizerConfig, color, centerImage]);

  const visualize = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const canvasCtx = canvas?.getContext("2d");

    if (!canvas || !canvasCtx) {
        requestAnimationFrame(visualize);
        return;
    }

    // Update animation time
    animationTimeRef.current += 0.02;

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
            canvasCtx.lineWidth = 3;
            
            // Create gradient for waveform
            const waveGradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
            waveGradient.addColorStop(0, color);
            waveGradient.addColorStop(0.5, `${color}80`);
            waveGradient.addColorStop(1, color);
            canvasCtx.strokeStyle = waveGradient;
            
            canvasCtx.beginPath();
            const sliceWidth = (canvas.width * 1.0) / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                if (i === 0) canvasCtx.moveTo(x, y);
                else canvasCtx.lineTo(x, y);
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }

        if (visualizerConfig.frequency) {
            analyser.getByteFrequencyData(dataArray);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                
                // Create gradient for each bar
                const barGradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight / 2);
                const hue = (i / bufferLength) * 360;
                barGradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`);
                barGradient.addColorStop(1, `hsla(${hue}, 70%, 80%, 1)`);
                
                canvasCtx.fillStyle = barGradient;
                canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }
        }

        if (visualizerConfig.circular) {
            analyser.getByteFrequencyData(dataArray);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const imageRadius = 100;

            const radius = imageRadius + 30;
            const bars = bufferLength * 0.7;

            for (let i = 0; i < bars; i++) {
                const barHeight = dataArray[i] * 0.6;
                if (barHeight < 1) continue;

                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const hue = (i / bars) * 360;
                
                // Create gradient for circular bars
                const circularGradient = canvasCtx.createLinearGradient(
                    centerX + radius * Math.cos(angle), 
                    centerY + radius * Math.sin(angle),
                    centerX + (radius + barHeight) * Math.cos(angle), 
                    centerY + (radius + barHeight) * Math.sin(angle)
                );
                circularGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`);
                circularGradient.addColorStop(1, `hsla(${hue}, 80%, 80%, 1)`);
                
                canvasCtx.strokeStyle = circularGradient;
                canvasCtx.lineWidth = 4;

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
            
            // Calculate overall audio intensity for global effects
            const totalIntensity = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const intensityFactor = totalIntensity / 255;

            // Draw center "sun" with pulsing effect
            const sunRadius = 50 + intensityFactor * 40;
            const sunGradient = canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
            sunGradient.addColorStop(0, `hsla(45, 100%, ${80 + intensityFactor * 20}%, 1)`);
            sunGradient.addColorStop(0.7, `hsla(35, 100%, ${60 + intensityFactor * 20}%, 0.9)`);
            sunGradient.addColorStop(1, `hsla(25, 100%, ${40 + intensityFactor * 10}%, 0.3)`);
            
            canvasCtx.fillStyle = sunGradient;
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            canvasCtx.fill();

            // Define orbital parameters for different "planets"
            const orbits = [
                { radius: 140, speed: 1.0, planetCount: 8, size: 7, hueBase: 60 },
                { radius: 180, speed: 0.7, planetCount: 12, size: 6, hueBase: 120 },
                { radius: 220, speed: 0.5, planetCount: 16, size: 5, hueBase: 180 },
                { radius: 260, speed: 0.4, planetCount: 20, size: 4, hueBase: 240 },
                { radius: 300, speed: 0.25, planetCount: 24, size: 3.5, hueBase: 300 }
            ];

            // Draw orbital paths (glowing circles)
            canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            canvasCtx.lineWidth = 2;
            orbits.forEach(orbit => {
                const dynamicRadius = orbit.radius + intensityFactor * 25;
                canvasCtx.beginPath();
                canvasCtx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
                canvasCtx.stroke();
            });

            // Draw planets on each orbit
            orbits.forEach((orbit, orbitIndex) => {
                const dynamicRadius = orbit.radius + intensityFactor * 25;
                const dynamicSpeed = orbit.speed * (1 + intensityFactor * 3);
                
                for (let i = 0; i < orbit.planetCount; i++) {
                    // Calculate audio data index for this planet
                    const dataIndex = Math.floor((i / orbit.planetCount) * bufferLength);
                    const audioValue = dataArray[dataIndex] || 0;
                    const normalizedAudio = audioValue / 255;

                    // Calculate planet position
                    const baseAngle = (i / orbit.planetCount) * Math.PI * 2;
                    const rotationAngle = animationTimeRef.current * dynamicSpeed;
                    const totalAngle = baseAngle + rotationAngle;
                    
                    const planetX = centerX + dynamicRadius * Math.cos(totalAngle);
                    const planetY = centerY + dynamicRadius * Math.sin(totalAngle);

                    // Planet size affected by audio
                    const planetSize = orbit.size * (1 + normalizedAudio * 2.5);
                    
                    // Planet color with audio-reactive hue and brightness
                    const hue = (orbit.hueBase + (i / orbit.planetCount) * 60) % 360;
                    const brightness = 50 + normalizedAudio * 50;
                    const saturation = 80 + normalizedAudio * 20;
                    
                    // Draw planet with glow effect for high audio values
                    if (normalizedAudio > 0.3) {
                        // Enhanced glow effect
                        const glowRadius = planetSize * 4;
                        const glowGradient = canvasCtx.createRadialGradient(
                            planetX, planetY, 0, 
                            planetX, planetY, glowRadius
                        );
                        glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${brightness}%, 0.9)`);
                        glowGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${brightness}%, 0.4)`);
                        glowGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${brightness}%, 0)`);
                        
                        canvasCtx.fillStyle = glowGradient;
                        canvasCtx.beginPath();
                        canvasCtx.arc(planetX, planetY, glowRadius, 0, Math.PI * 2);
                        canvasCtx.fill();
                    }

                    // Draw main planet with gradient
                    const planetGradient = canvasCtx.createRadialGradient(
                        planetX - planetSize * 0.3, planetY - planetSize * 0.3, 0,
                        planetX, planetY, planetSize
                    );
                    planetGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${brightness + 20}%)`);
                    planetGradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${brightness}%)`);
                    
                    canvasCtx.fillStyle = planetGradient;
                    canvasCtx.beginPath();
                    canvasCtx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
                    canvasCtx.fill();

                    // Draw enhanced trail effect for active planets
                    if (normalizedAudio > 0.2) {
                        const trailLength = 15;
                        for (let t = 1; t <= trailLength; t++) {
                            const trailAngle = totalAngle - (t * 0.08 * dynamicSpeed);
                            const trailX = centerX + dynamicRadius * Math.cos(trailAngle);
                            const trailY = centerY + dynamicRadius * Math.sin(trailAngle);
                            const trailAlpha = (1 - t / trailLength) * normalizedAudio * 0.8;
                            const trailSize = planetSize * (1 - t / trailLength) * 0.5;
                            
                            canvasCtx.fillStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${trailAlpha})`;
                            canvasCtx.beginPath();
                            canvasCtx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
                            canvasCtx.fill();
                        }
                    }
                }
            });

            // Draw enhanced connecting lines between orbits for dramatic effect during high intensity
            if (intensityFactor > 0.5) {
                canvasCtx.strokeStyle = `rgba(255, 255, 255, ${(intensityFactor - 0.5) * 0.6})`;
                canvasCtx.lineWidth = 2;
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + animationTimeRef.current * 0.3;
                    const innerRadius = 100 + intensityFactor * 20;
                    const outerRadius = 320 + intensityFactor * 30;
                    
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle));
                    canvasCtx.lineTo(centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle));
                    canvasCtx.stroke();
                }
            }
        }
    }

    // Draw center image last, on top of the visualizer (except for solar system)
    if (centerImage && imageRef.current?.complete && !visualizerConfig.solar_system) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const imageRadius = 100;
        
        // Add glow around center image
        canvasCtx.shadowColor = color;
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

              {/* Color Picker */}
              {(visualizerConfig.waveform || visualizerConfig.frequency) && (
                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/50">
                  <label htmlFor="color" className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span>🎨</span> Color Theme
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      id="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="w-16 h-16 rounded-xl border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    />
                    <div className="text-sm text-slate-600">
                      <div className="font-medium">Selected: {color}</div>
                      <div className="text-xs text-slate-500">Choose your theme color</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            🎵 Select multiple visualizers to create unique combinations
          </p>
        </div>
      </div>
    </div>
  );
}
