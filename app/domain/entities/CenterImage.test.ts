import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CenterImageEntity } from './CenterImage';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-456')
  }
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:image-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('CenterImageEntity', () => {
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFile = new File(['image content'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    Object.defineProperty(mockFile, 'size', { value: 512 * 1024 }); // 512KB
  });

  describe('constructor', () => {
    it('should create CenterImageEntity with correct properties', () => {
      const entity = new CenterImageEntity(mockFile);

      expect(entity.id).toBe('test-uuid-456');
      expect(entity.name).toBe('test.jpg');
      expect(entity.file).toBe(mockFile);
      expect(entity.url).toBe('blob:image-url');
      expect(entity.size).toBe(512 * 1024);
      expect(entity.type).toBe('image/jpeg');
      expect(entity.width).toBe(0);
      expect(entity.height).toBe(0);
    });

    it('should call URL.createObjectURL with the file', () => {
      new CenterImageEntity(mockFile);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('should call crypto.randomUUID to generate id', () => {
      new CenterImageEntity(mockFile);

      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe('setDimensions', () => {
    it('should set width and height correctly', () => {
      const entity = new CenterImageEntity(mockFile);

      entity.setDimensions(800, 600);

      expect(entity.width).toBe(800);
      expect(entity.height).toBe(600);
    });

    it('should handle zero dimensions', () => {
      const entity = new CenterImageEntity(mockFile);

      entity.setDimensions(0, 0);

      expect(entity.width).toBe(0);
      expect(entity.height).toBe(0);
    });
  });

  describe('isValid', () => {
    it('should return true for valid image file types', () => {
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      validTypes.forEach(type => {
        const file = new File(['content'], 'test.jpg', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        const entity = new CenterImageEntity(file);

        expect(entity.isValid()).toBe(true);
      });
    });

    it('should return false for invalid image file types', () => {
      const invalidTypes = [
        'audio/mpeg',
        'video/mp4',
        'text/plain',
        'application/json'
      ];

      invalidTypes.forEach(type => {
        const file = new File(['content'], 'test.mp3', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        const entity = new CenterImageEntity(file);

        expect(entity.isValid()).toBe(false);
      });
    });

    it('should return false for zero size file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 0 });
      const entity = new CenterImageEntity(file);

      expect(entity.isValid()).toBe(false);
    });
  });

  describe('isWithinSizeLimit', () => {
    it('should return true for file within default size limit (10MB)', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      const entity = new CenterImageEntity(file);

      expect(entity.isWithinSizeLimit()).toBe(true);
    });

    it('should return false for file exceeding default size limit (10MB)', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      const entity = new CenterImageEntity(file);

      expect(entity.isWithinSizeLimit()).toBe(false);
    });

    it('should return true for file within custom size limit', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      const entity = new CenterImageEntity(file);

      expect(entity.isWithinSizeLimit(5)).toBe(true);
    });

    it('should return false for file exceeding custom size limit', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 }); // 8MB
      const entity = new CenterImageEntity(file);

      expect(entity.isWithinSizeLimit(5)).toBe(false);
    });
  });

  describe('getAspectRatio', () => {
    it('should return correct aspect ratio for valid dimensions', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 600);

      expect(entity.getAspectRatio()).toBeCloseTo(800 / 600);
    });

    it('should return 1 for zero width', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(0, 600);

      expect(entity.getAspectRatio()).toBe(1);
    });

    it('should return 1 for zero height', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 0);

      expect(entity.getAspectRatio()).toBe(1);
    });

    it('should return 1 for zero dimensions', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(0, 0);

      expect(entity.getAspectRatio()).toBe(1);
    });
  });

  describe('isSquare', () => {
    it('should return true for perfect square', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 800);

      expect(entity.isSquare()).toBe(true);
    });

    it('should return true for near square (within 0.1 tolerance)', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 780); // aspect ratio ≈ 1.026

      expect(entity.isSquare()).toBe(true);
    });

    it('should return false for non-square', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 600);

      expect(entity.isSquare()).toBe(false);
    });

    it('should return false for very different dimensions', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.setDimensions(800, 400);

      expect(entity.isSquare()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should revoke object URL when dispose is called', () => {
      const entity = new CenterImageEntity(mockFile);
      const originalUrl = entity.url;

      entity.dispose();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(originalUrl);
    });

    it('should not throw error when url is empty', () => {
      const entity = new CenterImageEntity(mockFile);
      entity.url = '';

      expect(() => entity.dispose()).not.toThrow();
    });
  });
});