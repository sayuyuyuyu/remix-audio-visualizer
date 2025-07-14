import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadFileUseCase } from '../../../app/domain/usecases/UploadFileUseCase';
import { FileRepository } from '../../../app/domain/repositories/FileRepository';
import { AudioFileEntity } from '../../../app/domain/entities/AudioFile';
import { CenterImageEntity } from '../../../app/domain/entities/CenterImage';

describe('UploadFileUseCase', () => {
  let uploadFileUseCase: UploadFileUseCase;
  let mockFileRepository: FileRepository;

  beforeEach(() => {
    mockFileRepository = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      getFile: vi.fn(),
      validateFile: vi.fn(),
    };
    uploadFileUseCase = new UploadFileUseCase(mockFileRepository);
  });

  describe('uploadAudioFile', () => {
    it('should upload audio file successfully', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = new AudioFileEntity(file, 'test.mp3', 1000, 'audio/mp3');
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadFile).mockResolvedValue(audioFile);

      const result = await uploadFileUseCase.uploadAudioFile(file);

      expect(mockFileRepository.validateFile).toHaveBeenCalledWith(file);
      expect(mockFileRepository.uploadFile).toHaveBeenCalledWith(file);
      expect(result).toBe(audioFile);
    });

    it('should handle validation failure', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(false);

      await expect(uploadFileUseCase.uploadAudioFile(file)).rejects.toThrow('File validation failed');
      expect(mockFileRepository.uploadFile).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadFile).mockRejectedValue(new Error('Upload failed'));

      await expect(uploadFileUseCase.uploadAudioFile(file)).rejects.toThrow('Upload failed');
    });

    it('should handle null file', async () => {
      await expect(uploadFileUseCase.uploadAudioFile(null as any)).rejects.toThrow('File is required');
    });
  });

  describe('uploadImageFile', () => {
    it('should upload image file successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const centerImage = new CenterImageEntity(file, 'test.jpg', 1000, 'image/jpeg');
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadFile).mockResolvedValue(centerImage);

      const result = await uploadFileUseCase.uploadImageFile(file);

      expect(mockFileRepository.validateFile).toHaveBeenCalledWith(file);
      expect(mockFileRepository.uploadFile).toHaveBeenCalledWith(file);
      expect(result).toBe(centerImage);
    });

    it('should handle validation failure', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(false);

      await expect(uploadFileUseCase.uploadImageFile(file)).rejects.toThrow('File validation failed');
      expect(mockFileRepository.uploadFile).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(true);
      vi.mocked(mockFileRepository.uploadFile).mockRejectedValue(new Error('Upload failed'));

      await expect(uploadFileUseCase.uploadImageFile(file)).rejects.toThrow('Upload failed');
    });

    it('should handle null file', async () => {
      await expect(uploadFileUseCase.uploadImageFile(null as any)).rejects.toThrow('File is required');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fileId = 'test-file-id';

      await uploadFileUseCase.deleteFile(fileId);

      expect(mockFileRepository.deleteFile).toHaveBeenCalledWith(fileId);
    });

    it('should handle delete errors', async () => {
      const fileId = 'test-file-id';
      
      vi.mocked(mockFileRepository.deleteFile).mockRejectedValue(new Error('Delete failed'));

      await expect(uploadFileUseCase.deleteFile(fileId)).rejects.toThrow('Delete failed');
    });

    it('should handle null fileId', async () => {
      await expect(uploadFileUseCase.deleteFile(null as any)).rejects.toThrow('File ID is required');
    });

    it('should handle empty fileId', async () => {
      await expect(uploadFileUseCase.deleteFile('')).rejects.toThrow('File ID is required');
    });
  });

  describe('getFile', () => {
    it('should get file successfully', async () => {
      const fileId = 'test-file-id';
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.mp3', { type: 'audio/mp3' }),
        'test.mp3',
        1000,
        'audio/mp3'
      );
      
      vi.mocked(mockFileRepository.getFile).mockResolvedValue(audioFile);

      const result = await uploadFileUseCase.getFile(fileId);

      expect(mockFileRepository.getFile).toHaveBeenCalledWith(fileId);
      expect(result).toBe(audioFile);
    });

    it('should handle get file errors', async () => {
      const fileId = 'test-file-id';
      
      vi.mocked(mockFileRepository.getFile).mockRejectedValue(new Error('Get file failed'));

      await expect(uploadFileUseCase.getFile(fileId)).rejects.toThrow('Get file failed');
    });

    it('should handle null fileId', async () => {
      await expect(uploadFileUseCase.getFile(null as any)).rejects.toThrow('File ID is required');
    });

    it('should handle empty fileId', async () => {
      await expect(uploadFileUseCase.getFile('')).rejects.toThrow('File ID is required');
    });
  });

  describe('validateFile', () => {
    it('should validate file successfully', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(true);

      const result = await uploadFileUseCase.validateFile(file);

      expect(mockFileRepository.validateFile).toHaveBeenCalledWith(file);
      expect(result).toBe(true);
    });

    it('should handle validation failure', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateFile).mockResolvedValue(false);

      const result = await uploadFileUseCase.validateFile(file);

      expect(result).toBe(false);
    });

    it('should handle validation errors', async () => {
      const file = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      
      vi.mocked(mockFileRepository.validateFile).mockRejectedValue(new Error('Validation failed'));

      await expect(uploadFileUseCase.validateFile(file)).rejects.toThrow('Validation failed');
    });

    it('should handle null file', async () => {
      await expect(uploadFileUseCase.validateFile(null as any)).rejects.toThrow('File is required');
    });
  });
});