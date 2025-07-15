import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebAudioService } from '../../../app/infrastructure/audio/WebAudioService';
import { AudioFileEntity } from '../../../app/domain/entities/AudioFile';

// Mock Web Audio API
const mockAudioContext = {
  createMediaElementSource: vi.fn(),
  createAnalyser: vi.fn(),
  createGain: vi.fn(),
  destination: {},
  currentTime: 0,
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockAnalyser = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn(),
  getByteTimeDomainData: vi.fn(),
  smoothingTimeConstant: 0.8,
  minDecibels: -100,
  maxDecibels: -30,
};

const mockGain = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  gain: { value: 1 },
};

const mockMediaElementSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  mediaElement: {
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: 0,
    duration: 180,
    volume: 1,
    ended: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});

describe('WebAudioService', () => {
  let webAudioService: WebAudioService;
  let audioFile: AudioFileEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAudioContext.createMediaElementSource.mockReturnValue(mockMediaElementSource);
    mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
    mockAudioContext.createGain.mockReturnValue(mockGain);
    
    webAudioService = new WebAudioService();
    audioFile = new AudioFileEntity(
      new File(['test'], 'test.mp3', { type: 'audio/mp3' }),
      'test.mp3',
      1000,
      'audio/mp3'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize AudioContext successfully', () => {
      expect(webAudioService).toBeDefined();
    });

    it('should handle AudioContext creation failure', () => {
      vi.mocked(window.AudioContext).mockImplementationOnce(() => {
        throw new Error('AudioContext not supported');
      });

      expect(() => new WebAudioService()).toThrow('AudioContext not supported');
    });
  });

  describe('playAudio', () => {
    it('should play audio successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);

      expect(URL.createObjectURL).toHaveBeenCalledWith(audioFile.file);
      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalled();
    });

    it('should handle play errors', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockRejectedValue(new Error('Play failed'));

      await expect(webAudioService.playAudio(audioFile)).rejects.toThrow('Play failed');
    });

    it('should setup audio nodes correctly', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);

      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockMediaElementSource.connect).toHaveBeenCalledWith(mockAnalyser);
      expect(mockAnalyser.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });
  });

  describe('pauseAudio', () => {
    it('should pause audio successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      await webAudioService.pauseAudio();

      expect(mockMediaElementSource.mediaElement.pause).toHaveBeenCalled();
    });

    it('should handle pause when no audio is playing', async () => {
      await expect(webAudioService.pauseAudio()).resolves.not.toThrow();
    });
  });

  describe('stopAudio', () => {
    it('should stop audio successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      await webAudioService.stopAudio();

      expect(mockMediaElementSource.mediaElement.pause).toHaveBeenCalled();
      expect(mockMediaElementSource.mediaElement.currentTime).toBe(0);
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle stop when no audio is playing', async () => {
      await expect(webAudioService.stopAudio()).resolves.not.toThrow();
    });
  });

  describe('getCurrentTime', () => {
    it('should get current time successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);
      mockMediaElementSource.mediaElement.currentTime = 30.5;

      await webAudioService.playAudio(audioFile);
      const currentTime = await webAudioService.getCurrentTime();

      expect(currentTime).toBe(30.5);
    });

    it('should return 0 when no audio is loaded', async () => {
      const currentTime = await webAudioService.getCurrentTime();
      expect(currentTime).toBe(0);
    });
  });

  describe('setCurrentTime', () => {
    it('should set current time successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      await webAudioService.setCurrentTime(45.2);

      expect(mockMediaElementSource.mediaElement.currentTime).toBe(45.2);
    });

    it('should handle set time when no audio is loaded', async () => {
      await expect(webAudioService.setCurrentTime(30)).resolves.not.toThrow();
    });
  });

  describe('getVolume', () => {
    it('should get volume successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);
      mockMediaElementSource.mediaElement.volume = 0.7;

      await webAudioService.playAudio(audioFile);
      const volume = await webAudioService.getVolume();

      expect(volume).toBe(0.7);
    });

    it('should return 1 when no audio is loaded', async () => {
      const volume = await webAudioService.getVolume();
      expect(volume).toBe(1);
    });
  });

  describe('setVolume', () => {
    it('should set volume successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      await webAudioService.setVolume(0.5);

      expect(mockMediaElementSource.mediaElement.volume).toBe(0.5);
    });

    it('should handle set volume when no audio is loaded', async () => {
      await expect(webAudioService.setVolume(0.5)).resolves.not.toThrow();
    });
  });

  describe('getDuration', () => {
    it('should get duration successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);
      mockMediaElementSource.mediaElement.duration = 180.5;

      await webAudioService.playAudio(audioFile);
      const duration = await webAudioService.getDuration();

      expect(duration).toBe(180.5);
    });

    it('should return 0 when no audio is loaded', async () => {
      const duration = await webAudioService.getDuration();
      expect(duration).toBe(0);
    });
  });

  describe('getAnalyser', () => {
    it('should get analyser successfully', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      expect(analyser).toBe(mockAnalyser);
    });

    it('should return null when no audio is loaded', () => {
      const analyser = webAudioService.getAnalyser();
      expect(analyser).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      webAudioService.cleanup();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should handle cleanup when no resources are allocated', () => {
      expect(() => webAudioService.cleanup()).not.toThrow();
    });
  });
});