import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadFileUseCase } from '../../app/domain/usecases/UploadFileUseCase';
import { PlayAudioUseCase } from '../../app/domain/usecases/PlayAudioUseCase';
import { FileRepositoryImpl } from '../../app/infrastructure/repositories/FileRepositoryImpl';
import { AudioRepositoryImpl } from '../../app/infrastructure/repositories/AudioRepositoryImpl';
import { WebAudioService } from '../../app/infrastructure/audio/WebAudioService';
import { AudioFileEntity } from '../../app/domain/entities/AudioFile';

// Mock Web Audio API
const mockAudioContext = {
  createMediaElementSource: vi.fn(),
  createAnalyser: vi.fn(),
  createGain: vi.fn(),
  destination: {},
  close: vi.fn(),
  resume: vi.fn(),
  state: 'running',
};

const mockAnalyser = {
  connect: vi.fn(),
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn(),
  getByteTimeDomainData: vi.fn(),
};

const mockGain = {
  connect: vi.fn(),
  gain: { value: 1 },
};

const mockMediaElementSource = {
  connect: vi.fn(),
  mediaElement: {
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: 0,
    duration: 180,
    volume: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});

describe('Audio Workflow Integration Tests', () => {
  let fileRepository: FileRepositoryImpl;
  let audioRepository: AudioRepositoryImpl;
  let webAudioService: WebAudioService;
  let uploadFileUseCase: UploadFileUseCase;
  let playAudioUseCase: PlayAudioUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAudioContext.createMediaElementSource.mockReturnValue(mockMediaElementSource);
    mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
    mockAudioContext.createGain.mockReturnValue(mockGain);
    
    webAudioService = new WebAudioService();
    fileRepository = new FileRepositoryImpl();
    audioRepository = new AudioRepositoryImpl(webAudioService);
    uploadFileUseCase = new UploadFileUseCase(fileRepository);
    playAudioUseCase = new PlayAudioUseCase(audioRepository);
  });

  describe('Complete Audio Upload and Play Workflow', () => {
    it('should upload and play audio file successfully', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const mockURL = 'blob:test-url';
      
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      // Step 1: Upload file
      const audioFile = await uploadFileUseCase.uploadAudioFile(file);
      expect(audioFile).toBeInstanceOf(AudioFileEntity);
      expect(audioFile.name).toBe('test.mp3');
      expect(audioFile.type).toBe('audio/mp3');

      // Step 2: Play audio
      await playAudioUseCase.play(audioFile);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalled();
      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    });

    it('should handle upload validation failure', async () => {
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });

      await expect(uploadFileUseCase.uploadAudioFile(invalidFile)).rejects.toThrow();
    });

    it('should handle play audio failure after successful upload', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const mockURL = 'blob:test-url';
      
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      mockMediaElementSource.mediaElement.play.mockRejectedValue(new Error('Play failed'));

      const audioFile = await uploadFileUseCase.uploadAudioFile(file);
      
      await expect(playAudioUseCase.play(audioFile)).rejects.toThrow('Play failed');
    });
  });

  describe('Audio Control Integration', () => {
    let audioFile: AudioFileEntity;

    beforeEach(async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      audioFile = await uploadFileUseCase.uploadAudioFile(file);
      
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);
      
      await playAudioUseCase.play(audioFile);
    });

    it('should control audio playback flow', async () => {
      // Play -> Pause -> Play -> Stop
      await playAudioUseCase.pause();
      expect(mockMediaElementSource.mediaElement.pause).toHaveBeenCalled();

      await playAudioUseCase.play(audioFile);
      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalledTimes(2);

      await playAudioUseCase.stop();
      expect(mockMediaElementSource.mediaElement.pause).toHaveBeenCalledTimes(2);
      expect(mockMediaElementSource.mediaElement.currentTime).toBe(0);
    });

    it('should handle volume and seeking', async () => {
      await playAudioUseCase.setVolume(0.5);
      expect(mockMediaElementSource.mediaElement.volume).toBe(0.5);

      const volume = await playAudioUseCase.getVolume();
      expect(volume).toBe(0.5);

      await playAudioUseCase.seek(30);
      expect(mockMediaElementSource.mediaElement.currentTime).toBe(30);

      const currentTime = await playAudioUseCase.getCurrentTime();
      expect(currentTime).toBe(30);
    });

    it('should get audio duration', async () => {
      mockMediaElementSource.mediaElement.duration = 180;
      
      const duration = await playAudioUseCase.getDuration();
      expect(duration).toBe(180);
    });
  });

  describe('Multiple File Upload Integration', () => {
    it('should handle multiple file uploads', async () => {
      const file1 = new File(['audio1'], 'test1.mp3', { type: 'audio/mp3' });
      const file2 = new File(['audio2'], 'test2.mp3', { type: 'audio/mp3' });

      const audioFile1 = await uploadFileUseCase.uploadAudioFile(file1);
      const audioFile2 = await uploadFileUseCase.uploadAudioFile(file2);

      expect(audioFile1.name).toBe('test1.mp3');
      expect(audioFile2.name).toBe('test2.mp3');

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await playAudioUseCase.play(audioFile1);
      await playAudioUseCase.stop();
      await playAudioUseCase.play(audioFile2);

      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalledTimes(2);
    });

    it('should handle switching between audio files', async () => {
      const file1 = new File(['audio1'], 'test1.mp3', { type: 'audio/mp3' });
      const file2 = new File(['audio2'], 'test2.mp3', { type: 'audio/mp3' });

      const audioFile1 = await uploadFileUseCase.uploadAudioFile(file1);
      const audioFile2 = await uploadFileUseCase.uploadAudioFile(file2);

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      // Play first file
      await playAudioUseCase.play(audioFile1);
      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalledTimes(1);

      // Switch to second file without stopping first
      await playAudioUseCase.play(audioFile2);
      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from upload errors', async () => {
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      const validFile = new File(['valid audio'], 'test.mp3', { type: 'audio/mp3' });

      await expect(uploadFileUseCase.uploadAudioFile(invalidFile)).rejects.toThrow();
      
      const audioFile = await uploadFileUseCase.uploadAudioFile(validFile);
      expect(audioFile).toBeInstanceOf(AudioFileEntity);
    });

    it('should handle audio context errors', async () => {
      vi.mocked(window.AudioContext).mockImplementationOnce(() => {
        throw new Error('AudioContext not supported');
      });

      expect(() => new WebAudioService()).toThrow('AudioContext not supported');
    });

    it('should handle play errors gracefully', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = await uploadFileUseCase.uploadAudioFile(file);

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockRejectedValue(new Error('Play failed'));

      await expect(playAudioUseCase.play(audioFile)).rejects.toThrow('Play failed');
      
      // Should be able to try again
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);
      await expect(playAudioUseCase.play(audioFile)).resolves.not.toThrow();
    });
  });

  describe('Resource Management Integration', () => {
    it('should properly manage object URLs', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = await uploadFileUseCase.uploadAudioFile(file);
      
      const mockURL = 'blob:test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await playAudioUseCase.play(audioFile);
      await playAudioUseCase.stop();

      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockURL);
    });

    it('should cleanup audio context on service cleanup', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = await uploadFileUseCase.uploadAudioFile(file);

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await playAudioUseCase.play(audioFile);
      webAudioService.cleanup();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('File Validation Integration', () => {
    it('should validate file types correctly', async () => {
      const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
      const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
      const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });

      await expect(uploadFileUseCase.uploadAudioFile(audioFile)).resolves.toBeInstanceOf(AudioFileEntity);
      await expect(uploadFileUseCase.uploadAudioFile(videoFile)).rejects.toThrow();
      await expect(uploadFileUseCase.uploadAudioFile(textFile)).rejects.toThrow();
    });

    it('should validate file sizes', async () => {
      const largeContent = new Array(100 * 1024 * 1024).fill('a').join(''); // 100MB
      const largeFile = new File([largeContent], 'large.mp3', { type: 'audio/mp3' });

      await expect(uploadFileUseCase.uploadAudioFile(largeFile)).rejects.toThrow();
    });

    it('should handle empty files', async () => {
      const emptyFile = new File([], 'empty.mp3', { type: 'audio/mp3' });

      await expect(uploadFileUseCase.uploadAudioFile(emptyFile)).rejects.toThrow();
    });
  });

  describe('Concurrent Operations Integration', () => {
    it('should handle concurrent uploads', async () => {
      const file1 = new File(['audio1'], 'test1.mp3', { type: 'audio/mp3' });
      const file2 = new File(['audio2'], 'test2.mp3', { type: 'audio/mp3' });

      const [audioFile1, audioFile2] = await Promise.all([
        uploadFileUseCase.uploadAudioFile(file1),
        uploadFileUseCase.uploadAudioFile(file2),
      ]);

      expect(audioFile1.name).toBe('test1.mp3');
      expect(audioFile2.name).toBe('test2.mp3');
    });

    it('should handle rapid play/pause cycles', async () => {
      const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
      const audioFile = await uploadFileUseCase.uploadAudioFile(file);

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await playAudioUseCase.play(audioFile);
      await playAudioUseCase.pause();
      await playAudioUseCase.play(audioFile);
      await playAudioUseCase.pause();
      await playAudioUseCase.play(audioFile);

      expect(mockMediaElementSource.mediaElement.play).toHaveBeenCalledTimes(3);
      expect(mockMediaElementSource.mediaElement.pause).toHaveBeenCalledTimes(2);
    });
  });
});