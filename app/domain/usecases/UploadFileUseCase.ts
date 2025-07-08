import type { AudioFileEntity } from '../entities/AudioFile';
import type { CenterImageEntity } from '../entities/CenterImage';
import type { FileRepository } from '../repositories/FileRepository';

export interface UploadAudioFileInput {
  file: File;
}

export interface UploadImageFileInput {
  file: File;
}

export interface UploadFileOutput<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class UploadFileUseCase {
  constructor(private fileRepository: FileRepository) {}

  async uploadAudioFile(input: UploadAudioFileInput): Promise<UploadFileOutput<AudioFileEntity>> {
    try {
      // ファイルの検証
      const isValid = await this.fileRepository.validateAudioFile(input.file);
      if (!isValid) {
        return {
          success: false,
          message: 'サポートされていないオーディオファイル形式です'
        };
      }

      // ファイルのアップロード
      const audioFile = await this.fileRepository.uploadAudioFile(input.file);

      // エンティティの検証
      if (!audioFile.isValid()) {
        return {
          success: false,
          message: '無効なオーディオファイルです'
        };
      }

      if (!audioFile.isWithinSizeLimit()) {
        return {
          success: false,
          message: 'ファイルサイズが大きすぎます（50MB以下にしてください）'
        };
      }

      return {
        success: true,
        data: audioFile,
        message: 'オーディオファイルをアップロードしました'
      };
    } catch (error) {
      return {
        success: false,
        message: `アップロードエラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  async uploadImageFile(input: UploadImageFileInput): Promise<UploadFileOutput<CenterImageEntity>> {
    try {
      // ファイルの検証
      const isValid = await this.fileRepository.validateImageFile(input.file);
      if (!isValid) {
        return {
          success: false,
          message: 'サポートされていない画像ファイル形式です'
        };
      }

      // ファイルのアップロード
      const imageFile = await this.fileRepository.uploadImageFile(input.file);

      // エンティティの検証
      if (!imageFile.isValid()) {
        return {
          success: false,
          message: '無効な画像ファイルです'
        };
      }

      if (!imageFile.isWithinSizeLimit()) {
        return {
          success: false,
          message: 'ファイルサイズが大きすぎます（10MB以下にしてください）'
        };
      }

      return {
        success: true,
        data: imageFile,
        message: '画像ファイルをアップロードしました'
      };
    } catch (error) {
      return {
        success: false,
        message: `アップロードエラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  getSupportedFormats() {
    return {
      audio: this.fileRepository.getSupportedAudioFormats(),
      image: this.fileRepository.getSupportedImageFormats()
    };
  }
}
