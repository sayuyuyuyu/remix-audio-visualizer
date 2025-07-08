import { useCallback, useState } from 'react';
import { cn } from '../../utils/cn';
import { useDragAndDrop } from '../hooks/useFileUpload';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export interface FileUploadAreaProps {
  type: 'audio' | 'image';
  accept: string[];
  isUploading: boolean;
  uploadProgress: number;
  onFileSelect: (file: File) => void;
  className?: string;
}

export function FileUploadArea({
  type,
  accept,
  isUploading,
  uploadProgress,
  onFileSelect,
  className
}: FileUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((files: File[]) => {
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const { isDragging, dragProps } = useDragAndDrop(handleDrop, accept);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // ファイル入力をリセット
    e.target.value = '';
  };

  const typeConfig = {
    audio: {
      icon: '🎵',
      title: 'オーディオファイル',
      description: 'MP3, WAV, OGG, AAC などの音声ファイルをドロップまたは選択',
      buttonText: '音声ファイルを選択'
    },
    image: {
      icon: '🖼️',
      title: 'センター画像',
      description: 'JPEG, PNG, GIF などの画像ファイルをドロップまたは選択',
      buttonText: '画像ファイルを選択'
    }
  };

  const config = typeConfig[type];

  return (
    <Card
      variant="outline"
      className={cn(
        'relative transition-all duration-200 cursor-pointer group',
        'hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-lg',
        (isDragging || dragActive) && 'border-indigo-400 bg-indigo-50/50 scale-[1.02] shadow-xl',
        isUploading && 'pointer-events-none',
        'bg-white/50 backdrop-blur-sm',
        className
      )}
      {...dragProps}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
    >
      {/* アップロード進行状況オーバーレイ */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-4">
            <div className="relative w-full h-full">
              {/* 背景サークル */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                  className="text-indigo-500 transition-all duration-300"
                />
              </svg>

              {/* パーセンテージ */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-700">
            アップロード中...
          </p>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">{config.icon}</div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
            {config.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed px-2">
            {config.description}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="relative overflow-hidden hover:bg-indigo-50 transition-colors"
            disabled={isUploading}
          >
            {config.buttonText}
            <input
              type="file"
              accept={accept.join(',')}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </Button>

          <p className="text-xs text-slate-500 font-medium">
            または、ここにファイルをドラッグアンドドロップ
          </p>
        </div>

        {/* サポートされる形式 */}
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            対応形式: {accept.map(format => format.split('/')[1].toUpperCase()).join(', ')}
          </p>
        </div>
      </div>

      {/* ドラッグホバーエフェクト */}
      {(isDragging || dragActive) && (
        <div className="absolute inset-0 border-2 border-dashed border-indigo-400 rounded-2xl bg-indigo-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">{config.icon}</div>
            <p className="font-medium text-indigo-700">
              ファイルをドロップしてください
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
