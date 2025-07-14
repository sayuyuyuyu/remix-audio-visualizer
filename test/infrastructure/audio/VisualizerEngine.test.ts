import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisualizerEngine, type VisualizerOptions } from '../../../app/infrastructure/audio/VisualizerEngine';
import { VisualizerConfigEntity } from '../../../app/domain/entities/VisualizerConfig';
import type { AudioAnalysisData } from '../../../app/infrastructure/audio/WebAudioService';

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

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

describe('VisualizerEngine', () => {
  let visualizerEngine: VisualizerEngine;
  let config: VisualizerConfigEntity;
  let mockAudioData: AudioAnalysisData;
  let mockOptions: VisualizerOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockContext.createLinearGradient.mockReturnValue(mockGradient);
    mockContext.createRadialGradient.mockReturnValue(mockGradient);
    mockContext.measureText.mockReturnValue({ width: 100 });
    
    config = new VisualizerConfigEntity();
    visualizerEngine = new VisualizerEngine();

    mockAudioData = {
      frequencyData: new Uint8Array([100, 120, 80, 90, 110]),
      timeDomainData: new Uint8Array([128, 130, 125, 135, 120]),
      bufferLength: 5,
      sampleRate: 44100,
      bpmData: {
        currentBPM: 120,
        confidence: 0.85,
        onsets: [0.5, 1.0, 1.5],
        stability: 0.9
      }
    };

    mockOptions = {
      width: 800,
      height: 600,
      theme: config.theme,
      sensitivity: 1.0
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(visualizerEngine).toBeDefined();
    });
  });

  describe('setCanvas', () => {
    it('should set canvas successfully', () => {
      const canvas = mockCanvas as any;
      visualizerEngine.setCanvas(canvas);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      const canvas = mockCanvas as any;
      visualizerEngine.setCanvas(canvas);
    });

    it('should render with enabled modes', () => {
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should handle null audio data', () => {
      const enabledModes = config.getEnabledModes();
      
      expect(() => {
        visualizerEngine.render(enabledModes, null, mockOptions);
      }).not.toThrow();
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should render circular visualizer when enabled', () => {
      // Enable circular mode
      config.toggleMode('circular');
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
    });

    it('should render waveform visualizer when enabled', () => {
      // Enable waveform mode
      config.toggleMode('waveform');
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
    });

    it('should render frequency bars when enabled', () => {
      // Enable frequency mode
      config.toggleMode('frequency');
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should render solar system when enabled', () => {
      // Enable solar system mode
      config.toggleMode('solar_system');
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
    });

    it('should render particle field when enabled', () => {
      // Enable particle field mode
      config.toggleMode('particle_field');
      const enabledModes = config.getEnabledModes();
      
      visualizerEngine.render(enabledModes, mockAudioData, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
    });

    it('should handle missing canvas context', () => {
      const engineWithoutCanvas = new VisualizerEngine();
      const enabledModes = config.getEnabledModes();
      
      expect(() => {
        engineWithoutCanvas.render(enabledModes, mockAudioData, mockOptions);
      }).not.toThrow();
    });

    it('should render waiting state when not playing', () => {
      const enabledModes = config.getEnabledModes();
      const optionsNotPlaying = { ...mockOptions, isPlaying: false };
      
      visualizerEngine.render(enabledModes, null, optionsNotPlaying);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should handle BPM data correctly', () => {
      const enabledModes = config.getEnabledModes();
      const audioDataWithBPM = {
        ...mockAudioData,
        bpmData: {
          currentBPM: 140,
          confidence: 0.9,
          onsets: [0.25, 0.5, 0.75],
          stability: 0.95
        }
      };
      
      visualizerEngine.render(enabledModes, audioDataWithBPM, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should handle audio data without BPM', () => {
      const enabledModes = config.getEnabledModes();
      const audioDataWithoutBPM = {
        ...mockAudioData,
        bpmData: undefined
      };
      
      visualizerEngine.render(enabledModes, audioDataWithoutBPM, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should handle empty enabled modes array', () => {
      const emptyModes: any[] = [];
      
      expect(() => {
        visualizerEngine.render(emptyModes, mockAudioData, mockOptions);
      }).not.toThrow();
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should handle low confidence BPM data', () => {
      const enabledModes = config.getEnabledModes();
      const audioDataLowConfidence = {
        ...mockAudioData,
        bpmData: {
          currentBPM: 120,
          confidence: 0.3, // Low confidence
          onsets: [0.5],
          stability: 0.4
        }
      };
      
      visualizerEngine.render(enabledModes, audioDataLowConfidence, mockOptions);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
  });
});