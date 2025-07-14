import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBPM } from '../../../app/presentation/hooks/useBPM';
import { BPMDetector } from '../../../app/infrastructure/audio/BPMDetector';

// Mock BPMDetector
vi.mock('../../../app/infrastructure/audio/BPMDetector', () => ({
  BPMDetector: vi.fn().mockImplementation(() => ({
    detectBPM: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

const mockBPMDetectorClass = vi.mocked(BPMDetector);

describe('useBPM', () => {
  let mockBPMDetector: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockBPMDetector = {
      detectBPM: vi.fn(),
      cleanup: vi.fn(),
    };
    mockBPMDetectorClass.mockImplementation(() => mockBPMDetector);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBPM());

    expect(result.current.bpm).toBe(0);
    expect(result.current.isDetecting).toBe(false);
    expect(result.current.confidence).toBe(0);
  });

  it('should start BPM detection successfully', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 120, confidence: 0.8 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.isDetecting).toBe(true);
    expect(mockBPMDetector.detectBPM).toHaveBeenCalledWith(mockAnalyser);
  });

  it('should handle BPM detection success', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 128, confidence: 0.9 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(128);
    expect(result.current.confidence).toBe(0.9);
    expect(result.current.isDetecting).toBe(false);
  });

  it('should handle BPM detection failure', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockRejectedValue(new Error('Detection failed'));

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(0);
    expect(result.current.confidence).toBe(0);
    expect(result.current.isDetecting).toBe(false);
  });

  it('should stop BPM detection', () => {
    const { result } = renderHook(() => useBPM());

    act(() => {
      result.current.stopDetection();
    });

    expect(result.current.isDetecting).toBe(false);
    expect(result.current.bpm).toBe(0);
    expect(result.current.confidence).toBe(0);
  });

  it('should handle null analyser', async () => {
    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(null);
    });

    expect(result.current.isDetecting).toBe(false);
    expect(result.current.bpm).toBe(0);
    expect(result.current.confidence).toBe(0);
  });

  it('should not start detection if already detecting', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useBPM());

    act(() => {
      result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.isDetecting).toBe(true);

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(mockBPMDetector.detectBPM).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useBPM());

    unmount();

    expect(mockBPMDetector.cleanup).toHaveBeenCalled();
  });

  it('should handle rapid start/stop cycles', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 120, confidence: 0.8 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
      result.current.stopDetection();
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(120);
    expect(result.current.confidence).toBe(0.8);
  });

  it('should handle detection with low confidence', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 100, confidence: 0.3 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(100);
    expect(result.current.confidence).toBe(0.3);
    expect(result.current.isDetecting).toBe(false);
  });

  it('should handle detection with high BPM', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 200, confidence: 0.9 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(200);
    expect(result.current.confidence).toBe(0.9);
  });

  it('should handle detection with zero BPM', async () => {
    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };
    
    mockBPMDetector.detectBPM.mockResolvedValue({ bpm: 0, confidence: 0 });

    const { result } = renderHook(() => useBPM());

    await act(async () => {
      await result.current.startDetection(mockAnalyser as any);
    });

    expect(result.current.bpm).toBe(0);
    expect(result.current.confidence).toBe(0);
  });
});