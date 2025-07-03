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

  // キャンバスの設定
  useEffect(() => {
    if (canvasRef.current && engineRef.current) {
      engineRef.current.setCanvas(canvasRef.current);
    }
  }, []);

  // アニメーションループ
  const animate = useCallback(() => {
    if (!audioRepository || !engineRef.current || !canvasRef.current) {
      animationIdRef.current = requestAnimationFrame(animate);
      return;
    }

    try {
      const webAudioService = audioRepository.getWebAudioService();
      const audioData = webAudioService.getAnalysisData();

      if (audioData) {
        const enabledModes = config.getEnabledModes();
        const options = {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
          theme: config.theme,
          sensitivity: config.sensitivity
        };

        engineRef.current.render(enabledModes, audioData, options);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ビジュアライザーエラーが発生しました');
      setIsAnimating(false);
    }
  }, [audioRepository, config]);

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
    setConfig(prevConfig => ({
      ...prevConfig,
      sensitivity: Math.max(0.1, Math.min(3.0, sensitivity)),
      updatedAt: new Date()
    }));
  }, []);

  // FFTサイズの更新
  const updateFFTSize = useCallback((fftSize: number) => {
    const validSizes = [256, 512, 1024, 2048, 4096];
    const validFFTSize = validSizes.includes(fftSize) ? fftSize : 512;

    setConfig(prevConfig => ({
      ...prevConfig,
      fftSize: validFFTSize,
      updatedAt: new Date()
    }));

    // オーディオリポジトリにも反映
    if (audioRepository) {
      audioRepository.updateAudioSettings({ fftSize: validFFTSize });
    }
  }, [audioRepository]);

  // スムージング時定数の更新
  const updateSmoothingTimeConstant = useCallback((smoothing: number) => {
    const validSmoothing = Math.max(0, Math.min(1, smoothing));

    setConfig(prevConfig => ({
      ...prevConfig,
      smoothingTimeConstant: validSmoothing,
      updatedAt: new Date()
    }));

    // オーディオリポジトリにも反映
    if (audioRepository) {
      audioRepository.updateAudioSettings({ smoothingTimeConstant: validSmoothing });
    }
  }, [audioRepository]);

  // アニメーション開始
  const startAnimation = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      animate();
    }
  }, [isAnimating, animate]);

  // アニメーション停止
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animationIdRef.current) {
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
        if (playing) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });

      return cleanup;
    }
  }, [audioRepository, startAnimation, stopAnimation]);

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
