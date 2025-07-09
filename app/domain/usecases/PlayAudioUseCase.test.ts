import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayAudioUseCase } from './PlayAudioUseCase';
import { AudioFileEntity } from '../entities/AudioFile';
import type { AudioRepository } from '../repositories/AudioRepository';

// Mock AudioRepository
const mockAudioRepository: AudioRepository = {
  createAudioFile: vi.fn(),
  getAudioFile: vi.fn(),
  getAudioData: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  initializeAudioContext: vi.fn(),
  disposeAudioContext: vi.fn(),
  isPlaying: vi.fn(),
  setVolume: vi.fn(),
  setCurrentTime: vi.fn(),
  getDuration: vi.fn(),
  getCurrentTime: vi.fn()
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

describe('PlayAudioUseCase', () => {
  let useCase: PlayAudioUseCase;
  let validAudioFile: AudioFileEntity;
  let invalidAudioFile: AudioFileEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new PlayAudioUseCase(mockAudioRepository);

    // Valid audio file
    const validFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
    validAudioFile = new AudioFileEntity(validFile);

    // Invalid audio file
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(invalidFile, 'size', { value: 1024 });
    invalidAudioFile = new AudioFileEntity(invalidFile);
  });

  describe('execute', () => {
    it('should successfully play valid audio file', async () => {
      vi.mocked(mockAudioRepository.initializeAudioContext).mockResolvedValue();
      vi.mocked(mockAudioRepository.play).mockResolvedValue();

      const result = await useCase.execute({ audioFile: validAudioFile });

      expect(result.success).toBe(true);
      expect(result.message).toBe('音声の再生を開始しました');
      expect(result.isPlaying).toBe(true);
      expect(mockAudioRepository.initializeAudioContext).toHaveBeenCalled();
      expect(mockAudioRepository.play).toHaveBeenCalledWith(validAudioFile);
    });

    it('should reject invalid audio file', async () => {
      const result = await useCase.execute({ audioFile: invalidAudioFile });

      expect(result.success).toBe(false);
      expect(result.message).toBe('無効なオーディオファイルです');
      expect(result.isPlaying).toBe(false);
      expect(mockAudioRepository.initializeAudioContext).not.toHaveBeenCalled();
      expect(mockAudioRepository.play).not.toHaveBeenCalled();
    });

    it('should reject file exceeding size limit', async () => {
      const largeFile = new File(['content'], 'large.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(largeFile, 'size', { value: 60 * 1024 * 1024 }); // 60MB
      const largeAudioFile = new AudioFileEntity(largeFile);

      const result = await useCase.execute({ audioFile: largeAudioFile });

      expect(result.success).toBe(false);
      expect(result.message).toBe('ファイルサイズが大きすぎます（50MB以下にしてください）');
      expect(result.isPlaying).toBe(false);
      expect(mockAudioRepository.initializeAudioContext).not.toHaveBeenCalled();
      expect(mockAudioRepository.play).not.toHaveBeenCalled();
    });

    it('should handle audio context initialization error', async () => {
      const error = new Error('Audio context initialization failed');
      vi.mocked(mockAudioRepository.initializeAudioContext).mockRejectedValue(error);

      const result = await useCase.execute({ audioFile: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.message).toBe('再生エラー: Audio context initialization failed');
      expect(result.isPlaying).toBe(false);
      expect(mockAudioRepository.play).not.toHaveBeenCalled();
    });

    it('should handle play error', async () => {
      vi.mocked(mockAudioRepository.initializeAudioContext).mockResolvedValue();
      const error = new Error('Playback failed');
      vi.mocked(mockAudioRepository.play).mockRejectedValue(error);

      const result = await useCase.execute({ audioFile: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.message).toBe('再生エラー: Playback failed');
      expect(result.isPlaying).toBe(false);
    });

    it('should handle unknown error', async () => {
      vi.mocked(mockAudioRepository.initializeAudioContext).mockResolvedValue();
      vi.mocked(mockAudioRepository.play).mockRejectedValue('Unknown error');

      const result = await useCase.execute({ audioFile: validAudioFile });

      expect(result.success).toBe(false);
      expect(result.message).toBe('再生エラー: 不明なエラー');
      expect(result.isPlaying).toBe(false);
    });
  });

  describe('pause', () => {
    it('should successfully pause audio', async () => {
      vi.mocked(mockAudioRepository.pause).mockResolvedValue();

      const result = await useCase.pause();

      expect(result.success).toBe(true);
      expect(result.message).toBe('音声を一時停止しました');
      expect(result.isPlaying).toBe(false);
      expect(mockAudioRepository.pause).toHaveBeenCalled();
    });

    it('should handle pause error', async () => {
      const error = new Error('Pause failed');
      vi.mocked(mockAudioRepository.pause).mockRejectedValue(error);
      vi.mocked(mockAudioRepository.isPlaying).mockReturnValue(true);

      const result = await useCase.pause();

      expect(result.success).toBe(false);
      expect(result.message).toBe('一時停止エラー: Pause failed');
      expect(result.isPlaying).toBe(true);
    });

    it('should handle unknown pause error', async () => {
      vi.mocked(mockAudioRepository.pause).mockRejectedValue('Unknown error');
      vi.mocked(mockAudioRepository.isPlaying).mockReturnValue(false);

      const result = await useCase.pause();

      expect(result.success).toBe(false);
      expect(result.message).toBe('一時停止エラー: 不明なエラー');
      expect(result.isPlaying).toBe(false);
    });
  });

  describe('stop', () => {
    it('should successfully stop audio', async () => {
      vi.mocked(mockAudioRepository.stop).mockResolvedValue();

      const result = await useCase.stop();

      expect(result.success).toBe(true);
      expect(result.message).toBe('音声を停止しました');
      expect(result.isPlaying).toBe(false);
      expect(mockAudioRepository.stop).toHaveBeenCalled();
    });

    it('should handle stop error', async () => {
      const error = new Error('Stop failed');
      vi.mocked(mockAudioRepository.stop).mockRejectedValue(error);
      vi.mocked(mockAudioRepository.isPlaying).mockReturnValue(true);

      const result = await useCase.stop();

      expect(result.success).toBe(false);
      expect(result.message).toBe('停止エラー: Stop failed');
      expect(result.isPlaying).toBe(true);
    });

    it('should handle unknown stop error', async () => {
      vi.mocked(mockAudioRepository.stop).mockRejectedValue('Unknown error');
      vi.mocked(mockAudioRepository.isPlaying).mockReturnValue(false);

      const result = await useCase.stop();

      expect(result.success).toBe(false);
      expect(result.message).toBe('停止エラー: 不明なエラー');
      expect(result.isPlaying).toBe(false);
    });
  });
});