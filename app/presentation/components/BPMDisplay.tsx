import React from 'react';
import { BPMAnalysisData } from '../../infrastructure/audio/WebAudioService';

interface BPMDisplayProps {
  bpmData: BPMAnalysisData | null;
  className?: string;
}

export const BPMDisplay: React.FC<BPMDisplayProps> = ({ bpmData, className = '' }) => {
  if (!bpmData) {
    return null;
  }

  const { currentBPM, confidence, stability } = bpmData;

  // Format BPM display
  const displayBPM = currentBPM > 0 ? Math.round(currentBPM) : '--';
  
  // Calculate confidence color
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return 'text-green-400';
    if (conf >= 0.6) return 'text-yellow-400';
    if (conf >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  // Calculate stability color
  const getStabilityColor = (stab: number): string => {
    if (stab >= 0.8) return 'bg-green-500';
    if (stab >= 0.6) return 'bg-yellow-500';
    if (stab >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">BPM</h3>
        <div className="flex items-center space-x-2">
          {/* Confidence indicator */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
            <span className={`text-xs ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* BPM Display */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-3xl font-bold text-white font-mono">
          {displayBPM}
        </span>
        <span className="text-sm text-gray-400">BPM</span>
      </div>
      
      {/* Stability Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>安定性</span>
          <span>{Math.round(stability * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStabilityColor(stability)}`}
            style={{ width: `${stability * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Beat Indicator */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className={`w-3 h-3 rounded-full transition-all duration-150 ${
            currentBPM > 0 && confidence > 0.5 
              ? 'bg-blue-500 animate-pulse' 
              : 'bg-gray-600'
          }`}></div>
          <span className="text-xs text-gray-400">
            {currentBPM > 0 && confidence > 0.5 ? 'ビート検出中' : '検出待機中'}
          </span>
        </div>
      </div>
    </div>
  );
};