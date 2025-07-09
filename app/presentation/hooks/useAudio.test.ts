import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAudio } from './useAudio';
import { AudioFileEntity } from '../../domain/entities/AudioFile';
import { PlayAudioUseCase } from '../../domain/usecases/PlayAudioUseCase';
import { AudioRepositoryImpl } from '../../infrastructure/repositories/AudioRepositoryImpl';

// Mock dependencies
vi.mock('../../domain/usecases/PlayAudioUseCase');
vi.mock('../../infrastructure/repositories/AudioRepositoryImpl');

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

describe('useAudio', () => {
  let mockAudioRepository: AudioRepositoryImpl;
  let mockPlayAudioUseCase: PlayAudioUseCase;
  let validAudioFile: AudioFileEntity;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AudioRepositoryImpl
    mockAudioRepository = {
      initializeAudioContext: vi.fn(),
      disposeAudioContext: vi.fn(),
      onPlayStateChange: vi.fn().mockReturnValue(() => {}),
      onTimeUpdate: vi.fn().mockReturnValue(() => {}),
      setVolume: vi.fn(),
      setCurrentTime: vi.fn(),
      updateAudioSettings: vi.fn()
    } as any;

    // Mock PlayAudioUseCase
    mockPlayAudioUseCase = {
      execute: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn()
    } as any;

    vi.mocked(AudioRepositoryImpl).mockImplementation(() => mockAudioRepository);
    vi.mocked(PlayAudioUseCase).mockImplementation(() => mockPlayAudioUseCase);

    // Create valid audio file
    const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    validAudioFile = new AudioFileEntity(file);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAudio());

    expect(result.current.audioFile).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.volume).toBe(1.0);
    expect(result.current.audioRepository).toBe(mockAudioRepository);
  });

  it('should initialize repository and use case on mount', () => {
    renderHook(() => useAudio());

    expect(AudioRepositoryImpl).toHaveBeenCalled();
    expect(PlayAudioUseCase).toHaveBeenCalledWith(mockAudioRepository);
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useAudio());

    unmount();

    expect(mockAudioRepository.disposeAudioContext).toHaveBeenCalled();
  });

  describe('setAudioFile', () => {
    it('should set audio file and initialize audio context', async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      expect(result.current.audioFile).toBe(validAudioFile);
      expect(mockAudioRepository.initializeAudioContext).toHaveBeenCalled();
      expect(mockAudioRepository.onPlayStateChange).toHaveBeenCalled();
      expect(mockAudioRepository.onTimeUpdate).toHaveBeenCalled();
    });

    it('should clear audio file when null is passed', async () => {
      const { result } = renderHook(() => useAudio());

      // First set a file
      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      // Then clear it
      await act(async () => {
        await result.current.setAudioFile(null);
      });

      expect(result.current.audioFile).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
    });

    it('should handle audio context initialization error', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Audio context failed');
      vi.mocked(mockAudioRepository.initializeAudioContext).mockRejectedValue(error);

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      expect(result.current.error).toBe('Audio context failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during operation', async () => {
      const { result } = renderHook(() => useAudio());
      let loadingState = false;

      vi.mocked(mockAudioRepository.initializeAudioContext).mockImplementation(async () => {
        loadingState = result.current.isLoading;
        return Promise.resolve();
      });

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      expect(loadingState).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('play', () => {
    it('should play audio file successfully', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.execute).mockResolvedValue({
        success: true,
        isPlaying: true,
        message: 'Playing'
      });

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(mockPlayAudioUseCase.execute).toHaveBeenCalledWith({ audioFile: validAudioFile });
      expect(result.current.error).toBeNull();
    });

    it('should handle play error from use case', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.execute).mockResolvedValue({
        success: false,
        isPlaying: false,
        message: 'Play failed'
      });

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('Play failed');
    });

    it('should handle play when no audio file is set', async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('音声ファイルが設定されていません');
      expect(mockPlayAudioUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle play exception', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Play exception');
      vi.mocked(mockPlayAudioUseCase.execute).mockRejectedValue(error);

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('Play exception');
    });
  });

  describe('pause', () => {
    it('should pause audio successfully', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.pause).mockResolvedValue({
        success: true,
        isPlaying: false,
        message: 'Paused'
      });

      await act(async () => {
        await result.current.pause();
      });

      expect(mockPlayAudioUseCase.pause).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle pause error from use case', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.pause).mockResolvedValue({
        success: false,
        isPlaying: true,
        message: 'Pause failed'
      });

      await act(async () => {
        await result.current.pause();
      });

      expect(result.current.error).toBe('Pause failed');
    });

    it('should handle pause exception', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Pause exception');
      vi.mocked(mockPlayAudioUseCase.pause).mockRejectedValue(error);

      await act(async () => {
        await result.current.pause();
      });

      expect(result.current.error).toBe('Pause exception');
    });
  });

  describe('stop', () => {
    it('should stop audio successfully', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.stop).mockResolvedValue({
        success: true,
        isPlaying: false,
        message: 'Stopped'
      });

      await act(async () => {
        await result.current.stop();
      });

      expect(mockPlayAudioUseCase.stop).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle stop error from use case', async () => {
      const { result } = renderHook(() => useAudio());
      vi.mocked(mockPlayAudioUseCase.stop).mockResolvedValue({
        success: false,
        isPlaying: true,
        message: 'Stop failed'
      });

      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.error).toBe('Stop failed');
    });

    it('should handle stop exception', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Stop exception');
      vi.mocked(mockPlayAudioUseCase.stop).mockRejectedValue(error);

      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.error).toBe('Stop exception');
    });
  });

  describe('setVolume', () => {
    it('should set volume successfully', async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(mockAudioRepository.setVolume).toHaveBeenCalledWith(0.5);
      expect(result.current.volume).toBe(0.5);
    });

    it('should handle volume setting error', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Volume failed');
      vi.mocked(mockAudioRepository.setVolume).mockRejectedValue(error);

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(result.current.error).toBe('Volume failed');
    });
  });

  describe('setCurrentTime', () => {
    it('should set current time successfully', async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setCurrentTime(60);
      });

      expect(mockAudioRepository.setCurrentTime).toHaveBeenCalledWith(60);
    });

    it('should handle current time setting error', async () => {
      const { result } = renderHook(() => useAudio());
      const error = new Error('Current time failed');
      vi.mocked(mockAudioRepository.setCurrentTime).mockRejectedValue(error);

      await act(async () => {
        await result.current.setCurrentTime(60);
      });

      expect(result.current.error).toBe('Current time failed');
    });
  });

  describe('clearError', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAudio());

      // First set an error
      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBeTruthy();

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('event listeners', () => {
    it('should set up play state change listener', async () => {
      const { result } = renderHook(() => useAudio());
      const mockCallback = vi.fn();
      vi.mocked(mockAudioRepository.onPlayStateChange).mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return () => {};
      });

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      expect(mockAudioRepository.onPlayStateChange).toHaveBeenCalled();
    });

    it('should set up time update listener', async () => {
      const { result } = renderHook(() => useAudio());
      const mockCallback = vi.fn();
      vi.mocked(mockAudioRepository.onTimeUpdate).mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return () => {};
      });

      await act(async () => {
        await result.current.setAudioFile(validAudioFile);
      });

      expect(mockAudioRepository.onTimeUpdate).toHaveBeenCalled();
    });
  });
});