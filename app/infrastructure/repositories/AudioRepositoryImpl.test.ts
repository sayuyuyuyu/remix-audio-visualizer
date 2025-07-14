import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioFileEntity } from '../../domain/entities/AudioFile';
import { WebAudioService } from '../audio/WebAudioService';
import { AudioRepositoryImpl } from './AudioRepositoryImpl';

// Mock WebAudioService
vi.mock('../audio/WebAudioService', () => ({
  WebAudioService: vi.fn().mockImplementation(() => ({
    getAnalysisData: vi.fn(),
    connectAudioElement: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    initializeAudioContext: vi.fn(),
    dispose: vi.fn(),
    isPlaying: vi.fn(),
    setVolume: vi.fn(),
    setCurrentTime: vi.fn(),
    getDuration: vi.fn(),
    getCurrentTime: vi.fn(),
    setFFTSize: vi.fn(),
    setSmoothingTimeConstant: vi.fn()
  }))
}));

// Mock Audio constructor
const mockAudio = {
  src: '',
  play: vi.fn(),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  duration: 120,
  currentTime: 0
};

Object.defineProperty(global, 'Audio', {
  value: vi.fn().mockImplementation(() => mockAudio)
});

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

describe('AudioRepositoryImpl', () => {
  let repository: AudioRepositoryImpl;
  let mockWebAudioService: WebAudioService;
  let validAudioFile: AudioFileEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AudioRepositoryImpl();
    mockWebAudioService = repository.getWebAudioService();

    const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    validAudioFile = new AudioFileEntity(file);
  });

  describe('createAudioFile', () => {
    it('should create AudioFileEntity from file', async () => {
      const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = await repository.createAudioFile(file);

      expect(result).toBeInstanceOf(AudioFileEntity);
      expect(result.name).toBe('test.mp3');
      expect(result.type).toBe('audio/mpeg');
    });
  });

  describe('getAudioFile', () => {
    it('should return audio file if id matches current file', async () => {
      // First play a file to set currentAudioFile
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();
      await repository.play(validAudioFile);

      const result = await repository.getAudioFile(validAudioFile.id);

      expect(result).toBe(validAudioFile);
    });

    it('should return null if id does not match current file', async () => {
      const result = await repository.getAudioFile('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAudioData', () => {
    it('should return frequency data when available', async () => {
      const mockFrequencyData = new Uint8Array([1, 2, 3, 4]);
      vi.mocked(mockWebAudioService.getAnalysisData).mockReturnValue({
        frequencyData: mockFrequencyData,
        timeDomainData: new Uint8Array(),
        bufferLength: 512,
        sampleRate: 44100
      });

      const result = await repository.getAudioData();

      expect(result).toBe(mockFrequencyData);
    });

    it('should return null when no analysis data available', async () => {
      vi.mocked(mockWebAudioService.getAnalysisData).mockReturnValue(null);

      const result = await repository.getAudioData();

      expect(result).toBeNull();
    });
  });

  describe('play', () => {
    it('should play audio file successfully', async () => {
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();

      await repository.play(validAudioFile);

      expect(Audio).toHaveBeenCalledWith(validAudioFile.url);
      expect(mockWebAudioService.connectAudioElement).toHaveBeenCalled();
      expect(mockWebAudioService.play).toHaveBeenCalled();
    });

    it('should reuse audio element for same file', async () => {
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();

      // Play the same file twice
      await repository.play(validAudioFile);
      await repository.play(validAudioFile);

      expect(Audio).toHaveBeenCalledTimes(1);
      expect(mockWebAudioService.connectAudioElement).toHaveBeenCalledTimes(1);
      expect(mockWebAudioService.play).toHaveBeenCalledTimes(2);
    });

    it('should create new audio element for different file', async () => {
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();

      const file2 = new File(['content'], 'test2.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(file2, 'size', { value: 1024 });
      const audioFile2 = new AudioFileEntity(file2);

      await repository.play(validAudioFile);
      await repository.play(audioFile2);

      expect(Audio).toHaveBeenCalledTimes(2);
      expect(mockWebAudioService.connectAudioElement).toHaveBeenCalledTimes(2);
    });

    it('should handle play error', async () => {
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      const error = new Error('Play failed');
      vi.mocked(mockWebAudioService.play).mockRejectedValue(error);

      await expect(repository.play(validAudioFile)).rejects.toThrow('音声の再生に失敗しました: Play failed');
    });

    it('should handle unknown error', async () => {
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockRejectedValue('Unknown error');

      await expect(repository.play(validAudioFile)).rejects.toThrow('音声の再生に失敗しました: 不明なエラー');
    });
  });

  describe('pause', () => {
    it('should pause audio', async () => {
      await repository.pause();

      expect(mockWebAudioService.pause).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop audio', async () => {
      await repository.stop();

      expect(mockWebAudioService.stop).toHaveBeenCalled();
    });
  });

  describe('initializeAudioContext', () => {
    it('should initialize audio context', async () => {
      vi.mocked(mockWebAudioService.initializeAudioContext).mockResolvedValue();

      await repository.initializeAudioContext();

      expect(mockWebAudioService.initializeAudioContext).toHaveBeenCalled();
    });
  });

  describe('disposeAudioContext', () => {
    it('should dispose audio context and clean up resources', async () => {
      // Set up current audio file
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();
      await repository.play(validAudioFile);

      await repository.disposeAudioContext();

      expect(mockWebAudioService.dispose).toHaveBeenCalled();
      expect(repository.getCurrentAudioFile()).toBeNull();
    });
  });

  describe('isPlaying', () => {
    it('should return playing state from web audio service', () => {
      vi.mocked(mockWebAudioService.isPlaying).mockReturnValue(true);

      const result = repository.isPlaying();

      expect(result).toBe(true);
      expect(mockWebAudioService.isPlaying).toHaveBeenCalled();
    });
  });

  describe('setVolume', () => {
    it('should set volume through web audio service', async () => {
      await repository.setVolume(0.5);

      expect(mockWebAudioService.setVolume).toHaveBeenCalledWith(0.5);
    });
  });

  describe('setCurrentTime', () => {
    it('should set current time through web audio service', async () => {
      await repository.setCurrentTime(60);

      expect(mockWebAudioService.setCurrentTime).toHaveBeenCalledWith(60);
    });
  });

  describe('getDuration', () => {
    it('should get duration from web audio service', async () => {
      vi.mocked(mockWebAudioService.getDuration).mockReturnValue(120);

      const result = await repository.getDuration();

      expect(result).toBe(120);
      expect(mockWebAudioService.getDuration).toHaveBeenCalled();
    });
  });

  describe('getCurrentTime', () => {
    it('should get current time from web audio service', async () => {
      vi.mocked(mockWebAudioService.getCurrentTime).mockReturnValue(30);

      const result = await repository.getCurrentTime();

      expect(result).toBe(30);
      expect(mockWebAudioService.getCurrentTime).toHaveBeenCalled();
    });
  });

  describe('updateAudioSettings', () => {
    it('should update fft size', async () => {
      await repository.updateAudioSettings({ fftSize: 1024 });

      expect(mockWebAudioService.setFFTSize).toHaveBeenCalledWith(1024);
    });

    it('should update smoothing time constant', async () => {
      await repository.updateAudioSettings({ smoothingTimeConstant: 0.5 });

      expect(mockWebAudioService.setSmoothingTimeConstant).toHaveBeenCalledWith(0.5);
    });

    it('should update volume', async () => {
      await repository.updateAudioSettings({ volume: 0.8 });

      expect(mockWebAudioService.setVolume).toHaveBeenCalledWith(0.8);
    });

    it('should update multiple settings at once', async () => {
      await repository.updateAudioSettings({
        fftSize: 2048,
        smoothingTimeConstant: 0.3,
        volume: 0.6
      });

      expect(mockWebAudioService.setFFTSize).toHaveBeenCalledWith(2048);
      expect(mockWebAudioService.setSmoothingTimeConstant).toHaveBeenCalledWith(0.3);
      expect(mockWebAudioService.setVolume).toHaveBeenCalledWith(0.6);
    });
  });

  describe('onPlayStateChange', () => {
    it('should set up event listeners when audio element exists', async () => {
      // Set up audio element
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();
      await repository.play(validAudioFile);

      const callback = vi.fn();
      const cleanup = repository.onPlayStateChange(callback);

      expect(mockAudio.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(mockAudio.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));

      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should return empty cleanup function when no audio element', () => {
      const callback = vi.fn();
      const cleanup = repository.onPlayStateChange(callback);

      expect(cleanup).toBeInstanceOf(Function);
      expect(mockAudio.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('onTimeUpdate', () => {
    it('should set up time update listener when audio element exists', async () => {
      // Set up audio element
      vi.mocked(mockWebAudioService.connectAudioElement).mockResolvedValue();
      vi.mocked(mockWebAudioService.play).mockResolvedValue();
      await repository.play(validAudioFile);

      const callback = vi.fn();
      const cleanup = repository.onTimeUpdate(callback);

      expect(mockAudio.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should return empty cleanup function when no audio element', () => {
      const callback = vi.fn();
      const cleanup = repository.onTimeUpdate(callback);

      expect(cleanup).toBeInstanceOf(Function);
      expect(mockAudio.addEventListener).not.toHaveBeenCalled();
    });
  });
});
