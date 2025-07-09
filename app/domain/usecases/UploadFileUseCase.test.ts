import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadFileUseCase } from './UploadFileUseCase';
import { AudioFileEntity } from '../entities/AudioFile';
import { CenterImageEntity } from '../entities/CenterImage';
import type { FileRepository } from '../repositories/FileRepository';

// Mock FileRepository
const mockFileRepository: FileRepository = {
  uploadAudioFile: vi.fn(),
  uploadImageFile: vi.fn(),
  validateAudioFile: vi.fn(),
  validateImageFile: vi.fn(),
  generateImagePreview: vi.fn(),
  deleteFile: vi.fn(),
  getFileInfo: vi.fn(),
  getSupportedAudioFormats: vi.fn(),
  getSupportedImageFormats: vi.fn()
};

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

// Mock URL.createObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let validAudioFile: File;
  let invalidAudioFile: File;
  let validImageFile: File;
  let invalidImageFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UploadFileUseCase(mockFileRepository);

    // Valid audio file
    validAudioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(validAudioFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB

    // Invalid audio file
    invalidAudioFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(invalidAudioFile, 'size', { value: 1024 });

    // Valid image file
    validImageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validImageFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB

    // Invalid image file
    invalidImageFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(invalidImageFile, 'size', { value: 1024 });
  });

  describe('uploadAudioFile', () => {
    it('should successfully upload valid audio file', async () => {
      const audioEntity = new AudioFileEntity(validAudioFile);
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockResolvedValue(audioEntity);

      const result = await useCase.uploadAudioFile({ file: validAudioFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe(audioEntity);
      expect(result.message).toBe('オーディオファイルをアップロードしました');
      expect(mockFileRepository.validateAudioFile).toHaveBeenCalledWith(validAudioFile);
      expect(mockFileRepository.uploadAudioFile).toHaveBeenCalledWith(validAudioFile);
    });

    it('should reject invalid audio file during validation', async () => {
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(false);

      const result = await useCase.uploadAudioFile({ file: invalidAudioFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('サポートされていないオーディオファイル形式です');
      expect(mockFileRepository.validateAudioFile).toHaveBeenCalledWith(invalidAudioFile);
      expect(mockFileRepository.uploadAudioFile).not.toHaveBeenCalled();
    });

    it('should reject invalid audio file entity', async () => {
      const audioEntity = new AudioFileEntity(invalidAudioFile);
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockResolvedValue(audioEntity);

      const result = await useCase.uploadAudioFile({ file: invalidAudioFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('無効なオーディオファイルです');
    });

    it('should reject audio file exceeding size limit', async () => {
      const largeFile = new File(['content'], 'large.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(largeFile, 'size', { value: 60 * 1024 * 1024 }); // 60MB
      const audioEntity = new AudioFileEntity(largeFile);
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockResolvedValue(audioEntity);

      const result = await useCase.uploadAudioFile({ file: largeFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('ファイルサイズが大きすぎます（50MB以下にしてください）');
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation failed');
      vi.mocked(mockFileRepository.validateAudioFile).mockRejectedValue(error);

      const result = await useCase.uploadAudioFile({ file: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: Validation failed');
    });

    it('should handle upload error', async () => {
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      const error = new Error('Upload failed');
      vi.mocked(mockFileRepository.uploadAudioFile).mockRejectedValue(error);

      const result = await useCase.uploadAudioFile({ file: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: Upload failed');
    });

    it('should handle unknown error', async () => {
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockRejectedValue('Unknown error');

      const result = await useCase.uploadAudioFile({ file: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: 不明なエラー');
    });
  });

  describe('uploadImageFile', () => {
    it('should successfully upload valid image file', async () => {
      const imageEntity = new CenterImageEntity(validImageFile);
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockResolvedValue(imageEntity);

      const result = await useCase.uploadImageFile({ file: validImageFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe(imageEntity);
      expect(result.message).toBe('画像ファイルをアップロードしました');
      expect(mockFileRepository.validateImageFile).toHaveBeenCalledWith(validImageFile);
      expect(mockFileRepository.uploadImageFile).toHaveBeenCalledWith(validImageFile);
    });

    it('should reject invalid image file during validation', async () => {
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(false);

      const result = await useCase.uploadImageFile({ file: invalidImageFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('サポートされていない画像ファイル形式です');
      expect(mockFileRepository.validateImageFile).toHaveBeenCalledWith(invalidImageFile);
      expect(mockFileRepository.uploadImageFile).not.toHaveBeenCalled();
    });

    it('should reject invalid image file entity', async () => {
      const imageEntity = new CenterImageEntity(invalidImageFile);
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockResolvedValue(imageEntity);

      const result = await useCase.uploadImageFile({ file: invalidImageFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('無効な画像ファイルです');
    });

    it('should reject image file exceeding size limit', async () => {
      const largeFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      const imageEntity = new CenterImageEntity(largeFile);
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockResolvedValue(imageEntity);

      const result = await useCase.uploadImageFile({ file: largeFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('ファイルサイズが大きすぎます（10MB以下にしてください）');
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation failed');
      vi.mocked(mockFileRepository.validateImageFile).mockRejectedValue(error);

      const result = await useCase.uploadImageFile({ file: validImageFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: Validation failed');
    });

    it('should handle upload error', async () => {
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      const error = new Error('Upload failed');
      vi.mocked(mockFileRepository.uploadImageFile).mockRejectedValue(error);

      const result = await useCase.uploadImageFile({ file: validImageFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: Upload failed');
    });

    it('should handle unknown error', async () => {
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockRejectedValue('Unknown error');

      const result = await useCase.uploadImageFile({ file: validImageFile });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('アップロードエラー: 不明なエラー');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return supported formats from repository', () => {
      const audioFormats = ['.mp3', '.wav', '.ogg'];
      const imageFormats = ['.jpg', '.png', '.gif'];
      vi.mocked(mockFileRepository.getSupportedAudioFormats).mockReturnValue(audioFormats);
      vi.mocked(mockFileRepository.getSupportedImageFormats).mockReturnValue(imageFormats);

      const result = useCase.getSupportedFormats();

      expect(result.audio).toBe(audioFormats);
      expect(result.image).toBe(imageFormats);
      expect(mockFileRepository.getSupportedAudioFormats).toHaveBeenCalled();
      expect(mockFileRepository.getSupportedImageFormats).toHaveBeenCalled();
    });
  });
});