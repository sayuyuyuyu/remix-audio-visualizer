import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CenterImageEntity } from '../../domain/entities/CenterImage';
import { cn } from '../../utils/cn';

export interface VisualizerCanvasProps {
  className?: string;
  width?: number;
  height?: number;
  centerImage?: CenterImageEntity | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  hasAudioFile?: boolean;
  isPlaying?: boolean;
  isAnimating?: boolean;
}

export const VisualizerCanvas = forwardRef<HTMLCanvasElement, VisualizerCanvasProps>(({
  className,
  width = 1024,
  height = 500,
  centerImage,
  onCanvasReady,
  hasAudioFile = false,
  isPlaying = false,
  isAnimating = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // キャンバスの準備完了通知
  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
      setIsCanvasReady(true);
    }
  }, [onCanvasReady]);

  // センター画像の設定
  useEffect(() => {
    if (centerImage && centerImage.url) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
      };
      img.onerror = () => {
        console.warn('センター画像の読み込みに失敗しました:', centerImage.url);
        imageRef.current = null;
      };
      img.src = centerImage.url;
    } else {
      imageRef.current = null;
    }
  }, [centerImage]);


  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl',
      'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      'ring-1 ring-white/10 shadow-inner',
      className
    )}>
      {/* メインキャンバス */}
      <canvas
        ref={(canvas) => {
          (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
          if (typeof ref === 'function') {
            ref(canvas);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
          }
        }}
        width={width}
        height={height}
        className="w-full h-auto block"
        style={{ aspectRatio: `${width}/${height}` }}
      />

      {/* 音声ファイルがない場合の静的ビジュアライザー */}
      {!hasAudioFile && (
        <div className="absolute inset-0">
          {/* 静的なビジュアライザー背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse-slow" />
          
          {/* 静的なパーティクル効果 */}
          <div className="absolute inset-0">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${(i * 8.33) % 100}%`,
                  top: `${Math.sin(i * 0.5) * 30 + 50}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* オーバーレイエフェクト */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 輝度グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

        {/* コーナーシャドウ */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]" />
      </div>

      {/* 再生状態インジケーター */}
      {hasAudioFile && !isPlaying && (
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-xs font-medium">一時停止中</span>
          </div>
        </div>
      )}

      {/* アニメーション状態インジケーター */}
      {hasAudioFile && isPlaying && isAnimating && (
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-xs font-medium">ビジュアライザー動作中</span>
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {hasAudioFile && !isCanvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 text-sm font-medium">
              ビジュアライザーを初期化中...
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

VisualizerCanvas.displayName = 'VisualizerCanvas';
