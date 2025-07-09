import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileRepositoryImpl } from './FileRepositoryImpl';
import { AudioFileEntity } from '../../domain/entities/AudioFile';
import { CenterImageEntity } from '../../domain/entities/CenterImage';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

// Mock URL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock FileReader
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  onload: null as ((e: any) => void) | null,
  onerror: null as (() => void) | null,
  result: null as ArrayBuffer | null
};

Object.defineProperty(global, 'FileReader', {
  value: vi.fn().mockImplementation(() => mockFileReader)
});

// Mock Image
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  naturalWidth: 800,
  naturalHeight: 600
};

Object.defineProperty(global, 'Image', {
  value: vi.fn().mockImplementation(() => mockImage)
});

// Mock Audio
const mockAudio = {
  src: '',
  duration: 120,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(global, 'Audio', {
  value: vi.fn().mockImplementation(() => mockAudio)
});

// Mock document.createElement for canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn()
  }),
  toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockdata')
};

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn().mockReturnValue(mockCanvas)
  }
});

describe('FileRepositoryImpl', () => {
  let repository: FileRepositoryImpl;
  let validAudioFile: File;
  let validImageFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new FileRepositoryImpl();

    validAudioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(validAudioFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB

    validImageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validImageFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB
  });

  describe('uploadAudioFile', () => {
    it('should successfully upload valid audio file', async () => {
      // Mock metadata extraction
      vi.spyOn(repository as any, 'extractAudioMetadata').mockResolvedValue({ duration: 120 });

      const result = await repository.uploadAudioFile(validAudioFile);

      expect(result).toBeInstanceOf(AudioFileEntity);
      expect(result.name).toBe('test.mp3');
      expect(result.type).toBe('audio/mpeg');
      expect(result.duration).toBe(120);
    });

    it('should throw error for null file', async () => {
      await expect(repository.uploadAudioFile(null as any)).rejects.toThrow('ファイルが指定されていません');
    });

    it('should throw error for file exceeding size limit', async () => {
      const largeFile = new File(['content'], 'large.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(largeFile, 'size', { value: 60 * 1024 * 1024 }); // 60MB

      await expect(repository.uploadAudioFile(largeFile)).rejects.toThrow('ファイルサイズが大きすぎます');
    });

    it('should throw error for invalid file format', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(invalidFile, 'size', { value: 1024 });

      await expect(repository.uploadAudioFile(invalidFile)).rejects.toThrow('サポートされていないオーディオファイル形式です');
    });

    it('should handle metadata extraction failure gracefully', async () => {
      vi.spyOn(repository as any, 'extractAudioMetadata').mockRejectedValue(new Error('Metadata failed'));
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await repository.uploadAudioFile(validAudioFile);

      expect(result).toBeInstanceOf(AudioFileEntity);
      expect(result.duration).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('メタデータの取得に失敗しました:', expect.any(Error));
    });
  });

  describe('uploadImageFile', () => {
    it('should successfully upload valid image file', async () => {
      // Mock dimension extraction
      vi.spyOn(repository as any, 'getImageDimensions').mockResolvedValue({ width: 800, height: 600 });

      const result = await repository.uploadImageFile(validImageFile);

      expect(result).toBeInstanceOf(CenterImageEntity);
      expect(result.name).toBe('test.jpg');
      expect(result.type).toBe('image/jpeg');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should throw error for null file', async () => {
      await expect(repository.uploadImageFile(null as any)).rejects.toThrow('ファイルが指定されていません');
    });

    it('should throw error for file exceeding size limit', async () => {
      const largeFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB

      await expect(repository.uploadImageFile(largeFile)).rejects.toThrow('ファイルサイズが大きすぎます');
    });

    it('should throw error for invalid file format', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(invalidFile, 'size', { value: 1024 });

      await expect(repository.uploadImageFile(invalidFile)).rejects.toThrow('サポートされていない画像ファイル形式です');
    });

    it('should handle dimension extraction failure gracefully', async () => {
      vi.spyOn(repository as any, 'getImageDimensions').mockRejectedValue(new Error('Dimensions failed'));
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await repository.uploadImageFile(validImageFile);

      expect(result).toBeInstanceOf(CenterImageEntity);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('画像の寸法取得に失敗しました:', expect.any(Error));
    });
  });

  describe('validateAudioFile', () => {
    it('should return true for supported audio formats', async () => {
      const supportedFormats = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac'
      ];

      for (const format of supportedFormats) {
        const file = new File(['content'], 'test.mp3', { type: format });
        const result = await repository.validateAudioFile(file);
        expect(result).toBe(true);
      }
    });

    it('should return false for unsupported formats', async () => {
      const unsupportedFormats = ['video/mp4', 'image/jpeg', 'text/plain'];

      for (const format of unsupportedFormats) {
        const file = new File(['content'], 'test.mp4', { type: format });
        const result = await repository.validateAudioFile(file);
        expect(result).toBe(false);
      }
    });
  });

  describe('validateImageFile', () => {
    it('should return true for supported image formats', async () => {
      const supportedFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      for (const format of supportedFormats) {
        const file = new File(['content'], 'test.jpg', { type: format });
        const result = await repository.validateImageFile(file);
        expect(result).toBe(true);
      }
    });

    it('should return false for unsupported formats', async () => {
      const unsupportedFormats = ['audio/mpeg', 'video/mp4', 'text/plain'];

      for (const format of unsupportedFormats) {
        const file = new File(['content'], 'test.mp3', { type: format });
        const result = await repository.validateImageFile(file);
        expect(result).toBe(false);
      }
    });
  });

  describe('generateImagePreview', () => {
    it('should generate image preview with default size', async () => {
      const previewPromise = repository.generateImagePreview(validImageFile);

      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await previewPromise;

      expect(result).toBe('data:image/jpeg;base64,mockdata');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
    });

    it('should generate image preview with custom size', async () => {
      const previewPromise = repository.generateImagePreview(validImageFile, 100, 100);

      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await previewPromise;

      expect(result).toBe('data:image/jpeg;base64,mockdata');
    });

    it('should handle image load error', async () => {
      const previewPromise = repository.generateImagePreview(validImageFile);

      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(previewPromise).rejects.toThrow('画像のプレビュー生成に失敗しました');
    });
  });

  describe('deleteFile', () => {
    it('should log file deletion', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await repository.deleteFile('test-id');

      expect(console.log).toHaveBeenCalledWith('ファイル test-id を削除しました');
    });
  });

  describe('getFileInfo', () => {
    it('should return file information', async () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      Object.defineProperty(file, 'lastModified', { value: 1234567890000 });

      const result = await repository.getFileInfo(file);

      expect(result).toEqual({
        size: 1024,
        type: 'audio/mpeg',
        lastModified: new Date(1234567890000)
      });
    });
  });

  describe('getSupportedAudioFormats', () => {
    it('should return supported audio formats', () => {
      const formats = repository.getSupportedAudioFormats();

      expect(formats).toContain('audio/mpeg');
      expect(formats).toContain('audio/wav');
      expect(formats).toContain('audio/ogg');
      expect(formats).toContain('audio/aac');
      expect(formats).toContain('audio/flac');
    });
  });

  describe('getSupportedImageFormats', () => {
    it('should return supported image formats', () => {
      const formats = repository.getSupportedImageFormats();

      expect(formats).toContain('image/jpeg');
      expect(formats).toContain('image/png');
      expect(formats).toContain('image/gif');
      expect(formats).toContain('image/webp');
    });
  });

  describe('extractAudioMetadata', () => {
    it('should extract audio duration', async () => {
      const metadataPromise = (repository as any).extractAudioMetadata(validAudioFile);

      // Simulate audio metadata loaded
      if (mockAudio.addEventListener) {
        const loadedMetadataCallback = vi.mocked(mockAudio.addEventListener).mock.calls
          .find(call => call[0] === 'loadedmetadata')?.[1];
        if (loadedMetadataCallback) {
          loadedMetadataCallback();
        }
      }

      const result = await metadataPromise;

      expect(result).toEqual({ duration: 120 });
    });

    it('should handle audio metadata error', async () => {
      const metadataPromise = (repository as any).extractAudioMetadata(validAudioFile);

      // Simulate audio error
      if (mockAudio.addEventListener) {
        const errorCallback = vi.mocked(mockAudio.addEventListener).mock.calls
          .find(call => call[0] === 'error')?.[1];
        if (errorCallback) {
          errorCallback();
        }
      }

      const result = await metadataPromise;

      expect(result).toEqual({});
    });
  });

  describe('getImageDimensions', () => {
    it('should get image dimensions', async () => {
      const dimensionsPromise = (repository as any).getImageDimensions(validImageFile);

      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await dimensionsPromise;

      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('should handle image dimension error', async () => {
      const dimensionsPromise = (repository as any).getImageDimensions(validImageFile);

      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(dimensionsPromise).rejects.toThrow('画像の読み込みに失敗しました');
    });
  });

  describe('checkFileSignature', () => {
    it('should validate MP3 file signature', () => {
      const mp3Signature = new Uint8Array([0xFF, 0xFB, 0x00, 0x00]);
      const result = (repository as any).checkFileSignature(mp3Signature, 'audio/mpeg');

      expect(result).toBe(true);
    });

    it('should validate JPEG file signature', () => {
      const jpegSignature = new Uint8Array([0xFF, 0xD8, 0xFF, 0x00]);
      const result = (repository as any).checkFileSignature(jpegSignature, 'image/jpeg');

      expect(result).toBe(true);
    });

    it('should validate PNG file signature', () => {
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = (repository as any).checkFileSignature(pngSignature, 'image/png');

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const invalidSignature = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = (repository as any).checkFileSignature(invalidSignature, 'audio/mpeg');

      expect(result).toBe(false);
    });

    it('should return true for unknown mime type', () => {
      const signature = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = (repository as any).checkFileSignature(signature, 'unknown/type');

      expect(result).toBe(true);
    });
  });
});