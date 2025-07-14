import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisualizerEngine } from '../../../app/infrastructure/audio/VisualizerEngine';
import { VisualizerConfigEntity } from '../../../app/domain/entities/VisualizerConfig';

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
  addColorStop: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
  globalCompositeOperation: '',
  fillText: vi.fn(),
  measureText: vi.fn(),
};

const mockGradient = {
  addColorStop: vi.fn(),
};

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn(),
  getByteTimeDomainData: vi.fn(),
};

describe('VisualizerEngine', () => {
  let visualizerEngine: VisualizerEngine;
  let config: VisualizerConfigEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockContext.createLinearGradient.mockReturnValue(mockGradient);
    mockContext.createRadialGradient.mockReturnValue(mockGradient);
    mockContext.measureText.mockReturnValue({ width: 100 });
    
    config = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
    visualizerEngine = new VisualizerEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(visualizerEngine).toBeDefined();
    });
  });

  describe('render', () => {
    it('should handle null canvas', () => {
      expect(() => {
        visualizerEngine.render(null, mockAnalyser as any, config);
      }).not.toThrow();
    });

    it('should handle null analyser', () => {
      expect(() => {
        visualizerEngine.render(mockCanvas as any, null, config);
      }).not.toThrow();
    });

    it('should handle null config', () => {
      expect(() => {
        visualizerEngine.render(mockCanvas as any, mockAnalyser as any, null);
      }).not.toThrow();
    });

    it('should setup canvas context correctly', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe('circular visualizer', () => {
    beforeEach(() => {
      config = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
    });

    it('should render circular visualizer', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should create radial gradient for circular visualizer', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.createRadialGradient).toHaveBeenCalled();
      expect(mockGradient.addColorStop).toHaveBeenCalled();
    });
  });

  describe('waveform visualizer', () => {
    beforeEach(() => {
      config = new VisualizerConfigEntity('waveform', 256, 0.8, 1.0, 'blue');
    });

    it('should render waveform visualizer', () => {
      mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128 + Math.sin(i * 0.1) * 50;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should use time domain data for waveform', () => {
      mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    });
  });

  describe('frequency bars visualizer', () => {
    beforeEach(() => {
      config = new VisualizerConfigEntity('frequencyBars', 256, 0.8, 1.0, 'green');
    });

    it('should render frequency bars visualizer', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should create linear gradient for frequency bars', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockGradient.addColorStop).toHaveBeenCalled();
    });
  });

  describe('solar system visualizer', () => {
    beforeEach(() => {
      config = new VisualizerConfigEntity('solarSystem', 256, 0.8, 1.0, 'orange');
    });

    it('should render solar system visualizer', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should use rotation for solar system animation', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.rotate).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('particle field visualizer', () => {
    beforeEach(() => {
      config = new VisualizerConfigEntity('particleField', 256, 0.8, 1.0, 'purple');
    });

    it('should render particle field visualizer', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should create particles with random positions', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mathRandomSpy).toHaveBeenCalled();
      mathRandomSpy.mockRestore();
    });
  });

  describe('theme colors', () => {
    it('should handle rainbow theme', () => {
      config = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.createRadialGradient).toHaveBeenCalled();
    });

    it('should handle blue theme', () => {
      config = new VisualizerConfigEntity('waveform', 256, 0.8, 1.0, 'blue');
      mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.strokeStyle).toContain('blue');
    });

    it('should handle green theme', () => {
      config = new VisualizerConfigEntity('frequencyBars', 256, 0.8, 1.0, 'green');
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128;
        }
      });

      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);

      expect(mockContext.createLinearGradient).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle canvas context creation failure', () => {
      mockCanvas.getContext.mockReturnValue(null);

      expect(() => {
        visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      }).not.toThrow();
    });

    it('should handle analyser data errors', () => {
      mockAnalyser.getByteFrequencyData.mockImplementation(() => {
        throw new Error('Analyser error');
      });

      expect(() => {
        visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      }).not.toThrow();
    });

    it('should handle rendering errors gracefully', () => {
      mockContext.fillRect.mockImplementation(() => {
        throw new Error('Rendering error');
      });

      expect(() => {
        visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      }).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large frequency data arrays', () => {
      config = new VisualizerConfigEntity('circular', 2048, 0.8, 1.0, 'rainbow');
      mockAnalyser.frequencyBinCount = 1024;
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      });

      const startTime = performance.now();
      visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle high sensitivity values', () => {
      config = new VisualizerConfigEntity('circular', 256, 0.8, 5.0, 'rainbow');
      mockAnalyser.getByteFrequencyData.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 255;
        }
      });

      expect(() => {
        visualizerEngine.render(mockCanvas as any, mockAnalyser as any, config);
      }).not.toThrow();
    });
  });
});