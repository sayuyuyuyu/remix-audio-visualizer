import type { AudioFileEntity } from "../../domain/entities/AudioFile";
import { AudioFileEntity as AudioFileEntityClass } from "../../domain/entities/AudioFile";
import type { AudioRepository } from "../../domain/repositories/AudioRepository";
import { WebAudioService } from "../audio/WebAudioService";

export class AudioRepositoryImpl implements AudioRepository {
  private webAudioService: WebAudioService;
  private currentAudioFile: AudioFileEntity | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private playStateCallbacks: Array<(isPlaying: boolean) => void> = [];

  constructor() {
    this.webAudioService = new WebAudioService();
  }

  private setupAudioElementListeners() {
    if (!this.audioElement) return;
    this.audioElement.addEventListener("play", () => {
      this.playStateCallbacks.forEach((cb) => cb(true));
    });
    this.audioElement.addEventListener("pause", () => {
      this.playStateCallbacks.forEach((cb) => cb(false));
    });
    this.audioElement.addEventListener("ended", () => {
      this.playStateCallbacks.forEach((cb) => cb(false));
    });
  }

  async createAudioFile(file: File): Promise<AudioFileEntity> {
    return new AudioFileEntityClass(file);
  }

  async getAudioFile(id: string): Promise<AudioFileEntity | null> {
    // 実際の実装では、ストレージやキャッシュから取得
    return this.currentAudioFile && this.currentAudioFile.id === id
      ? this.currentAudioFile
      : null;
  }

  async getAudioData(): Promise<Uint8Array | null> {
    const analysisData = this.webAudioService.getAnalysisData();
    return analysisData ? analysisData.frequencyData : null;
  }

  async play(audioFile: AudioFileEntity): Promise<void> {
    try {
      if (!this.audioElement || this.currentAudioFile?.id !== audioFile.id) {
        this.audioElement = new Audio(audioFile.url);
        this.currentAudioFile = audioFile;
        this.setupAudioElementListeners();
        this.webAudioService.connectAudioElement(this.audioElement);
      }
      await this.webAudioService.play();
    } catch (error) {
      throw new Error(
        `音声の再生に失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
    }
  }

  async pause(): Promise<void> {
    this.webAudioService.pause();
  }

  async stop(): Promise<void> {
    this.webAudioService.stop();
  }

  async initializeAudioContext(): Promise<void> {
    await this.webAudioService.initializeAudioContext();
  }

  async disposeAudioContext(): Promise<void> {
    this.webAudioService.dispose();

    if (this.currentAudioFile) {
      this.currentAudioFile.dispose();
      this.currentAudioFile = null;
    }

    this.audioElement = null;
  }

  isPlaying(): boolean {
    return this.webAudioService.isPlaying();
  }

  async setVolume(volume: number): Promise<void> {
    this.webAudioService.setVolume(volume);
  }

  async setCurrentTime(time: number): Promise<void> {
    this.webAudioService.setCurrentTime(time);
  }

  async getDuration(): Promise<number> {
    return this.webAudioService.getDuration();
  }

  async getCurrentTime(): Promise<number> {
    return this.webAudioService.getCurrentTime();
  }

  // 追加のユーティリティメソッド
  getWebAudioService(): WebAudioService {
    return this.webAudioService;
  }

  getCurrentAudioFile(): AudioFileEntity | null {
    return this.currentAudioFile;
  }

  // 音声設定の更新
  async updateAudioSettings(settings: {
    fftSize?: number;
    smoothingTimeConstant?: number;
    volume?: number;
  }): Promise<void> {
    if (settings.fftSize) {
      this.webAudioService.setFFTSize(settings.fftSize);
    }

    if (settings.smoothingTimeConstant !== undefined) {
      this.webAudioService.setSmoothingTimeConstant(
        settings.smoothingTimeConstant
      );
    }

    if (settings.volume !== undefined) {
      this.webAudioService.setVolume(settings.volume);
    }
  }

  // 音声の状態監視
  onPlayStateChange(callback: (isPlaying: boolean) => void): () => void {
    this.playStateCallbacks.push(callback);
    // クリーンアップ関数
    return () => {
      this.playStateCallbacks = this.playStateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // 時間の変更監視
  onTimeUpdate(
    callback: (currentTime: number, duration: number) => void
  ): () => void {
    if (!this.audioElement) {
      return () => {};
    }

    const handleTimeUpdate = () => {
      const currentTime = this.webAudioService.getCurrentTime();
      const duration = this.webAudioService.getDuration();
      callback(currentTime, duration);
    };

    this.audioElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (this.audioElement) {
        this.audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }
}
