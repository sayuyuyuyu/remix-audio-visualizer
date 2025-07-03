export interface AudioFile {
  id: string;
  name: string;
  file: File;
  url: string;
  duration?: number;
  size: number;
  type: string;
}

export class AudioFileEntity implements AudioFile {
  id: string;
  name: string;
  file: File;
  url: string;
  duration?: number;
  size: number;
  type: string;

  constructor(file: File) {
    this.id = crypto.randomUUID();
    this.name = file.name;
    this.file = file;
    this.url = URL.createObjectURL(file);
    this.size = file.size;
    this.type = file.type;
  }

  // ビジネスルール：有効なオーディオファイルかチェック
  isValid(): boolean {
    const validTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/mp3'
    ];
    return validTypes.includes(this.type) && this.size > 0;
  }

  // ビジネスルール：ファイルサイズ制限チェック
  isWithinSizeLimit(maxSizeMB: number = 50): boolean {
    return this.size <= maxSizeMB * 1024 * 1024;
  }

  // リソースのクリーンアップ
  dispose(): void {
    if (this.url) {
      URL.revokeObjectURL(this.url);
    }
  }
}
