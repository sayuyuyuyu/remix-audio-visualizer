import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioFileEntity } from './AudioFile';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('AudioFileEntity', () => {
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFile = new File(['test content'], 'test.mp3', {
      type: 'audio/mpeg',
      lastModified: Date.now()
    });
    Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
  });

  describe('constructor', () => {
    it('should create AudioFileEntity with correct properties', () => {
      const entity = new AudioFileEntity(mockFile);

      expect(entity.id).toBe('test-uuid-123');
      expect(entity.name).toBe('test.mp3');
      expect(entity.file).toBe(mockFile);
      expect(entity.url).toBe('blob:test-url');
      expect(entity.size).toBe(1024 * 1024);
      expect(entity.type).toBe('audio/mpeg');
      expect(entity.duration).toBeUndefined();
    });

    it('should call URL.createObjectURL with the file', () => {
      new AudioFileEntity(mockFile);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('should call crypto.randomUUID to generate id', () => {
      new AudioFileEntity(mockFile);

      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe('isValid', () => {
    it('should return true for valid audio file types', () => {
      const validTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'audio/mp3'
      ];

      validTypes.forEach(type => {
        const file = new File(['content'], 'test.mp3', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        const entity = new AudioFileEntity(file);

        expect(entity.isValid()).toBe(true);
      });
    });

    it('should return false for invalid audio file types', () => {
      const invalidTypes = [
        'video/mp4',
        'image/jpeg',
        'text/plain',
        'application/json'
      ];

      invalidTypes.forEach(type => {
        const file = new File(['content'], 'test.mp4', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        const entity = new AudioFileEntity(file);

        expect(entity.isValid()).toBe(false);
      });
    });

    it('should return false for zero size file', () => {
      const file = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 0 });
      const entity = new AudioFileEntity(file);

      expect(entity.isValid()).toBe(false);
    });
  });

  describe('isWithinSizeLimit', () => {
    it('should return true for file within default size limit (50MB)', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 40 * 1024 * 1024 }); // 40MB
      const entity = new AudioFileEntity(file);

      expect(entity.isWithinSizeLimit()).toBe(true);
    });

    it('should return false for file exceeding default size limit (50MB)', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 }); // 60MB
      const entity = new AudioFileEntity(file);

      expect(entity.isWithinSizeLimit()).toBe(false);
    });

    it('should return true for file within custom size limit', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      const entity = new AudioFileEntity(file);

      expect(entity.isWithinSizeLimit(10)).toBe(true);
    });

    it('should return false for file exceeding custom size limit', () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      const entity = new AudioFileEntity(file);

      expect(entity.isWithinSizeLimit(10)).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should revoke object URL when dispose is called', () => {
      const entity = new AudioFileEntity(mockFile);
      const originalUrl = entity.url;

      entity.dispose();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(originalUrl);
    });

    it('should not throw error when url is empty', () => {
      const entity = new AudioFileEntity(mockFile);
      entity.url = '';

      expect(() => entity.dispose()).not.toThrow();
    });
  });
});