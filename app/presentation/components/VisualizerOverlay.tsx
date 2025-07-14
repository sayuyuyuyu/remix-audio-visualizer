import React from 'react';
import type { AudioFileEntity } from '../../domain/entities/AudioFile';
import type { BPMAnalysisData } from '../../infrastructure/audio/WebAudioService';

interface VisualizerOverlayProps {
  audioFile: AudioFileEntity | null;
  bpmData: BPMAnalysisData | null;
  isPlaying: boolean;
  className?: string;
}

export const VisualizerOverlay: React.FC<VisualizerOverlayProps> = ({ 
  audioFile, 
  bpmData, 
  isPlaying, 
  className = '' 
}) => {
  if (!audioFile) {
    return null;
  }

  const displayBPM = bpmData && bpmData.currentBPM > 0 ? Math.round(bpmData.currentBPM) : '--';
  const confidence = bpmData ? bpmData.confidence : 0;
  
  // デバッグ用
  console.log('VisualizerOverlay:', { bpmData, displayBPM, confidence });

  // Get confidence color
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return 'text-green-400';
    if (conf >= 0.6) return 'text-yellow-400';
    if (conf >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`absolute top-4 left-4 z-10 ${className}`}>
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white shadow-lg">
        {/* 曲名 */}
        <div className="mb-2">
          <div className="flex items-center space-x-2">
            {isPlaying ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            )}
            <span className="text-xs text-gray-300">
              {isPlaying ? '再生中' : '停止中'}
            </span>
          </div>
          <div className="max-w-[200px] mt-1 overflow-hidden relative">
            <h3 className={`text-sm font-semibold text-white whitespace-nowrap ${
              audioFile.name.length > 25 ? 'animate-scroll' : ''
            }`}>
              {audioFile.name}
            </h3>
          </div>
        </div>

        {/* BPM表示 */}
        <div className="border-t border-gray-600 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">BPM</span>
            {bpmData && bpmData.currentBPM > 0 && (
              <span className={`text-xs ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-white">
              {displayBPM}
            </span>
            <span className="text-xs text-gray-300">BPM</span>
          </div>
          
          {/* ビートインジケーター */}
          {bpmData && bpmData.currentBPM > 0 && confidence > 0.5 && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">ビート検出中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};