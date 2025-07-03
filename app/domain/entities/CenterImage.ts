export interface CenterImage {
  id: string;
  name: string;
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

export class CenterImageEntity implements CenterImage {
  id: string;
  name: string;
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;

  constructor(file: File) {
    this.id = crypto.randomUUID();
    this.name = file.name;
    this.file = file;
    this.url = URL.createObjectURL(file);
    this.size = file.size;
    this.type = file.type;
    this.width = 0;
    this.height = 0;
  }

  // 画像の寸法を設定
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  // ビジネスルール：有効な画像ファイルかチェック
  isValid(): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    return validTypes.includes(this.type) && this.size > 0;
  }

  // ビジネスルール：ファイルサイズ制限チェック
  isWithinSizeLimit(maxSizeMB: number = 10): boolean {
    return this.size <= maxSizeMB * 1024 * 1024;
  }

  // アスペクト比の計算
  getAspectRatio(): number {
    return this.width > 0 && this.height > 0 ? this.width / this.height : 1;
  }

  // 正方形かどうか
  isSquare(): boolean {
    return Math.abs(this.getAspectRatio() - 1) < 0.1;
  }

  // リソースのクリーンアップ
  dispose(): void {
    if (this.url) {
      URL.revokeObjectURL(this.url);
    }
  }
}
