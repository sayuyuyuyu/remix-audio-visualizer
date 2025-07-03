import type { AudioFileEntity } from '../entities/AudioFile';
import type { AudioRepository } from '../repositories/AudioRepository';

export interface PlayAudioUseCaseInput {
  audioFile: AudioFileEntity;
}

export interface PlayAudioUseCaseOutput {
  success: boolean;
  message?: string;
  isPlaying: boolean;
}

export class PlayAudioUseCase {
  constructor(private audioRepository: AudioRepository) {}

  async execute(input: PlayAudioUseCaseInput): Promise<PlayAudioUseCaseOutput> {
    try {
      // ビジネスルール：有効なファイルかチェック
      if (!input.audioFile.isValid()) {
        return {
          success: false,
          message: '無効なオーディオファイルです',
          isPlaying: false
        };
      }

      // ビジネスルール：ファイルサイズ制限チェック
      if (!input.audioFile.isWithinSizeLimit()) {
        return {
          success: false,
          message: 'ファイルサイズが大きすぎます（50MB以下にしてください）',
          isPlaying: false
        };
      }

      // 音声コンテキストの初期化
      await this.audioRepository.initializeAudioContext();

      // 音声の再生
      await this.audioRepository.play(input.audioFile);

      return {
        success: true,
        message: '音声の再生を開始しました',
        isPlaying: true
      };
    } catch (error) {
      return {
        success: false,
        message: `再生エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        isPlaying: false
      };
    }
  }

  async pause(): Promise<PlayAudioUseCaseOutput> {
    try {
      await this.audioRepository.pause();
      return {
        success: true,
        message: '音声を一時停止しました',
        isPlaying: false
      };
    } catch (error) {
      return {
        success: false,
        message: `一時停止エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        isPlaying: this.audioRepository.isPlaying()
      };
    }
  }

  async stop(): Promise<PlayAudioUseCaseOutput> {
    try {
      await this.audioRepository.stop();
      return {
        success: true,
        message: '音声を停止しました',
        isPlaying: false
      };
    } catch (error) {
      return {
        success: false,
        message: `停止エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        isPlaying: this.audioRepository.isPlaying()
      };
    }
  }
}
