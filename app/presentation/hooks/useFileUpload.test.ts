import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileUpload, createFileSelector, useDragAndDrop } from './useFileUpload';
import { AudioFileEntity } from '../../domain/entities/AudioFile';
import { CenterImageEntity } from '../../domain/entities/CenterImage';
import { UploadFileUseCase } from '../../domain/usecases/UploadFileUseCase';
import { FileRepositoryImpl } from '../../infrastructure/repositories/FileRepositoryImpl';

// Mock dependencies
vi.mock('../../domain/usecases/UploadFileUseCase');
vi.mock('../../infrastructure/repositories/FileRepositoryImpl');

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

// Mock timers
vi.useFakeTimers();

describe('useFileUpload', () => {
  let mockFileRepository: FileRepositoryImpl;
  let mockUploadUseCase: UploadFileUseCase;
  let validAudioFile: File;
  let validImageFile: File;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FileRepositoryImpl
    mockFileRepository = {
      getSupportedAudioFormats: vi.fn().mockReturnValue(['audio/mpeg', 'audio/wav']),
      getSupportedImageFormats: vi.fn().mockReturnValue(['image/jpeg', 'image/png']),
      validateAudioFile: vi.fn(),
      validateImageFile: vi.fn()
    } as any;

    // Mock UploadFileUseCase
    mockUploadUseCase = {
      uploadAudioFile: vi.fn(),
      uploadImageFile: vi.fn()
    } as any;

    vi.mocked(FileRepositoryImpl).mockImplementation(() => mockFileRepository);
    vi.mocked(UploadFileUseCase).mockImplementation(() => mockUploadUseCase);

    // Create test files
    validAudioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(validAudioFile, 'size', { value: 1024 * 1024 });

    validImageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validImageFile, 'size', { value: 512 * 1024 });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.supportedFormats.audio).toEqual(['audio/mpeg', 'audio/wav']);
    expect(result.current.supportedFormats.image).toEqual(['image/jpeg', 'image/png']);
  });

  describe('uploadAudioFile', () => {
    it('should upload audio file successfully', async () => {
      const { result } = renderHook(() => useFileUpload());
      const audioEntity = new AudioFileEntity(validAudioFile);
      vi.mocked(mockUploadUseCase.uploadAudioFile).mockResolvedValue({
        success: true,
        data: audioEntity,
        message: 'Success'
      });

      let uploadResult: AudioFileEntity | null = null;

      await act(async () => {
        uploadResult = await result.current.uploadAudioFile(validAudioFile);
      });

      expect(mockUploadUseCase.uploadAudioFile).toHaveBeenCalledWith({ file: validAudioFile });
      expect(uploadResult).toBe(audioEntity);
      expect(result.current.error).toBeNull();
    });

    it('should handle upload failure', async () => {
      const { result } = renderHook(() => useFileUpload());
      vi.mocked(mockUploadUseCase.uploadAudioFile).mockResolvedValue({
        success: false,
        message: 'Upload failed'
      });

      let uploadResult: AudioFileEntity | null = null;

      await act(async () => {
        uploadResult = await result.current.uploadAudioFile(validAudioFile);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Upload failed');
    });

    it('should handle upload exception', async () => {
      const { result } = renderHook(() => useFileUpload());
      const error = new Error('Upload exception');
      vi.mocked(mockUploadUseCase.uploadAudioFile).mockRejectedValue(error);

      let uploadResult: AudioFileEntity | null = null;

      await act(async () => {
        uploadResult = await result.current.uploadAudioFile(validAudioFile);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Upload exception');
    });

    it('should show upload progress', async () => {
      const { result } = renderHook(() => useFileUpload());
      let progressValues: number[] = [];

      vi.mocked(mockUploadUseCase.uploadAudioFile).mockImplementation(async () => {
        // Capture progress values during upload
        for (let i = 0; i < 10; i++) {
          await vi.advanceTimersByTimeAsync(100);
          progressValues.push(result.current.uploadProgress);
        }
        return { success: true, data: new AudioFileEntity(validAudioFile) };
      });

      await act(async () => {
        const uploadPromise = result.current.uploadAudioFile(validAudioFile);
        await vi.runAllTimersAsync();
        await uploadPromise;
      });

      expect(progressValues.some(p => p > 0 && p < 100)).toBe(true);
      expect(result.current.uploadProgress).toBe(100);
    });

    it('should reset progress after successful upload', async () => {
      const { result } = renderHook(() => useFileUpload());
      vi.mocked(mockUploadUseCase.uploadAudioFile).mockResolvedValue({
        success: true,
        data: new AudioFileEntity(validAudioFile)
      });

      await act(async () => {
        await result.current.uploadAudioFile(validAudioFile);
      });

      expect(result.current.uploadProgress).toBe(100);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(result.current.uploadProgress).toBe(0);
    });

    it('should set uploading state during upload', async () => {
      const { result } = renderHook(() => useFileUpload());
      let uploadingState = false;

      vi.mocked(mockUploadUseCase.uploadAudioFile).mockImplementation(async () => {
        uploadingState = result.current.isUploading;
        return { success: true, data: new AudioFileEntity(validAudioFile) };
      });

      await act(async () => {
        await result.current.uploadAudioFile(validAudioFile);
      });

      expect(uploadingState).toBe(true);
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('uploadImageFile', () => {
    it('should upload image file successfully', async () => {
      const { result } = renderHook(() => useFileUpload());
      const imageEntity = new CenterImageEntity(validImageFile);
      vi.mocked(mockUploadUseCase.uploadImageFile).mockResolvedValue({
        success: true,
        data: imageEntity,
        message: 'Success'
      });

      let uploadResult: CenterImageEntity | null = null;

      await act(async () => {
        uploadResult = await result.current.uploadImageFile(validImageFile);
      });

      expect(mockUploadUseCase.uploadImageFile).toHaveBeenCalledWith({ file: validImageFile });
      expect(uploadResult).toBe(imageEntity);
      expect(result.current.error).toBeNull();
    });

    it('should handle upload failure', async () => {
      const { result } = renderHook(() => useFileUpload());
      vi.mocked(mockUploadUseCase.uploadImageFile).mockResolvedValue({
        success: false,
        message: 'Upload failed'
      });

      let uploadResult: CenterImageEntity | null = null;

      await act(async () => {
        uploadResult = await result.current.uploadImageFile(validImageFile);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Upload failed');
    });

    it('should show upload progress for images', async () => {
      const { result } = renderHook(() => useFileUpload());
      let progressValues: number[] = [];

      vi.mocked(mockUploadUseCase.uploadImageFile).mockImplementation(async () => {
        // Capture progress values during upload
        for (let i = 0; i < 8; i++) {
          await vi.advanceTimersByTimeAsync(80);
          progressValues.push(result.current.uploadProgress);
        }
        return { success: true, data: new CenterImageEntity(validImageFile) };
      });

      await act(async () => {
        const uploadPromise = result.current.uploadImageFile(validImageFile);
        await vi.runAllTimersAsync();
        await uploadPromise;
      });

      expect(progressValues.some(p => p > 0 && p < 100)).toBe(true);
      expect(result.current.uploadProgress).toBe(100);
    });
  });

  describe('validateFile', () => {
    it('should validate audio file', async () => {
      const { result } = renderHook(() => useFileUpload());
      vi.mocked(mockFileRepository.validateAudioFile).mockResolvedValue(true);

      let isValid = false;

      await act(async () => {
        isValid = await result.current.validateFile(validAudioFile, 'audio');
      });

      expect(mockFileRepository.validateAudioFile).toHaveBeenCalledWith(validAudioFile);
      expect(isValid).toBe(true);
    });

    it('should validate image file', async () => {
      const { result } = renderHook(() => useFileUpload());
      vi.mocked(mockFileRepository.validateImageFile).mockResolvedValue(true);

      let isValid = false;

      await act(async () => {
        isValid = await result.current.validateFile(validImageFile, 'image');
      });

      expect(mockFileRepository.validateImageFile).toHaveBeenCalledWith(validImageFile);
      expect(isValid).toBe(true);
    });

    it('should handle validation error', async () => {
      const { result } = renderHook(() => useFileUpload());
      const error = new Error('Validation failed');
      vi.mocked(mockFileRepository.validateAudioFile).mockRejectedValue(error);

      let isValid = true;

      await act(async () => {
        isValid = await result.current.validateFile(validAudioFile, 'audio');
      });

      expect(isValid).toBe(false);
      expect(result.current.error).toBe('Validation failed');
    });
  });

  describe('clearError', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useFileUpload());

      // First set an error
      vi.mocked(mockUploadUseCase.uploadAudioFile).mockRejectedValue(new Error('Test error'));

      await act(async () => {
        await result.current.uploadAudioFile(validAudioFile);
      });

      expect(result.current.error).toBeTruthy();

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('createFileSelector', () => {
  let mockInput: HTMLInputElement;

  beforeEach(() => {
    mockInput = {
      type: '',
      accept: '',
      multiple: false,
      onchange: null,
      oncancel: null,
      click: vi.fn(),
      remove: vi.fn(),
      files: null
    } as any;

    vi.spyOn(document, 'createElement').mockReturnValue(mockInput);
  });

  it('should create file input with correct attributes', () => {
    createFileSelector('audio/*', true);

    expect(document.createElement).toHaveBeenCalledWith('input');
    expect(mockInput.type).toBe('file');
    expect(mockInput.accept).toBe('audio/*');
    expect(mockInput.multiple).toBe(true);
    expect(mockInput.click).toHaveBeenCalled();
  });

  it('should resolve with files when file is selected', async () => {
    const mockFiles = [validAudioFile] as any;
    mockInput.files = mockFiles;

    const promise = createFileSelector('audio/*');

    // Simulate file selection
    if (mockInput.onchange) {
      mockInput.onchange({} as any);
    }

    const result = await promise;

    expect(result).toBe(mockFiles);
    expect(mockInput.remove).toHaveBeenCalled();
  });

  it('should resolve with null when cancelled', async () => {
    const promise = createFileSelector('audio/*');

    // Simulate cancellation
    if (mockInput.oncancel) {
      mockInput.oncancel();
    }

    const result = await promise;

    expect(result).toBeNull();
    expect(mockInput.remove).toHaveBeenCalled();
  });
});

describe('useDragAndDrop', () => {
  it('should handle drag over event', () => {
    const mockOnDrop = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(mockOnDrop));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] }
    } as any;

    act(() => {
      result.current.dragProps.onDragOver(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.isDragging).toBe(true);
  });

  it('should handle drag leave event', () => {
    const mockOnDrop = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(mockOnDrop));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] }
    } as any;

    // First drag over
    act(() => {
      result.current.dragProps.onDragOver(mockEvent);
    });

    // Then drag leave
    act(() => {
      result.current.dragProps.onDragLeave(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });

  it('should handle drop event without filter', () => {
    const mockOnDrop = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(mockOnDrop));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [validAudioFile, validImageFile] }
    } as any;

    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
    expect(mockOnDrop).toHaveBeenCalledWith([validAudioFile, validImageFile]);
  });

  it('should handle drop event with filter', () => {
    const mockOnDrop = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(mockOnDrop, ['audio']));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [validAudioFile, validImageFile] }
    } as any;

    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).toHaveBeenCalledWith([validAudioFile]);
  });

  it('should not call onDrop when no files match filter', () => {
    const mockOnDrop = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(mockOnDrop, ['video']));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [validAudioFile, validImageFile] }
    } as any;

    act(() => {
      result.current.dragProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).not.toHaveBeenCalled();
  });
});