import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadFileUseCase } from '../../../app/domain/usecases/UploadFileUseCase';
import type { FileRepository } from '../../../app/domain/repositories/FileRepository';
import { AudioFileEntity } from '../../../app/domain/entities/AudioFile';
import { CenterImageEntity } from '../../../app/domain/entities/CenterImage';

describe('UploadFileUseCase', () => {
  let uploadFileUseCase: UploadFileUseCase;
  let mockFileRepository: FileRepository;

  beforeEach(() => {
    mockFileRepository = {
      uploadAudioFile: vi.fn(),
      uploadImageFile: vi.fn(),
      validateAudioFile: vi.fn(),
      validateImageFile: vi.fn(),
      generateImagePreview: vi.fn(),
      deleteFile: vi.fn(),
      getFileInfo: vi.fn(),
      getSupportedAudioFormats: vi.fn(),
      getSupportedImageFormats: vi.fn(),
    };
    uploadFileUseCase = new UploadFileUseCase(mockFileRepository);
  });

  describe('uploadAudioFile', () => {
    it('should upload audio file successfully', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = new AudioFileEntity(file);
      
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockResolvedValue(audioFile);

      const result = await uploadFileUseCase.uploadAudioFile({ file });

      expect(mockFileRepository.validateAudioFile).toHaveBeenCalledWith(file);
      expect(mockFileRepository.uploadAudioFile).toHaveBeenCalledWith(file);
      expect(result.success).toBe(true);
      expect(result.data).toBe(audioFile);
    });

    it('should handle validation failure', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(false);

      const result = await uploadFileUseCase.uploadAudioFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('サポートされていない');
      expect(mockFileRepository.uploadAudioFile).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockRejectedValue(new Error('Upload failed'));

      const result = await uploadFileUseCase.uploadAudioFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Upload failed');
    });

    it('should reject invalid audio files', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const audioFile = new AudioFileEntity(file);
      
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadAudioFile).mockResolvedValue(audioFile);

      const result = await uploadFileUseCase.uploadAudioFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('無効なオーディオファイル');
    });
  });

  describe('uploadImageFile', () => {
    it('should upload image file successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = new CenterImageEntity(file);
      
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockResolvedValue(imageFile);

      const result = await uploadFileUseCase.uploadImageFile({ file });

      expect(mockFileRepository.validateImageFile).toHaveBeenCalledWith(file);
      expect(mockFileRepository.uploadImageFile).toHaveBeenCalledWith(file);
      expect(result.success).toBe(true);
      expect(result.data).toBe(imageFile);
    });

    it('should handle validation failure', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(false);

      const result = await uploadFileUseCase.uploadImageFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('サポートされていない');
      expect(mockFileRepository.uploadImageFile).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockRejectedValue(new Error('Upload failed'));

      const result = await uploadFileUseCase.uploadImageFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Upload failed');
    });

    it('should reject invalid image files', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const imageFile = new CenterImageEntity(file);
      
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadImageFile).mockResolvedValue(imageFile);

      const result = await uploadFileUseCase.uploadImageFile({ file });

      expect(result.success).toBe(false);
      expect(result.message).toContain('無効な画像ファイル');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return supported formats', () => {
      vi.mocked(mockFileRepository.getSupportedAudioFormats).mockReturnValue(['audio/mp3', 'audio/wav']);
      vi.mocked(mockFileRepository.getSupportedImageFormats).mockReturnValue(['image/jpeg', 'image/png']);

      const result = uploadFileUseCase.getSupportedFormats();

      expect(result.audio).toEqual(['audio/mp3', 'audio/wav']);
      expect(result.image).toEqual(['image/jpeg', 'image/png']);
    });
  });
});