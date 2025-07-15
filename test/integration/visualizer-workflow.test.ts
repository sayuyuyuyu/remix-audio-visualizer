import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualizerEngine } from '../../app/infrastructure/audio/VisualizerEngine';
import { WebAudioService } from '../../app/infrastructure/audio/WebAudioService';
import { VisualizerConfigEntity } from '../../app/domain/entities/VisualizerConfig';
import { AudioFileEntity } from '../../app/domain/entities/AudioFile';

// Mock Canvas API
const mockCanvas = {
  getContext: vi.fn(),
  width: 800,
  height: 600,
};

const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(),
  createRadialGradient: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
};

const mockGradient = {
  addColorStop: vi.fn(),
};

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
  smoothingTimeConstant: 0.8,
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});

describe('Visualizer Workflow Integration Tests', () => {
  let webAudioService: WebAudioService;
  let visualizerEngine: VisualizerEngine;
  let audioFile: AudioFileEntity;
  let config: VisualizerConfigEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockContext.createLinearGradient.mockReturnValue(mockGradient);
    mockContext.createRadialGradient.mockReturnValue(mockGradient);
    
    mockAudioContext.createMediaElementSource.mockReturnValue(mockMediaElementSource);
    mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
    mockAudioContext.createGain.mockReturnValue(mockGain);
    
    webAudioService = new WebAudioService();
    visualizerEngine = new VisualizerEngine();
    
    const file = new File(['test audio content'], 'test.mp3', { type: 'audio/mp3' });
    audioFile = new AudioFileEntity(file, 'test.mp3', 1000, 'audio/mp3');
    config = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
  });

  describe('Complete Audio Visualization Workflow', () => {
    it('should setup audio, get analyser, and render visualization', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      // Setup audio
      await webAudioService.playAudio(audioFile);
      
      // Get analyser
      const analyser = webAudioService.getAnalyser();
      expect(analyser).toBe(mockAnalyser);
      
      // Configure analyser based on config
      if (analyser) {
        analyser.fftSize = config.fftSize;
        analyser.smoothingTimeConstant = config.smoothing;
      }
      
      // Mock frequency data
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });
      
      // Render visualization
      visualizerEngine.render(mockCanvas as any, analyser, config);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should handle different visualizer modes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      const modes = ['circular', 'waveform', 'frequencyBars', 'solarSystem', 'particleField'];
      
      for (const mode of modes) {
        vi.clearAllMocks();
        const modeConfig = new VisualizerConfigEntity(mode as any, 256, 0.8, 1.0, 'rainbow');
        
        if (mode === 'waveform') {
          mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
            for (let i = 0; i < array.length; i++) {
              array[i] = 128 + Math.sin(i * 0.1) * 50;
            }
          });
        } else {
          mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
          });
        }
        
        visualizerEngine.render(mockCanvas as any, analyser, modeConfig);
        
        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(mockContext.clearRect).toHaveBeenCalled();
        expect(mockContext.beginPath).toHaveBeenCalled();
      }
    });

    it('should handle different themes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      const themes = ['rainbow', 'blue', 'green', 'orange', 'purple'];
      
      for (const theme of themes) {
        vi.clearAllMocks();
        const themeConfig = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, theme as any);
        
        mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = 128;
          }
        });
        
        visualizerEngine.render(mockCanvas as any, analyser, themeConfig);
        
        expect(mockContext.createRadialGradient).toHaveBeenCalled();
        expect(mockGradient.addColorStop).toHaveBeenCalled();
      }
    });
  });

  describe('Real-time Visualization Updates', () => {
    it('should handle continuous rendering loop', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Simulate multiple frames
      for (let frame = 0; frame < 10; frame++) {
        vi.clearAllMocks();
        
        mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
        });
        
        visualizerEngine.render(mockCanvas as any, analyser, config);
        
        expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
        expect(mockContext.beginPath).toHaveBeenCalled();
      }
    });

    it('should handle changing audio data', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Simulate quiet audio
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 10; // Very quiet
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, config);
      
      // Simulate loud audio
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 250; // Very loud
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, config);
      
      expect(mockContext.clearRect).toHaveBeenCalledTimes(2);
      expect(mockContext.beginPath).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Changes During Playback', () => {
    it('should handle FFT size changes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Start with 256 FFT size
      let currentConfig = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
      mockAnalyser.fftSize = 256;
      mockAnalyser.frequencyBinCount = 128;
      
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < 128; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      // Change to 512 FFT size
      currentConfig = new VisualizerConfigEntity('circular', 512, 0.8, 1.0, 'rainbow');
      mockAnalyser.fftSize = 512;
      mockAnalyser.frequencyBinCount = 256;
      
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < 256; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      expect(mockContext.clearRect).toHaveBeenCalledTimes(2);
    });

    it('should handle sensitivity changes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Low sensitivity
      let currentConfig = new VisualizerConfigEntity('circular', 256, 0.8, 0.5, 'rainbow');
      
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      // High sensitivity
      currentConfig = new VisualizerConfigEntity('circular', 256, 0.8, 2.0, 'rainbow');
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      expect(mockContext.clearRect).toHaveBeenCalledTimes(2);
      expect(mockContext.beginPath).toHaveBeenCalledTimes(2);
    });

    it('should handle smoothing changes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Low smoothing
      let currentConfig = new VisualizerConfigEntity('circular', 256, 0.1, 1.0, 'rainbow');
      mockAnalyser.smoothingTimeConstant = 0.1;
      
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      // High smoothing
      currentConfig = new VisualizerConfigEntity('circular', 256, 0.9, 1.0, 'rainbow');
      mockAnalyser.smoothingTimeConstant = 0.9;
      
      visualizerEngine.render(mockCanvas as any, analyser, currentConfig);
      
      expect(mockContext.clearRect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Canvas Size and Responsive Rendering', () => {
    it('should handle different canvas sizes', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      // Small canvas
      const smallCanvas = { ...mockCanvas, width: 400, height: 300 };
      visualizerEngine.render(smallCanvas as any, analyser, config);
      expect(mockContext.clearRect).toHaveBeenLastCalledWith(0, 0, 400, 300);

      // Large canvas
      const largeCanvas = { ...mockCanvas, width: 1920, height: 1080 };
      visualizerEngine.render(largeCanvas as any, analyser, config);
      expect(mockContext.clearRect).toHaveBeenLastCalledWith(0, 0, 1920, 1080);
    });

    it('should handle canvas resize during playback', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      // Initial size
      mockCanvas.width = 800;
      mockCanvas.height = 600;
      visualizerEngine.render(mockCanvas as any, analyser, config);
      expect(mockContext.clearRect).toHaveBeenLastCalledWith(0, 0, 800, 600);

      // Resize
      mockCanvas.width = 1200;
      mockCanvas.height = 800;
      visualizerEngine.render(mockCanvas as any, analyser, config);
      expect(mockContext.clearRect).toHaveBeenLastCalledWith(0, 0, 1200, 800);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-frequency rendering', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      const startTime = performance.now();
      
      // Simulate 60 FPS for 1 second
      for (let i = 0; i < 60; i++) {
        visualizerEngine.render(mockCanvas as any, analyser, config);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large FFT sizes efficiently', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      const largeConfig = new VisualizerConfigEntity('circular', 2048, 0.8, 1.0, 'rainbow');
      mockAnalyser.fftSize = 2048;
      mockAnalyser.frequencyBinCount = 1024;

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < 1024; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      const startTime = performance.now();
      visualizerEngine.render(mockCanvas as any, analyser, largeConfig);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should render within 50ms
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle canvas context errors', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockCanvas.getContext.mockReturnValue(null);

      expect(() => {
        visualizerEngine.render(mockCanvas as any, analyser, config);
      }).not.toThrow();
    });

    it('should handle analyser data errors', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockAnalyser.getByteFrequencyData.mockImplementation(() => {
        throw new Error('Analyser error');
      });

      expect(() => {
        visualizerEngine.render(mockCanvas as any, analyser, config);
      }).not.toThrow();
    });

    it('should handle rendering errors gracefully', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      mockContext.fillRect.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      expect(() => {
        visualizerEngine.render(mockCanvas as any, analyser, config);
      }).not.toThrow();
    });
  });

  describe('Memory Management Integration', () => {
    it('should handle cleanup properly', async () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      mockMediaElementSource.mediaElement.play.mockResolvedValue(undefined);

      await webAudioService.playAudio(audioFile);
      const analyser = webAudioService.getAnalyser();

      // Render a few frames
      for (let i = 0; i < 5; i++) {
        mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
          for (let j = 0; j < array.length; j++) {
            array[j] = Math.floor(Math.random() * 256);
          }
        });
        
        visualizerEngine.render(mockCanvas as any, analyser, config);
      }

      // Cleanup
      webAudioService.cleanup();

      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});