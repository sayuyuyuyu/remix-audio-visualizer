import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayAudioUseCase } from '../../../app/domain/usecases/PlayAudioUseCase';
import { AudioFileEntity } from '../../../app/domain/entities/AudioFile';
import type { AudioRepository } from '../../../app/domain/repositories/AudioRepository';

describe('PlayAudioUseCase', () => {
  let playAudioUseCase: PlayAudioUseCase;
  let mockAudioRepository: AudioRepository;

  beforeEach(() => {
    mockAudioRepository = {
      createAudioFile: vi.fn(),
      getAudioFile: vi.fn(),
      getAudioData: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      initializeAudioContext: vi.fn(),
      disposeAudioContext: vi.fn(),
      isPlaying: vi.fn().mockReturnValue(false),
      setVolume: vi.fn(),
      setCurrentTime: vi.fn(),
      getDuration: vi.fn(),
      getCurrentTime: vi.fn(),
    };
    playAudioUseCase = new PlayAudioUseCase(mockAudioRepository);
  });

  describe('execute', () => {
    it('should play audio file successfully', async () => {
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.mp3', { type: 'audio/mp3' })
      );

      const result = await playAudioUseCase.execute({ audioFile });

      expect(mockAudioRepository.initializeAudioContext).toHaveBeenCalled();
      expect(mockAudioRepository.play).toHaveBeenCalledWith(audioFile);
      expect(result.success).toBe(true);
      expect(result.isPlaying).toBe(true);
    });

    it('should handle play errors', async () => {
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.mp3', { type: 'audio/mp3' })
      );
      
      vi.mocked(mockAudioRepository.play).mockRejectedValue(new Error('Play failed'));

      const result = await playAudioUseCase.execute({ audioFile });

      expect(result.success).toBe(false);
      expect(result.isPlaying).toBe(false);
      expect(result.message).toContain('Play failed');
    });

    it('should reject invalid audio files', async () => {
      const audioFile = new AudioFileEntity(
        new File(['test'], 'test.txt', { type: 'text/plain' })
      );

      const result = await playAudioUseCase.execute({ audioFile });

      expect(result.success).toBe(false);
      expect(result.isPlaying).toBe(false);
      expect(result.message).toContain('無効なオーディオファイル');
    });
  });

  describe('pause', () => {
    it('should pause audio successfully', async () => {
      const result = await playAudioUseCase.pause();

      expect(mockAudioRepository.pause).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.isPlaying).toBe(false);
    });

    it('should handle pause errors', async () => {
      vi.mocked(mockAudioRepository.pause).mockRejectedValue(new Error('Pause failed'));

      const result = await playAudioUseCase.pause();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Pause failed');
    });
  });

  describe('stop', () => {
    it('should stop audio successfully', async () => {
      const result = await playAudioUseCase.stop();

      expect(mockAudioRepository.stop).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.isPlaying).toBe(false);
    });

    it('should handle stop errors', async () => {
      vi.mocked(mockAudioRepository.stop).mockRejectedValue(new Error('Stop failed'));

      const result = await playAudioUseCase.stop();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Stop failed');
    });
  });
});