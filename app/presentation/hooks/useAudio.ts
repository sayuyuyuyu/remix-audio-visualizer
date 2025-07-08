import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioFileEntity } from "../../domain/entities/AudioFile";
import { PlayAudioUseCase } from "../../domain/usecases/PlayAudioUseCase";
import { AudioRepositoryImpl } from "../../infrastructure/repositories/AudioRepositoryImpl";

export interface UseAudioReturn {
  audioFile: AudioFileEntity | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  audioRepository: AudioRepositoryImpl | null;
  setAudioFile: (file: AudioFileEntity | null) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  clearError: () => void;
}

export function useAudio(): UseAudioReturn {
  const [audioFile, setAudioFile] = useState<AudioFileEntity | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);

  const audioRepositoryRef = useRef<AudioRepositoryImpl | null>(null);
  const playAudioUseCaseRef = useRef<PlayAudioUseCase | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // リポジトリとユースケースの初期化
  useEffect(() => {
    audioRepositoryRef.current = new AudioRepositoryImpl();
    playAudioUseCaseRef.current = new PlayAudioUseCase(
      audioRepositoryRef.current
    );

    return () => {
      // クリーンアップ
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      audioRepositoryRef.current?.disposeAudioContext();
    };
  }, []);

  // 音声ファイルの設定
  const setAudioFileHandler = useCallback(
    async (file: AudioFileEntity | null) => {
      try {
        setError(null);
        setIsLoading(true);

        // 前のファイルのクリーンアップ
        cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
        cleanupFunctionsRef.current = [];

        if (!file) {
          setAudioFile(null);
          setIsPlaying(false);
          setCurrentTimeState(0);
          setDuration(0);
          return;
        }

        setAudioFile(file);

        // 音声コンテキストの初期化
        await audioRepositoryRef.current?.initializeAudioContext();

        // 状態監視の設定
        if (audioRepositoryRef.current) {
          const playStateCleanup = audioRepositoryRef.current.onPlayStateChange(
            (playing) => {
              setIsPlaying(playing);
            }
          );

          const timeUpdateCleanup = audioRepositoryRef.current.onTimeUpdate(
            (current, dur) => {
              setCurrentTimeState(current);
              setDuration(dur);
            }
          );

          cleanupFunctionsRef.current.push(playStateCleanup, timeUpdateCleanup);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "音声ファイルの設定に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 再生
  const play = useCallback(async () => {
    if (!audioFile || !playAudioUseCaseRef.current) {
      setError("音声ファイルが設定されていません");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const result = await playAudioUseCaseRef.current.execute({ audioFile });

      if (!result.success) {
        setError(result.message || "再生に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "再生エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [audioFile]);

  // 一時停止
  const pause = useCallback(async () => {
    if (!playAudioUseCaseRef.current) return;

    try {
      setError(null);
      const result = await playAudioUseCaseRef.current.pause();

      if (!result.success) {
        setError(result.message || "一時停止に失敗しました");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "一時停止エラーが発生しました"
      );
    }
  }, []);

  // 停止
  const stop = useCallback(async () => {
    if (!playAudioUseCaseRef.current) return;

    try {
      setError(null);
      const result = await playAudioUseCaseRef.current.stop();

      if (!result.success) {
        setError(result.message || "停止に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "停止エラーが発生しました");
    }
  }, []);

  // 音量設定
  const setVolume = useCallback(async (newVolume: number) => {
    try {
      await audioRepositoryRef.current?.setVolume(newVolume);
      setVolumeState(newVolume);
    } catch (err) {
      setError(err instanceof Error ? err.message : "音量設定に失敗しました");
    }
  }, []);

  // 再生位置設定
  const setCurrentTime = useCallback(async (time: number) => {
    try {
      await audioRepositoryRef.current?.setCurrentTime(time);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "再生位置の設定に失敗しました"
      );
    }
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    audioFile,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    audioRepository: audioRepositoryRef.current,
    setAudioFile: setAudioFileHandler,
    play,
    pause,
    stop,
    setVolume,
    setCurrentTime,
    clearError,
  };
}
