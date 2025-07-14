import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBPM } from '../../../app/presentation/hooks/useBPM';
import type { AudioRepositoryImpl } from '../../../app/infrastructure/repositories/AudioRepositoryImpl';
import type { BPMAnalysisData } from '../../../app/infrastructure/audio/WebAudioService';

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame
});

describe('useBPM', () => {
  let mockAudioRepository: AudioRepositoryImpl;
  let mockBPMData: BPMAnalysisData;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBPMData = {
      currentBPM: 120,
      confidence: 0.85,
      onsets: [0.5, 1.0, 1.5],
      stability: 0.9
    };

    mockAudioRepository = {
      getAudioAnalysisData: vi.fn().mockReturnValue({
        bpmData: mockBPMData
      }),
      resetBPMDetector: vi.fn()
    } as any;

    // Mock animation frame to return sequential IDs
    let frameId = 1;
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16); // Simulate 60fps
      return frameId++;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBPM(null, false));

    expect(result.current.bpmData).toBeNull();
    expect(result.current.isDetecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.resetDetection).toBeDefined();
    expect(result.current.clearError).toBeDefined();
  });

  it('should start detection when audio repository is available and playing', () => {
    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    expect(result.current.isDetecting).toBe(true);
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('should not start detection when not playing', () => {
    const { result } = renderHook(() => useBPM(mockAudioRepository, false));

    expect(result.current.isDetecting).toBe(false);
    expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
  });

  it('should not start detection when no audio repository', () => {
    const { result } = renderHook(() => useBPM(null, true));

    expect(result.current.isDetecting).toBe(false);
    expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
  });

  it('should update BPM data when available', async () => {
    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    // Wait for animation frame to execute
    await vi.runOnlyPendingTimersAsync();

    expect(mockAudioRepository.getAudioAnalysisData).toHaveBeenCalled();
    expect(result.current.bpmData).toEqual(mockBPMData);
  });

  it('should handle BPM data update errors', async () => {
    vi.mocked(mockAudioRepository.getAudioAnalysisData).mockImplementation(() => {
      throw new Error('BPM analysis failed');
    });

    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    // Wait for animation frame to execute
    await vi.runOnlyPendingTimersAsync();

    expect(result.current.error).toContain('BPM analysis failed');
  });

  it('should stop detection when playing changes to false', () => {
    const { result, rerender } = renderHook(
      ({ isPlaying }) => useBPM(mockAudioRepository, isPlaying),
      { initialProps: { isPlaying: true } }
    );

    expect(result.current.isDetecting).toBe(true);

    rerender({ isPlaying: false });

    expect(result.current.isDetecting).toBe(false);
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('should reset detection when resetDetection is called', () => {
    const { result } = renderHook(() => useBPM(mockAudioRepository, false));

    // First set some data
    act(() => {
      result.current.resetDetection();
    });

    expect(result.current.bpmData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockAudioRepository.resetBPMDetector).toHaveBeenCalled();
  });

  it('should handle resetDetection errors', () => {
    vi.mocked(mockAudioRepository.resetBPMDetector).mockImplementation(() => {
      throw new Error('Reset failed');
    });

    const { result } = renderHook(() => useBPM(mockAudioRepository, false));

    act(() => {
      result.current.resetDetection();
    });

    expect(result.current.error).toContain('Reset failed');
  });

  it('should clear error when clearError is called', async () => {
    // First set an error
    vi.mocked(mockAudioRepository.getAudioAnalysisData).mockImplementation(() => {
      throw new Error('Test error');
    });

    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    // Wait for error to be set
    await vi.runOnlyPendingTimersAsync();

    expect(result.current.error).toBeTruthy();

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle missing BPM data gracefully', async () => {
    vi.mocked(mockAudioRepository.getAudioAnalysisData).mockReturnValue({
      bpmData: null
    } as any);

    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    // Wait for animation frame to execute
    await vi.runOnlyPendingTimersAsync();

    expect(result.current.bpmData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should reset detection when audio repository changes to null', () => {
    const { result, rerender } = renderHook(
      ({ audioRepo }: { audioRepo: AudioRepositoryImpl | null }) => useBPM(audioRepo, false),
      { initialProps: { audioRepo: mockAudioRepository } }
    );

    // Change to null
    rerender({ audioRepo: null });

    expect(result.current.bpmData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should cleanup animation frame on unmount', () => {
    const { unmount } = renderHook(() => useBPM(mockAudioRepository, true));

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('should handle no audio analysis data', async () => {
    vi.mocked(mockAudioRepository.getAudioAnalysisData).mockReturnValue(null);

    const { result } = renderHook(() => useBPM(mockAudioRepository, true));

    // Wait for animation frame to execute
    await vi.runOnlyPendingTimersAsync();

    expect(result.current.bpmData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});