import { cn } from '../../utils/cn';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  canPlay: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function AudioControls({
  isPlaying,
  isLoading,
  canPlay,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  className
}: AudioControlsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    onVolumeChange(newVolume);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card variant="glass" className={cn('space-y-6', className)}>
      {/* メインコントロール */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onStop}
          disabled={!canPlay || isLoading}
          className="w-12 h-12 p-0"
        >
          <span className="text-lg">⏹️</span>
        </Button>

        <Button
          variant="primary"
          size="xl"
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canPlay}
          isLoading={isLoading}
          className="w-16 h-16 p-0 text-2xl"
        >
          {!isLoading && (
            <span>{isPlaying ? '⏸️' : '▶️'}</span>
          )}
        </Button>
      </div>

      {/* 時間表示とシークバー */}
      {canPlay && duration > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className={cn(
                'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                'slider-thumb'
              )}
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progress}%, #e2e8f0 ${progress}%, #e2e8f0 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* 音量コントロール */}
      <div className="flex items-center gap-4">
        <span className="text-slate-600 text-sm font-medium flex-shrink-0">
          🔊
        </span>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className={cn(
              'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            )}
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${volume * 100}%, #e2e8f0 ${volume * 100}%, #e2e8f0 100%)`
            }}
          />
        </div>

        <span className="text-slate-600 text-sm font-medium w-10 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

            {/* カスタムスライダースタイル */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
            transition: all 0.2s ease;
          }

          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          }

          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
          }
        `
      }} />
    </Card>
  );
}
