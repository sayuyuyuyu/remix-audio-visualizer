import { useCallback, useRef, useState } from 'react';
import type { AudioFileEntity } from '../../domain/entities/AudioFile';
import type { CenterImageEntity } from '../../domain/entities/CenterImage';
import { UploadFileUseCase } from '../../domain/usecases/UploadFileUseCase';
import { FileRepositoryImpl } from '../../infrastructure/repositories/FileRepositoryImpl';

export interface UseFileUploadReturn {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  supportedFormats: {
    audio: string[];
    image: string[];
  };
  uploadAudioFile: (file: File) => Promise<AudioFileEntity | null>;
  uploadImageFile: (file: File) => Promise<CenterImageEntity | null>;
  validateFile: (file: File, type: 'audio' | 'image') => Promise<boolean>;
  clearError: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileRepositoryRef = useRef<FileRepositoryImpl>(new FileRepositoryImpl());
  const uploadUseCaseRef = useRef<UploadFileUseCase>(
    new UploadFileUseCase(fileRepositoryRef.current)
  );

  // サポートされるファイル形式の取得
  const supportedFormats = {
    audio: fileRepositoryRef.current.getSupportedAudioFormats(),
    image: fileRepositoryRef.current.getSupportedImageFormats()
  };

  // オーディオファイルのアップロード
  const uploadAudioFile = useCallback(async (file: File): Promise<AudioFileEntity | null> => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      // プログレスのシミュレーション（実際のファイルアップロードではプログレスイベントを使用）
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadUseCaseRef.current.uploadAudioFile({ file });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        setError(result.message || 'アップロードに失敗しました');
        return null;
      }

      // 成功時のフィードバック
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードエラーが発生しました');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 画像ファイルのアップロード
  const uploadImageFile = useCallback(async (file: File): Promise<CenterImageEntity | null> => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      // プログレスのシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 80);

      const result = await uploadUseCaseRef.current.uploadImageFile({ file });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        setError(result.message || 'アップロードに失敗しました');
        return null;
      }

      // 成功時のフィードバック
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

      return result.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードエラーが発生しました');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ファイルの検証
  const validateFile = useCallback(async (file: File, type: 'audio' | 'image'): Promise<boolean> => {
    try {
      if (type === 'audio') {
        return await fileRepositoryRef.current.validateAudioFile(file);
      } else {
        return await fileRepositoryRef.current.validateImageFile(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイル検証エラーが発生しました');
      return false;
    }
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    uploadProgress,
    error,
    supportedFormats,
    uploadAudioFile,
    uploadImageFile,
    validateFile,
    clearError
  };
}

// ファイル選択のヘルパー関数
export function createFileSelector(
  accept: string,
  multiple: boolean = false
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;

    input.onchange = () => {
      resolve(input.files);
      input.remove();
    };

    input.oncancel = () => {
      resolve(null);
      input.remove();
    };

    input.click();
  });
}

// ドラッグアンドドロップのヘルパー関数
export function useDragAndDrop(
  onDrop: (files: File[]) => void,
  accept?: string[]
) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    // ファイルタイプのフィルタリング
    const filteredFiles = accept
      ? files.filter(file => accept.some(type => file.type.includes(type)))
      : files;

    if (filteredFiles.length > 0) {
      onDrop(filteredFiles);
    }
  }, [onDrop, accept]);

  return {
    isDragging,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
}
