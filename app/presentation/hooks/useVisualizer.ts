import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColorTheme } from '../../domain/entities/VisualizerConfig';
import { VisualizerConfigEntity } from '../../domain/entities/VisualizerConfig';
import { VisualizerEngine } from '../../infrastructure/audio/VisualizerEngine';
import { AudioRepositoryImpl } from '../../infrastructure/repositories/AudioRepositoryImpl';

export interface UseVisualizerReturn {
  config: VisualizerConfigEntity;
  isAnimating: boolean;
  error: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  toggleMode: (modeId: string) => void;
  updateTheme: (theme: ColorTheme) => void;
  updateSensitivity: (sensitivity: number) => void;
  updateFFTSize: (fftSize: number) => void;
  updateSmoothingTimeConstant: (smoothing: number) => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  clearError: () => void;
}

export function useVisualizer(audioRepository?: AudioRepositoryImpl): UseVisualizerReturn {
  const [config, setConfig] = useState(() => new VisualizerConfigEntity());
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VisualizerEngine | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // ビジュアライザーエンジンの初期化
  useEffect(() => {
    engineRef.current = new VisualizerEngine();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // アニメーションループ - isAnimatingに依存しない
  const animate = useCallback(() => {
    console.log('[useVisualizer] animate called, checking prerequisites:', {
      engineRef: !!engineRef.current,
      canvasRef: !!canvasRef.current,
      animationId: animationIdRef.current
    });

    if (!engineRef.current || !canvasRef.current) {
      console.log('[useVisualizer] Missing engine or canvas, stopping animation');
      return;
    }

    try {
      let audioData = null;
      if (audioRepository) {
        const webAudioService = audioRepository.getWebAudioService();
        audioData = webAudioService.getAnalysisData();
      }

      const enabledModes = config.getEnabledModes();
      const options = {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        theme: config.theme,
        sensitivity: config.sensitivity,
        isPlaying: isPlaying
      };

      // デバッグログ
      if (audioData && isPlaying) {
        console.log('[useVisualizer] Rendering with audio data:', {
          enabledModes: enabledModes.length,
          isPlaying,
          audioDataLength: audioData.frequencyData.length,
          maxFrequency: Math.max(...audioData.frequencyData),
          canvasSize: `${canvasRef.current.width}x${canvasRef.current.height}`
        });
      } else {
        console.log('[useVisualizer] Rendering waiting state:', {
          audioData: !!audioData,
          isPlaying,
          enabledModes: enabledModes.length
        });
      }

      engineRef.current.render(enabledModes, audioData, options);

      // animationIdRefをチェックして継続するかを決定
      if (animationIdRef.current !== null) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    } catch (err) {
      console.error('[useVisualizer] Animation error:', err);
      setError(err instanceof Error ? err.message : 'ビジュアライザーエラーが発生しました');
      setIsAnimating(false);
      animationIdRef.current = null;
    }
  }, [audioRepository, config, isPlaying]);

  // キャンバスの設定
  useEffect(() => {
    if (canvasRef.current && engineRef.current) {
      engineRef.current.setCanvas(canvasRef.current);
    }
  }, []);

  // モードの切り替え
  const toggleMode = useCallback((modeId: string) => {
    setConfig(prevConfig => {
      const newConfig = Object.assign(Object.create(Object.getPrototypeOf(prevConfig)), prevConfig);
      newConfig.toggleMode(modeId);
      return newConfig;
    });
  }, []);

  // テーマの更新
  const updateTheme = useCallback((theme: ColorTheme) => {
    setConfig(prevConfig => {
      const newConfig = Object.assign(Object.create(Object.getPrototypeOf(prevConfig)), prevConfig);
      newConfig.applyTheme(theme);
      return newConfig;
    });
  }, []);

  // 感度の更新
  const updateSensitivity = useCallback((sensitivity: number) => {
    setConfig(prevConfig => {
      const newConfig = Object.assign(Object.create(Object.getPrototypeOf(prevConfig)), prevConfig);
      newConfig.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
      newConfig.updatedAt = new Date();
      return newConfig;
    });
  }, []);

  // FFTサイズの更新
  const updateFFTSize = useCallback((fftSize: number) => {
    const validSizes = [256, 512, 1024, 2048, 4096];
    const validFFTSize = validSizes.includes(fftSize) ? fftSize : 512;

    setConfig(prevConfig => {
      const newConfig = Object.assign(Object.create(Object.getPrototypeOf(prevConfig)), prevConfig);
      newConfig.fftSize = validFFTSize;
      newConfig.updatedAt = new Date();
      return newConfig;
    });

    // オーディオリポジトリにも反映
    if (audioRepository) {
      audioRepository.updateAudioSettings({ fftSize: validFFTSize });
    }
  }, [audioRepository]);

  // スムージング時定数の更新
  const updateSmoothingTimeConstant = useCallback((smoothing: number) => {
    const validSmoothing = Math.max(0, Math.min(1, smoothing));

    setConfig(prevConfig => {
      const newConfig = Object.assign(Object.create(Object.getPrototypeOf(prevConfig)), prevConfig);
      newConfig.smoothingTimeConstant = validSmoothing;
      newConfig.updatedAt = new Date();
      return newConfig;
    });

    // オーディオリポジトリにも反映
    if (audioRepository) {
      audioRepository.updateAudioSettings({ smoothingTimeConstant: validSmoothing });
    }
  }, [audioRepository]);

  // アニメーション開始
  const startAnimation = useCallback(() => {
    if (animationIdRef.current === null) {
      setIsAnimating(true);
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // アニメーション停止
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 再生状態に応じてアニメーションを自動開始/停止
  useEffect(() => {
    if (audioRepository) {
      const cleanup = audioRepository.onPlayStateChange((playing) => {
        console.log('[useVisualizer] Play state changed:', playing);
        setIsPlaying(playing);
        // アニメーションは常に継続する（待機状態の表示のため）
        if (animationIdRef.current === null) {
          console.log('[useVisualizer] Starting animation on play state change');
          setIsAnimating(true);
          animationIdRef.current = requestAnimationFrame(animate);
        } else {
          console.log('[useVisualizer] Animation already running, animationId:', animationIdRef.current);
        }
      });

      return cleanup;
    }
  }, [audioRepository, animate]);

  // 初期アニメーション開始
  useEffect(() => {
    console.log('[useVisualizer] Initial animation check:', {
      canvasRef: !!canvasRef.current,
      engineRef: !!engineRef.current,
      animationId: animationIdRef.current
    });
    
    if (canvasRef.current && engineRef.current && animationIdRef.current === null) {
      console.log('[useVisualizer] Starting initial animation');
      setIsAnimating(true);
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  return {
    config,
    isAnimating,
    error,
    canvasRef,
    toggleMode,
    updateTheme,
    updateSensitivity,
    updateFFTSize,
    updateSmoothingTimeConstant,
    startAnimation,
    stopAnimation,
    clearError
  };
}
