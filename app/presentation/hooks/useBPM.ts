import { useCallback, useEffect, useRef, useState } from "react";
import type { BPMAnalysisData } from "../../infrastructure/audio/WebAudioService";
import type { AudioRepositoryImpl } from "../../infrastructure/repositories/AudioRepositoryImpl";

export interface UseBPMReturn {
  bpmData: BPMAnalysisData | null;
  isDetecting: boolean;
  error: string | null;
  resetDetection: () => void;
  clearError: () => void;
}

export function useBPM(
  audioRepository: AudioRepositoryImpl | null,
  isPlaying: boolean
): UseBPMReturn {
  const [bpmData, setBPMData] = useState<BPMAnalysisData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const animationFrameRef = useRef<number>();
  const isInitializedRef = useRef(false);

  // BPMデータの取得
  const updateBPMData = useCallback(() => {
    if (!audioRepository || !isPlaying) {
      return;
    }

    try {
      const audioData = audioRepository.getAudioAnalysisData();
      if (audioData?.bpmData) {
        setBPMData(audioData.bpmData);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "BPM検出エラー");
    }
  }, [audioRepository, isPlaying]);

  // アニメーションループの開始
  const startBPMDetection = useCallback(() => {
    if (!audioRepository || !isPlaying) {
      return;
    }

    setIsDetecting(true);
    setError(null);

    const animate = () => {
      updateBPMData();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [audioRepository, isPlaying, updateBPMData]);

  // アニメーションループの停止
  const stopBPMDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    setIsDetecting(false);
  }, []);

  // 検出のリセット
  const resetDetection = useCallback(() => {
    setBPMData(null);
    setError(null);
    
    // AudioRepositoryのBPM検出器をリセット
    if (audioRepository) {
      try {
        audioRepository.resetBPMDetector();
      } catch (err) {
        setError(err instanceof Error ? err.message : "BPM検出器リセットエラー");
      }
    }
  }, [audioRepository]);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 再生状態の変化を監視
  useEffect(() => {
    if (!audioRepository) {
      return;
    }

    if (isPlaying) {
      startBPMDetection();
    } else {
      stopBPMDetection();
    }

    return () => {
      stopBPMDetection();
    };
  }, [audioRepository, isPlaying, startBPMDetection, stopBPMDetection]);

  // 音声ファイルの変更時にBPMデータをリセット
  useEffect(() => {
    if (!audioRepository && isInitializedRef.current) {
      // audioRepositoryがnullになった場合（新しい音声ファイルの読み込み時など）
      resetDetection();
    }
    
    isInitializedRef.current = true;
  }, [audioRepository, resetDetection]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopBPMDetection();
    };
  }, [stopBPMDetection]);

  return {
    bpmData,
    isDetecting,
    error,
    resetDetection,
    clearError,
  };
}