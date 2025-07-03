import { useEffect, useRef } from 'react';
import type { CenterImageEntity } from '../../domain/entities/CenterImage';
import { cn } from '../../utils/cn';

export interface VisualizerCanvasProps {
  className?: string;
  width?: number;
  height?: number;
  centerImage?: CenterImageEntity | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function VisualizerCanvas({
  className,
  width = 1024,
  height = 500,
  centerImage,
  onCanvasReady
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // キャンバスの準備完了通知
  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
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
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto block"
        style={{ aspectRatio: `${width}/${height}` }}
      />

      {/* オーバーレイエフェクト */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 輝度グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

        {/* コーナーシャドウ */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]" />
      </div>

      {/* ローディング状態 */}
      {!onCanvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 text-sm font-medium">
              ビジュアライザーを初期化中...
            </p>
          </div>
        </div>
      )}

      {/* 音声データがない場合のプレースホルダー */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            音声ファイルを選択してください
          </p>
        </div>
      </div>
    </div>
  );
}
