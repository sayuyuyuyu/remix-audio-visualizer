import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVisualizer } from './useVisualizer';
import { VisualizerConfigEntity, type ColorTheme } from '../../domain/entities/VisualizerConfig';
import { VisualizerEngine } from '../../infrastructure/audio/VisualizerEngine';
import { AudioRepositoryImpl } from '../../infrastructure/repositories/AudioRepositoryImpl';

// Mock dependencies
vi.mock('../../domain/entities/VisualizerConfig');
vi.mock('../../infrastructure/audio/VisualizerEngine');

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame
});

describe('useVisualizer', () => {
  let mockVisualizerEngine: VisualizerEngine;
  let mockAudioRepository: AudioRepositoryImpl;
  let mockConfig: VisualizerConfigEntity;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock VisualizerEngine
    mockVisualizerEngine = {
      setCanvas: vi.fn(),
      render: vi.fn()
    } as any;

    // Mock AudioRepositoryImpl
    mockAudioRepository = {
      getWebAudioService: vi.fn().mockReturnValue({
        getAnalysisData: vi.fn().mockReturnValue({
          frequencyData: new Uint8Array([1, 2, 3, 4]),
          timeData: new Uint8Array([5, 6, 7, 8])
        })
      }),
      onPlayStateChange: vi.fn().mockReturnValue(() => {}),
      updateAudioSettings: vi.fn()
    } as any;

    // Mock VisualizerConfigEntity
    mockConfig = {
      id: 'test-config',
      modes: [
        { id: 'circular', enabled: true, name: 'Circular', nameJa: '円形' },
        { id: 'waveform', enabled: false, name: 'Waveform', nameJa: '波形' }
      ],
      theme: {
        id: 'default',
        name: 'Aurora',
        nameJa: 'オーロラ',
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#0f0f23',
        text: '#ffffff'
      },
      sensitivity: 1.0,
      fftSize: 512,
      smoothingTimeConstant: 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
      toggleMode: vi.fn(),
      applyTheme: vi.fn(),
      getEnabledModes: vi.fn().mockReturnValue([
        { id: 'circular', enabled: true, name: 'Circular', nameJa: '円形' }
      ]),
      isValid: vi.fn().mockReturnValue(true)
    } as any;

    vi.mocked(VisualizerEngine).mockImplementation(() => mockVisualizerEngine);
    vi.mocked(VisualizerConfigEntity).mockImplementation(() => mockConfig);

    // Mock animation frame to return sequential IDs
    let frameId = 1;
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16); // Simulate 60fps
      return frameId++;
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVisualizer());

    expect(result.current.config).toBe(mockConfig);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.canvasRef.current).toBeNull();
  });

  it('should initialize visualizer engine on mount', () => {
    renderHook(() => useVisualizer());

    expect(VisualizerEngine).toHaveBeenCalled();
  });

  it('should clean up animation frame on unmount', () => {
    const { unmount } = renderHook(() => useVisualizer());
    
    // Start animation first
    const { result } = renderHook(() => useVisualizer());
    act(() => {
      result.current.startAnimation();
    });

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('should set canvas when canvas ref is available', () => {
    const { result } = renderHook(() => useVisualizer());

    // Mock canvas element
    const mockCanvas = document.createElement('canvas');
    result.current.canvasRef.current = mockCanvas;

    // Re-render to trigger useEffect
    renderHook(() => useVisualizer());

    expect(mockVisualizerEngine.setCanvas).toHaveBeenCalledWith(mockCanvas);
  });

  describe('toggleMode', () => {
    it('should toggle mode and update config', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.toggleMode('waveform');
      });

      expect(mockConfig.toggleMode).toHaveBeenCalledWith('waveform');
    });
  });

  describe('updateTheme', () => {
    it('should update theme and apply to config', () => {
      const { result } = renderHook(() => useVisualizer());
      const newTheme: ColorTheme = {
        id: 'custom',
        name: 'Custom',
        nameJa: 'カスタム',
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        background: '#ffffff',
        text: '#000000'
      };

      act(() => {
        result.current.updateTheme(newTheme);
      });

      expect(mockConfig.applyTheme).toHaveBeenCalledWith(newTheme);
    });
  });

  describe('updateSensitivity', () => {
    it('should update sensitivity within valid range', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.updateSensitivity(1.5);
      });

      expect(result.current.config.sensitivity).toBe(1.5);
    });

    it('should clamp sensitivity to minimum value', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.updateSensitivity(0.05);
      });

      expect(result.current.config.sensitivity).toBe(0.1);
    });

    it('should clamp sensitivity to maximum value', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.updateSensitivity(5.0);
      });

      expect(result.current.config.sensitivity).toBe(3.0);
    });
  });

  describe('updateFFTSize', () => {
    it('should update FFT size with valid value', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        result.current.updateFFTSize(1024);
      });

      expect(result.current.config.fftSize).toBe(1024);
      expect(mockAudioRepository.updateAudioSettings).toHaveBeenCalledWith({ fftSize: 1024 });
    });

    it('should fallback to default for invalid FFT size', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        result.current.updateFFTSize(333);
      });

      expect(result.current.config.fftSize).toBe(512);
      expect(mockAudioRepository.updateAudioSettings).toHaveBeenCalledWith({ fftSize: 512 });
    });

    it('should not update audio repository when not provided', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.updateFFTSize(1024);
      });

      expect(result.current.config.fftSize).toBe(1024);
      // No audio repository call expected
    });
  });

  describe('updateSmoothingTimeConstant', () => {
    it('should update smoothing time constant within valid range', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        result.current.updateSmoothingTimeConstant(0.5);
      });

      expect(result.current.config.smoothingTimeConstant).toBe(0.5);
      expect(mockAudioRepository.updateAudioSettings).toHaveBeenCalledWith({ smoothingTimeConstant: 0.5 });
    });

    it('should clamp smoothing time constant to minimum', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        result.current.updateSmoothingTimeConstant(-0.1);
      });

      expect(result.current.config.smoothingTimeConstant).toBe(0);
      expect(mockAudioRepository.updateAudioSettings).toHaveBeenCalledWith({ smoothingTimeConstant: 0 });
    });

    it('should clamp smoothing time constant to maximum', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        result.current.updateSmoothingTimeConstant(1.5);
      });

      expect(result.current.config.smoothingTimeConstant).toBe(1);
      expect(mockAudioRepository.updateAudioSettings).toHaveBeenCalledWith({ smoothingTimeConstant: 1 });
    });
  });

  describe('animation control', () => {
    it('should start animation', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.startAnimation();
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it('should not start animation if already animating', () => {
      const { result } = renderHook(() => useVisualizer());

      act(() => {
        result.current.startAnimation();
      });

      const callCount = mockRequestAnimationFrame.mock.calls.length;

      act(() => {
        result.current.startAnimation();
      });

      expect(mockRequestAnimationFrame.mock.calls.length).toBe(callCount);
    });

    it('should stop animation', () => {
      const { result } = renderHook(() => useVisualizer());

      // Start animation first
      act(() => {
        result.current.startAnimation();
      });

      act(() => {
        result.current.stopAnimation();
      });

      expect(result.current.isAnimating).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('animation loop', () => {
    it('should render when audio data is available', async () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));

      // Mock canvas
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 800;
      mockCanvas.height = 600;
      result.current.canvasRef.current = mockCanvas;

      act(() => {
        result.current.startAnimation();
      });

      // Wait for animation frame
      await vi.waitFor(() => {
        expect(mockVisualizerEngine.render).toHaveBeenCalled();
      });

      const renderCall = vi.mocked(mockVisualizerEngine.render).mock.calls[0];
      expect(renderCall[0]).toEqual([{ id: 'circular', enabled: true, name: 'Circular', nameJa: '円形' }]);
      expect(renderCall[1]).toEqual({
        frequencyData: new Uint8Array([1, 2, 3, 4]),
        timeData: new Uint8Array([5, 6, 7, 8])
      });
      expect(renderCall[2]).toEqual({
        width: 800,
        height: 600,
        theme: mockConfig.theme,
        sensitivity: 1.0
      });
    });

    it('should handle animation error', async () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));
      const error = new Error('Render failed');
      vi.mocked(mockVisualizerEngine.render).mockImplementation(() => {
        throw error;
      });

      // Mock canvas
      const mockCanvas = document.createElement('canvas');
      result.current.canvasRef.current = mockCanvas;

      act(() => {
        result.current.startAnimation();
      });

      await vi.waitFor(() => {
        expect(result.current.error).toBe('Render failed');
        expect(result.current.isAnimating).toBe(false);
      });
    });

    it('should continue animation loop when no audio data', async () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));
      vi.mocked(mockAudioRepository.getWebAudioService).mockReturnValue({
        getAnalysisData: vi.fn().mockReturnValue(null)
      } as any);

      // Mock canvas
      const mockCanvas = document.createElement('canvas');
      result.current.canvasRef.current = mockCanvas;

      act(() => {
        result.current.startAnimation();
      });

      await vi.waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      });

      expect(mockVisualizerEngine.render).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useVisualizer());

      // Set error first
      act(() => {
        result.current.startAnimation();
      });

      vi.mocked(mockVisualizerEngine.render).mockImplementation(() => {
        throw new Error('Test error');
      });

      // Wait for error to be set
      vi.waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('play state integration', () => {
    it('should start animation on play state change', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));
      let playStateCallback: (playing: boolean) => void = () => {};

      vi.mocked(mockAudioRepository.onPlayStateChange).mockImplementation((callback) => {
        playStateCallback = callback;
        return () => {};
      });

      // Re-render to trigger useEffect
      renderHook(() => useVisualizer(mockAudioRepository));

      act(() => {
        playStateCallback(true);
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it('should stop animation on play state change', () => {
      const { result } = renderHook(() => useVisualizer(mockAudioRepository));
      let playStateCallback: (playing: boolean) => void = () => {};

      vi.mocked(mockAudioRepository.onPlayStateChange).mockImplementation((callback) => {
        playStateCallback = callback;
        return () => {};
      });

      // Re-render to trigger useEffect
      renderHook(() => useVisualizer(mockAudioRepository));

      // Start animation first
      act(() => {
        playStateCallback(true);
      });

      // Then stop
      act(() => {
        playStateCallback(false);
      });

      expect(result.current.isAnimating).toBe(false);
    });

    it('should clean up play state listener on unmount', () => {
      const mockCleanup = vi.fn();
      vi.mocked(mockAudioRepository.onPlayStateChange).mockReturnValue(mockCleanup);

      const { unmount } = renderHook(() => useVisualizer(mockAudioRepository));

      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});