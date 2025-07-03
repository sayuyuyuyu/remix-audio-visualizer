import type { AudioFileEntity } from '../entities/AudioFile';
import type { CenterImageEntity } from '../entities/CenterImage';

export interface FileRepository {
  // ファイルのアップロード
  uploadAudioFile(file: File): Promise<AudioFileEntity>;
  uploadImageFile(file: File): Promise<CenterImageEntity>;

  // ファイルの検証
  validateAudioFile(file: File): Promise<boolean>;
  validateImageFile(file: File): Promise<boolean>;

  // ファイルのプレビュー生成
  generateImagePreview(file: File, maxWidth?: number, maxHeight?: number): Promise<string>;

  // ファイルの削除
  deleteFile(id: string): Promise<void>;

  // ファイル情報の取得
  getFileInfo(file: File): Promise<{
    size: number;
    type: string;
    lastModified: Date;
  }>;

  // サポートされるファイル形式の確認
  getSupportedAudioFormats(): string[];
  getSupportedImageFormats(): string[];
}
