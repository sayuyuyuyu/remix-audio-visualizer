
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
        }
    }

    // Draw center image last, on top of the visualizer
    if (centerImage && imageRef.current?.complete) {
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
                </select>
              </div>

              {visualizerType !== 'circular' && (
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
