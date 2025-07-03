import type { MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Audio Visualizer" },
    { name: "description", content: "A web-based audio visualizer" },
  ];
};

export default function Index() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerType, setVisualizerType] = useState("circular");
  const [color, setColor] = useState("#ffffff");

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
  }, [isPlaying, visualizerType, color, centerImage]);

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

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.fillStyle = "#000";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (visualizerType === "waveform") {
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = color;
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
        } else if (visualizerType === "frequency") {
            analyser.getByteFrequencyData(dataArray);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                canvasCtx.fillStyle = color;
                canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }
        } else if (visualizerType === "circular") {
            analyser.getByteFrequencyData(dataArray);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const imageRadius = 100;

            const radius = imageRadius + 20;
            const bars = bufferLength * 0.7;

            for (let i = 0; i < bars; i++) {
                const barHeight = dataArray[i] * 0.5;
                if (barHeight < 1) continue;

                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const hue = (i / bars) * 360;
                canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                canvasCtx.lineWidth = 3;

                const startX = centerX + radius * Math.cos(angle);
                const startY = centerY + radius * Math.sin(angle);
                const endX = centerX + (radius + barHeight) * Math.cos(angle);
                const endY = centerY + (radius + barHeight) * Math.sin(angle);

                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.lineTo(endX, endY);
                canvasCtx.stroke();
            }
        } else if (visualizerType === "solar_system") {
            analyser.getByteFrequencyData(dataArray);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate overall audio intensity for global effects
            const totalIntensity = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const intensityFactor = totalIntensity / 255;

            // Draw center "sun" with pulsing effect
            const sunRadius = 40 + intensityFactor * 30;
            const sunGradient = canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
            sunGradient.addColorStop(0, `hsla(45, 100%, ${70 + intensityFactor * 30}%, 1)`);
            sunGradient.addColorStop(0.7, `hsla(25, 100%, ${50 + intensityFactor * 20}%, 0.8)`);
            sunGradient.addColorStop(1, `hsla(15, 100%, ${30 + intensityFactor * 10}%, 0.2)`);
            
            canvasCtx.fillStyle = sunGradient;
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
            canvasCtx.fill();

            // Define orbital parameters for different "planets"
            const orbits = [
                { radius: 120, speed: 0.8, planetCount: 8, size: 6, hueBase: 60 },
                { radius: 160, speed: 0.6, planetCount: 12, size: 5, hueBase: 120 },
                { radius: 200, speed: 0.4, planetCount: 16, size: 4, hueBase: 180 },
                { radius: 240, speed: 0.3, planetCount: 20, size: 3.5, hueBase: 240 },
                { radius: 280, speed: 0.2, planetCount: 24, size: 3, hueBase: 300 }
            ];

            // Draw orbital paths (faint circles)
            canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            canvasCtx.lineWidth = 1;
            orbits.forEach(orbit => {
                const dynamicRadius = orbit.radius + intensityFactor * 20;
                canvasCtx.beginPath();
                canvasCtx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
                canvasCtx.stroke();
            });

            // Draw planets on each orbit
            orbits.forEach((orbit, orbitIndex) => {
                const dynamicRadius = orbit.radius + intensityFactor * 20;
                const dynamicSpeed = orbit.speed * (1 + intensityFactor * 2);
                
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
                    const planetSize = orbit.size * (1 + normalizedAudio * 2);
                    
                    // Planet color with audio-reactive hue and brightness
                    const hue = (orbit.hueBase + (i / orbit.planetCount) * 60) % 360;
                    const brightness = 40 + normalizedAudio * 60;
                    const saturation = 70 + normalizedAudio * 30;
                    
                    // Draw planet with glow effect for high audio values
                    if (normalizedAudio > 0.3) {
                        // Glow effect
                        const glowRadius = planetSize * 3;
                        const glowGradient = canvasCtx.createRadialGradient(
                            planetX, planetY, 0, 
                            planetX, planetY, glowRadius
                        );
                        glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${brightness}%, 0.8)`);
                        glowGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${brightness}%, 0)`);
                        
                        canvasCtx.fillStyle = glowGradient;
                        canvasCtx.beginPath();
                        canvasCtx.arc(planetX, planetY, glowRadius, 0, Math.PI * 2);
                        canvasCtx.fill();
                    }

                    // Draw main planet
                    canvasCtx.fillStyle = `hsl(${hue}, ${saturation}%, ${brightness}%)`;
                    canvasCtx.beginPath();
                    canvasCtx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
                    canvasCtx.fill();

                    // Draw trail effect for active planets
                    if (normalizedAudio > 0.2) {
                        const trailLength = 10;
                        canvasCtx.strokeStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, 0.3)`;
                        canvasCtx.lineWidth = 2;
                        canvasCtx.beginPath();
                        
                        for (let t = 1; t <= trailLength; t++) {
                            const trailAngle = totalAngle - (t * 0.1 * dynamicSpeed);
                            const trailX = centerX + dynamicRadius * Math.cos(trailAngle);
                            const trailY = centerY + dynamicRadius * Math.sin(trailAngle);
                            
                            if (t === 1) canvasCtx.moveTo(trailX, trailY);
                            else canvasCtx.lineTo(trailX, trailY);
                        }
                        canvasCtx.stroke();
                    }
                }
            });

            // Draw connecting lines between orbits for dramatic effect during high intensity
            if (intensityFactor > 0.6) {
                canvasCtx.strokeStyle = `rgba(255, 255, 255, ${(intensityFactor - 0.6) * 0.5})`;
                canvasCtx.lineWidth = 1;
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + animationTimeRef.current * 0.5;
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(centerX + 80 * Math.cos(angle), centerY + 80 * Math.sin(angle));
                    canvasCtx.lineTo(centerX + 300 * Math.cos(angle), centerY + 300 * Math.sin(angle));
                    canvasCtx.stroke();
                }
            }
        }
    }

    // Draw center image last, on top of the visualizer
    if (centerImage && imageRef.current?.complete && visualizerType !== "solar_system") {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const imageRadius = 100;
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, imageRadius, 0, Math.PI * 2, false);
        canvasCtx.clip();
        canvasCtx.drawImage(imageRef.current, centerX - imageRadius, centerY - imageRadius, imageRadius * 2, imageRadius * 2);
        canvasCtx.restore();
    }

    requestAnimationFrame(visualize);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-5xl font-bold text-center mb-6 tracking-wider">Creative Audio Visualizer</h1>
        
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-2xl mb-6 border border-gray-700/50">
          <canvas ref={canvasRef} width="1024" height="500" className="w-full rounded-lg"></canvas>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full border border-gray-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex flex-col">
                <label htmlFor="audioFile" className="text-sm mb-1 text-gray-400">Audio</label>
                <input id="audioFile" type="file" accept="audio/*" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition"/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="imageFile" className="text-sm mb-1 text-gray-400">Center Image</label>
                <input id="imageFile" type="file" accept="image/*" onChange={handleImageChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition"/>
              </div>
              <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}></audio>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-full text-lg transition transform hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!audioFile}>
                {isPlaying ? "Pause" : "Play"}
              </button>
              
              <div className="flex items-center gap-2">
                <label htmlFor="visualizerType" className="text-sm font-medium">Type</label>
                <select id="visualizerType" value={visualizerType} onChange={(e) => setVisualizerType(e.target.value)} className="bg-gray-700 text-white rounded-md p-2 border-2 border-gray-600 focus:outline-none focus:border-violet-500 transition">
                  <option value="circular">Circular</option>
                  <option value="waveform">Waveform</option>
                  <option value="frequency">Frequency Bars</option>
                  <option value="solar_system">Solar System</option>
                </select>
              </div>

              {visualizerType !== 'circular' && visualizerType !== 'solar_system' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="color" className="text-sm font-medium">Color</label>
                  <input type="color" id="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-md bg-gray-700 border-2 border-gray-600 cursor-pointer"/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
