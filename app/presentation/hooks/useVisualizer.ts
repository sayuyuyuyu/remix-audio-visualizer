import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColorTheme } from '../../domain/entities/VisualizerConfig';
import { VisualizerConfigEntity } from '../../domain/entities/VisualizerConfig';
import { VisualizerEngine } from '../../infrastructure/audio/VisualizerEngine';
import { AudioRepositoryImpl } from '../../infrastructure/repositories/AudioRepositoryImpl';
import type { AudioAnalysisData } from '../../infrastructure/audio/WebAudioService';

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
  const animateRef = useRef<() => void>();
  const lastAudioDataRef = useRef<AudioAnalysisData | null>(null); // 最後のオーディオデータを保持

  // ビジュアライザーエンジンの初期化
  useEffect(() => {
    engineRef.current = new VisualizerEngine();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // アニメーションループ - 安定したref版
  const animate = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) {
      return;
    }

    try {
      let audioData = null;
      if (audioRepository) {
        const webAudioService = audioRepository.getWebAudioService();
        audioData = webAudioService.getAnalysisData();
        
        // 音楽が再生中の場合は最後のオーディオデータを更新
        if (isPlaying && audioData) {
          lastAudioDataRef.current = audioData;
        }
      }

      // 一時停止時でも最後のオーディオデータを使用、または静的なダミーデータを作成
      let dataToUse = audioData || lastAudioDataRef.current;
      
      // 音楽が選択されているがデータがない場合は静的なダミーデータを作成
      if (!dataToUse && audioRepository && !isPlaying) {
        // 太陽系や波形でもある程度の形が見えるように、バリエーションのあるデータを作成
        const staticFrequencyData = new Uint8Array(256);
        const staticTimeDomainData = new Uint8Array(256);
        
        for (let i = 0; i < 256; i++) {
          // 周波数データ: 低周波数から高周波数にかけて減衰するパターン
          staticFrequencyData[i] = Math.max(10, 50 - (i * 0.15));
          // 時間領域データ: 静的な正弦波パターン
          staticTimeDomainData[i] = Math.floor(128 + 20 * Math.sin(i * 0.1));
        }
        
        dataToUse = {
          frequencyData: staticFrequencyData,
          timeDomainData: staticTimeDomainData,
          bufferLength: 256,
          sampleRate: 44100,
          bpmData: undefined
        } as AudioAnalysisData;
      }

      const enabledModes = config.getEnabledModes();
      const options = {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        theme: config.theme,
        sensitivity: config.sensitivity,
        isPlaying: isPlaying
      };

      engineRef.current.render(enabledModes, dataToUse, options);

      // animationIdRefをチェックして継続するかを決定
      if (animationIdRef.current !== null) {
        animationIdRef.current = requestAnimationFrame(animateRef.current!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ビジュアライザーエラーが発生しました');
      setIsAnimating(false);
      animationIdRef.current = null;
    }
  }, [audioRepository, config, isPlaying]);

  // animateRefを最新の関数で更新
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  // キャンバスの設定
  useEffect(() => {
    if (canvasRef.current && engineRef.current) {
      engineRef.current.setCanvas(canvasRef.current);
    }
  }, []);

  // モードの切り替え
  const toggleMode = useCallback((modeId: string) => {
    setConfig(prevConfig => {
      // 新しいインスタンスを作成
      const newConfig = new VisualizerConfigEntity();
      
      // 現在の設定をコピー
      newConfig.modes = prevConfig.modes.map(mode => ({
        ...mode,
        enabled: mode.id === modeId ? !mode.enabled : mode.enabled
      }));
      newConfig.theme = { ...prevConfig.theme };
      newConfig.sensitivity = prevConfig.sensitivity;
      newConfig.fftSize = prevConfig.fftSize;
      newConfig.smoothingTimeConstant = prevConfig.smoothingTimeConstant;
      newConfig.createdAt = prevConfig.createdAt;
      newConfig.updatedAt = new Date();
      
      return newConfig;
    });
  }, []);

  // テーマの更新
  const updateTheme = useCallback((theme: ColorTheme) => {
    setConfig(prevConfig => {
      // 新しいインスタンスを作成
      const newConfig = new VisualizerConfigEntity();
      
      // 現在の設定をコピー
      newConfig.modes = prevConfig.modes.map(mode => ({ ...mode }));
      newConfig.theme = { ...theme };
      newConfig.sensitivity = prevConfig.sensitivity;
      newConfig.fftSize = prevConfig.fftSize;
      newConfig.smoothingTimeConstant = prevConfig.smoothingTimeConstant;
      newConfig.createdAt = prevConfig.createdAt;
      newConfig.updatedAt = new Date();
      
      return newConfig;
    });
  }, []);

  // 感度の更新
  const updateSensitivity = useCallback((sensitivity: number) => {
    setConfig(prevConfig => {
      // 新しいインスタンスを作成
      const newConfig = new VisualizerConfigEntity();
      
      // 現在の設定をコピー
      newConfig.modes = prevConfig.modes.map(mode => ({ ...mode }));
      newConfig.theme = { ...prevConfig.theme };
      newConfig.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
      newConfig.fftSize = prevConfig.fftSize;
      newConfig.smoothingTimeConstant = prevConfig.smoothingTimeConstant;
      newConfig.createdAt = prevConfig.createdAt;
      newConfig.updatedAt = new Date();
      
      return newConfig;
    });
  }, []);

  // FFTサイズの更新
  const updateFFTSize = useCallback((fftSize: number) => {
    const validSizes = [256, 512, 1024, 2048, 4096];
    const validFFTSize = validSizes.includes(fftSize) ? fftSize : 512;

    setConfig(prevConfig => {
      // 新しいインスタンスを作成
      const newConfig = new VisualizerConfigEntity();
      
      // 現在の設定をコピー
      newConfig.modes = prevConfig.modes.map(mode => ({ ...mode }));
      newConfig.theme = { ...prevConfig.theme };
      newConfig.sensitivity = prevConfig.sensitivity;
      newConfig.fftSize = validFFTSize;
      newConfig.smoothingTimeConstant = prevConfig.smoothingTimeConstant;
      newConfig.createdAt = prevConfig.createdAt;
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
      // 新しいインスタンスを作成
      const newConfig = new VisualizerConfigEntity();
      
      // 現在の設定をコピー
      newConfig.modes = prevConfig.modes.map(mode => ({ ...mode }));
      newConfig.theme = { ...prevConfig.theme };
      newConfig.sensitivity = prevConfig.sensitivity;
      newConfig.fftSize = prevConfig.fftSize;
      newConfig.smoothingTimeConstant = validSmoothing;
      newConfig.createdAt = prevConfig.createdAt;
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
    if (animationIdRef.current === null && animateRef.current) {
      setIsAnimating(true);
      animationIdRef.current = requestAnimationFrame(animateRef.current);
    }
  }, []);

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
        setIsPlaying(playing);
        // アニメーションは常に継続する（待機状態の表示のため）
        if (animationIdRef.current === null && animateRef.current) {
          setIsAnimating(true);
          animationIdRef.current = requestAnimationFrame(animateRef.current);
        }
      });

      return cleanup;
    }
  }, [audioRepository]);

  // 初期アニメーション開始 - animateRef準備後に実行
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current && engineRef.current && animationIdRef.current === null && animateRef.current) {
        setIsAnimating(true);
        animationIdRef.current = requestAnimationFrame(animateRef.current);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

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
