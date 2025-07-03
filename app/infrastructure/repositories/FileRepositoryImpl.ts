import type { AudioFileEntity } from '../../domain/entities/AudioFile';
import { AudioFileEntity as AudioFileEntityClass } from '../../domain/entities/AudioFile';
import type { CenterImageEntity } from '../../domain/entities/CenterImage';
import { CenterImageEntity as CenterImageEntityClass } from '../../domain/entities/CenterImage';
import type { FileRepository } from '../../domain/repositories/FileRepository';

export class FileRepositoryImpl implements FileRepository {
  private readonly MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  async uploadAudioFile(file: File): Promise<AudioFileEntity> {
    try {
      // ファイルの基本検証
      if (!file) {
        throw new Error('ファイルが指定されていません');
      }

      // サイズ制限チェック
      if (file.size > this.MAX_AUDIO_SIZE) {
        throw new Error(`ファイルサイズが大きすぎます（最大: ${this.MAX_AUDIO_SIZE / 1024 / 1024}MB）`);
      }

      // ファイル形式の検証
      const isValid = await this.validateAudioFile(file);
      if (!isValid) {
        throw new Error('サポートされていないオーディオファイル形式です');
      }

      // エンティティの作成
      const audioEntity = new AudioFileEntityClass(file);

      // メタデータの取得（オプション）
      try {
        const metadata = await this.extractAudioMetadata(file);
        if (metadata.duration) {
          audioEntity.duration = metadata.duration;
        }
      } catch (error) {
        console.warn('メタデータの取得に失敗しました:', error);
      }

      return audioEntity;
    } catch (error) {
      throw new Error(`オーディオファイルのアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  async uploadImageFile(file: File): Promise<CenterImageEntity> {
    try {
      // ファイルの基本検証
      if (!file) {
        throw new Error('ファイルが指定されていません');
      }

      // サイズ制限チェック
      if (file.size > this.MAX_IMAGE_SIZE) {
        throw new Error(`ファイルサイズが大きすぎます（最大: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB）`);
      }

      // ファイル形式の検証
      const isValid = await this.validateImageFile(file);
      if (!isValid) {
        throw new Error('サポートされていない画像ファイル形式です');
      }

      // エンティティの作成
      const imageEntity = new CenterImageEntityClass(file);

      // 画像の寸法を取得
      try {
        const dimensions = await this.getImageDimensions(file);
        imageEntity.setDimensions(dimensions.width, dimensions.height);
      } catch (error) {
        console.warn('画像の寸法取得に失敗しました:', error);
      }

      return imageEntity;
    } catch (error) {
      throw new Error(`画像ファイルのアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  async validateAudioFile(file: File): Promise<boolean> {
    const supportedFormats = this.getSupportedAudioFormats();
    return supportedFormats.includes(file.type);
  }

  async validateImageFile(file: File): Promise<boolean> {
    const supportedFormats = this.getSupportedImageFormats();
    return supportedFormats.includes(file.type);
  }

  async generateImagePreview(file: File, maxWidth = 200, maxHeight = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // アスペクト比を保持したリサイズ
        const aspectRatio = img.width / img.height;
        let { width, height } = img;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => {
        reject(new Error('画像のプレビュー生成に失敗しました'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async deleteFile(id: string): Promise<void> {
    // 実際の実装では、ストレージからファイルを削除
    // ここではメモリ上のオブジェクトURLの解放のみ実装
    console.log(`ファイル ${id} を削除しました`);
  }

  async getFileInfo(file: File): Promise<{
    size: number;
    type: string;
    lastModified: Date;
  }> {
    return {
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }

  getSupportedAudioFormats(): string[] {
    return [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/x-m4a',
      'audio/mp4'
    ];
  }

  getSupportedImageFormats(): string[] {
    return [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp'
    ];
  }

  // プライベートヘルパーメソッド
  private async extractAudioMetadata(file: File): Promise<{ duration?: number }> {
    return new Promise((resolve) => {
      const audio = new Audio();

      const cleanup = () => {
        URL.revokeObjectURL(audio.src);
      };

      audio.addEventListener('loadedmetadata', () => {
        const duration = isFinite(audio.duration) ? audio.duration : undefined;
        cleanup();
        resolve({ duration });
      });

      audio.addEventListener('error', () => {
        cleanup();
        resolve({});
      });

      audio.src = URL.createObjectURL(file);
    });
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('画像の読み込みに失敗しました'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // ファイル形式の詳細検証
  async validateFileContent(file: File): Promise<boolean> {
    // ファイルの先頭バイトを読み取ってMIMEタイプを検証
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve(false);
          return;
        }

        const uint8Array = new Uint8Array(buffer);
        const isValid = this.checkFileSignature(uint8Array, file.type);
        resolve(isValid);
      };

      reader.onerror = () => resolve(false);

      // ファイルの最初の8バイトを読み取り
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  }

  private checkFileSignature(bytes: Uint8Array, mimeType: string): boolean {
    // ファイルシグネチャ（マジックナンバー）の検証
    const signatures: { [key: string]: number[][] } = {
      'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]], // MP3
      'audio/wav': [[0x52, 0x49, 0x46, 0x46]], // WAV
      'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]], // OGG
      'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
      'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // WebP (RIFF)
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      return true; // 未知の形式は通す
    }

    return expectedSignatures.some(signature =>
      signature.every((byte, index) => bytes[index] === byte)
    );
  }
}
