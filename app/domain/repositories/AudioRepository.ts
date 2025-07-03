import type { AudioFileEntity } from '../entities/AudioFile';

export interface AudioRepository {
  // オーディオファイルの作成
  createAudioFile(file: File): Promise<AudioFileEntity>;

  // オーディオファイルの取得
  getAudioFile(id: string): Promise<AudioFileEntity | null>;

  // 音声解析データの取得
  getAudioData(): Promise<Uint8Array | null>;

  // 音声の再生状態管理
  play(audioFile: AudioFileEntity): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;

  // 音声コンテキストの初期化
  initializeAudioContext(): Promise<void>;

  // 音声コンテキストの破棄
  disposeAudioContext(): Promise<void>;

  // 再生状態の取得
  isPlaying(): boolean;

  // 音量の設定
  setVolume(volume: number): Promise<void>;

  // 再生位置の設定
  setCurrentTime(time: number): Promise<void>;

  // 再生時間の取得
  getDuration(): Promise<number>;
  getCurrentTime(): Promise<number>;
}
