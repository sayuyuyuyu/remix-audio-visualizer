import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayAudioUseCase } from '../../../app/domain/usecases/PlayAudioUseCase';
import { AudioRepository } from '../../../app/domain/repositories/AudioRepository';
import { AudioFileEntity } from '../../../app/domain/entities/AudioFile';

describe('PlayAudioUseCase', () => {
  let playAudioUseCase: PlayAudioUseCase;
  let mockAudioRepository: AudioRepository;

  beforeEach(() => {
    mockAudioRepository = {
      playAudio: vi.fn(),
      pauseAudio: vi.fn(),
      stopAudio: vi.fn(),
      getCurrentTime: vi.fn(),
      setCurrentTime: vi.fn(),
      getVolume: vi.fn(),
      setVolume: vi.fn(),
      getDuration: vi.fn(),
    };
    playAudioUseCase = new PlayAudioUseCase(mockAudioRepository);
  });

  describe('play', () => {
    it('should play audio file successfully', async () => {
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.mp3', { type: 'audio/mp3' }),
        'test.mp3',
        1000,
        'audio/mp3'
      );

      await playAudioUseCase.play(audioFile);

      expect(mockAudioRepository.playAudio).toHaveBeenCalledWith(audioFile);
    });

    it('should handle play errors', async () => {
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.mp3', { type: 'audio/mp3' }),
        'test.mp3',
        1000,
        'audio/mp3'
      );

      vi.mocked(mockAudioRepository.playAudio).mockRejectedValue(new Error('Play failed'));

      await expect(playAudioUseCase.play(audioFile)).rejects.toThrow('Play failed');
    });
  });

  describe('pause', () => {
    it('should pause audio successfully', async () => {
      await playAudioUseCase.pause();

      expect(mockAudioRepository.pauseAudio).toHaveBeenCalled();
    });

    it('should handle pause errors', async () => {
      vi.mocked(mockAudioRepository.pauseAudio).mockRejectedValue(new Error('Pause failed'));

      await expect(playAudioUseCase.pause()).rejects.toThrow('Pause failed');
    });
  });

  describe('stop', () => {
    it('should stop audio successfully', async () => {
      await playAudioUseCase.stop();

      expect(mockAudioRepository.stopAudio).toHaveBeenCalled();
    });

    it('should handle stop errors', async () => {
      vi.mocked(mockAudioRepository.stopAudio).mockRejectedValue(new Error('Stop failed'));

      await expect(playAudioUseCase.stop()).rejects.toThrow('Stop failed');
    });
  });

  describe('seek', () => {
    it('should seek to specific time successfully', async () => {
      const time = 30.5;

      await playAudioUseCase.seek(time);

      expect(mockAudioRepository.setCurrentTime).toHaveBeenCalledWith(time);
    });

    it('should handle seek errors', async () => {
      vi.mocked(mockAudioRepository.setCurrentTime).mockRejectedValue(new Error('Seek failed'));

      await expect(playAudioUseCase.seek(30)).rejects.toThrow('Seek failed');
    });

    it('should validate time parameter', async () => {
      await expect(playAudioUseCase.seek(-1)).rejects.toThrow('Time must be non-negative');
    });
  });

  describe('setVolume', () => {
    it('should set volume successfully', async () => {
      const volume = 0.5;

      await playAudioUseCase.setVolume(volume);

      expect(mockAudioRepository.setVolume).toHaveBeenCalledWith(volume);
    });

    it('should handle set volume errors', async () => {
      vi.mocked(mockAudioRepository.setVolume).mockRejectedValue(new Error('Set volume failed'));

      await expect(playAudioUseCase.setVolume(0.5)).rejects.toThrow('Set volume failed');
    });

    it('should validate volume parameter', async () => {
      await expect(playAudioUseCase.setVolume(-0.1)).rejects.toThrow('Volume must be between 0 and 1');
      await expect(playAudioUseCase.setVolume(1.1)).rejects.toThrow('Volume must be between 0 and 1');
    });
  });

  describe('getCurrentTime', () => {
    it('should get current time successfully', async () => {
      const expectedTime = 25.5;
      vi.mocked(mockAudioRepository.getCurrentTime).mockResolvedValue(expectedTime);

      const result = await playAudioUseCase.getCurrentTime();

      expect(result).toBe(expectedTime);
      expect(mockAudioRepository.getCurrentTime).toHaveBeenCalled();
    });

    it('should handle get current time errors', async () => {
      vi.mocked(mockAudioRepository.getCurrentTime).mockRejectedValue(new Error('Get time failed'));

      await expect(playAudioUseCase.getCurrentTime()).rejects.toThrow('Get time failed');
    });
  });

  describe('getDuration', () => {
    it('should get duration successfully', async () => {
      const expectedDuration = 180.5;
      vi.mocked(mockAudioRepository.getDuration).mockResolvedValue(expectedDuration);

      const result = await playAudioUseCase.getDuration();

      expect(result).toBe(expectedDuration);
      expect(mockAudioRepository.getDuration).toHaveBeenCalled();
    });

    it('should handle get duration errors', async () => {
      vi.mocked(mockAudioRepository.getDuration).mockRejectedValue(new Error('Get duration failed'));

      await expect(playAudioUseCase.getDuration()).rejects.toThrow('Get duration failed');
    });
  });

  describe('getVolume', () => {
    it('should get volume successfully', async () => {
      const expectedVolume = 0.8;
      vi.mocked(mockAudioRepository.getVolume).mockResolvedValue(expectedVolume);

      const result = await playAudioUseCase.getVolume();

      expect(result).toBe(expectedVolume);
      expect(mockAudioRepository.getVolume).toHaveBeenCalled();
    });

    it('should handle get volume errors', async () => {
      vi.mocked(mockAudioRepository.getVolume).mockRejectedValue(new Error('Get volume failed'));

      await expect(playAudioUseCase.getVolume()).rejects.toThrow('Get volume failed');
    });
  });
});