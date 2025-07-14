import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BPMDisplay } from '../../../app/presentation/components/BPMDisplay';
import { useBPM } from '../../../app/presentation/hooks/useBPM';

// Mock useBPM hook
vi.mock('../../../app/presentation/hooks/useBPM', () => ({
  useBPM: vi.fn(),
}));

const mockUseBPM = vi.mocked(useBPM);

describe('BPMDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render BPM value when detected', () => {
    mockUseBPM.mockReturnValue({
      bpm: 120,
      isDetecting: false,
      confidence: 0.8,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
  });

  it('should show detecting state', () => {
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: true,
      confidence: 0,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('検出中...')).toBeInTheDocument();
  });

  it('should show no BPM when not detected', () => {
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: false,
      confidence: 0,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
  });

  it('should display confidence level', () => {
    mockUseBPM.mockReturnValue({
      bpm: 128,
      isDetecting: false,
      confidence: 0.9,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('信頼度: 90%')).toBeInTheDocument();
  });

  it('should handle low confidence', () => {
    mockUseBPM.mockReturnValue({
      bpm: 100,
      isDetecting: false,
      confidence: 0.3,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('信頼度: 30%')).toBeInTheDocument();
  });

  it('should handle zero confidence', () => {
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: false,
      confidence: 0,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.queryByText(/信頼度/)).not.toBeInTheDocument();
  });

  it('should apply correct styling for high confidence', () => {
    mockUseBPM.mockReturnValue({
      bpm: 120,
      isDetecting: false,
      confidence: 0.9,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    const confidenceElement = screen.getByText('信頼度: 90%');
    expect(confidenceElement).toHaveClass('text-green-600');
  });

  it('should apply correct styling for medium confidence', () => {
    mockUseBPM.mockReturnValue({
      bpm: 120,
      isDetecting: false,
      confidence: 0.6,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    const confidenceElement = screen.getByText('信頼度: 60%');
    expect(confidenceElement).toHaveClass('text-yellow-600');
  });

  it('should apply correct styling for low confidence', () => {
    mockUseBPM.mockReturnValue({
      bpm: 120,
      isDetecting: false,
      confidence: 0.3,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    const confidenceElement = screen.getByText('信頼度: 30%');
    expect(confidenceElement).toHaveClass('text-red-600');
  });

  it('should handle high BPM values', () => {
    mockUseBPM.mockReturnValue({
      bpm: 200,
      isDetecting: false,
      confidence: 0.8,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('信頼度: 80%')).toBeInTheDocument();
  });

  it('should handle decimal BPM values', () => {
    mockUseBPM.mockReturnValue({
      bpm: 120.5,
      isDetecting: false,
      confidence: 0.8,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    expect(screen.getByText('121')).toBeInTheDocument();
  });

  it('should show detecting animation when detecting', () => {
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: true,
      confidence: 0,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    render(<BPMDisplay analyser={null} />);

    const detectingText = screen.getByText('検出中...');
    expect(detectingText).toHaveClass('animate-pulse');
  });

  it('should handle null analyser gracefully', () => {
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: false,
      confidence: 0,
      startDetection: vi.fn(),
      stopDetection: vi.fn(),
    });

    expect(() => {
      render(<BPMDisplay analyser={null} />);
    }).not.toThrow();
  });

  it('should call startDetection when analyser is provided', () => {
    const mockStartDetection = vi.fn();
    mockUseBPM.mockReturnValue({
      bpm: 0,
      isDetecting: false,
      confidence: 0,
      startDetection: mockStartDetection,
      stopDetection: vi.fn(),
    });

    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };

    render(<BPMDisplay analyser={mockAnalyser as any} />);

    expect(mockStartDetection).toHaveBeenCalledWith(mockAnalyser);
  });

  it('should call stopDetection when analyser is removed', () => {
    const mockStopDetection = vi.fn();
    mockUseBPM.mockReturnValue({
      bpm: 120,
      isDetecting: false,
      confidence: 0.8,
      startDetection: vi.fn(),
      stopDetection: mockStopDetection,
    });

    const mockAnalyser = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    };

    const { rerender } = render(<BPMDisplay analyser={mockAnalyser as any} />);

    rerender(<BPMDisplay analyser={null} />);

    expect(mockStopDetection).toHaveBeenCalled();
  });
});