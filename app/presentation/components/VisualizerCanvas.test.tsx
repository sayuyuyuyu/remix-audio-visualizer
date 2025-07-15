import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualizerCanvas } from './VisualizerCanvas';
import { CenterImageEntity } from '../../domain/entities/CenterImage';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

// Mock URL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock Image constructor
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: ''
};

Object.defineProperty(global, 'Image', {
  value: vi.fn().mockImplementation(() => mockImage)
});

const defaultProps = {
  width: 800,
  height: 600,
  hasAudioFile: true,
  isPlaying: false,
  isAnimating: false
};

describe('VisualizerCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render placeholder when no audio file', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={false} />);

    expect(screen.getByText('音楽を選択してください')).toBeInTheDocument();
    expect(screen.getByText('美しいビジュアライザーをお楽しみいただけます')).toBeInTheDocument();
    expect(screen.getByText('🎵')).toBeInTheDocument();
  });

  it('should render canvas when audio file is present', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should call onCanvasReady when canvas is ready', () => {
    const onCanvasReady = vi.fn();
    render(<VisualizerCanvas {...defaultProps} onCanvasReady={onCanvasReady} />);

    const canvas = screen.getByRole('img');
    expect(onCanvasReady).toHaveBeenCalledWith(canvas);
  });

  it('should use default width and height when not provided', () => {
    render(<VisualizerCanvas hasAudioFile={true} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toHaveAttribute('width', '1024');
    expect(canvas).toHaveAttribute('height', '500');
  });

  it('should apply custom className', () => {
    const { container } = render(<VisualizerCanvas {...defaultProps} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show paused indicator when not playing', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} isPlaying={false} />);

    expect(screen.getByText('一時停止中')).toBeInTheDocument();
  });

  it('should show animation indicator when playing and animating', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} isPlaying={true} isAnimating={true} />);

    expect(screen.getByText('ビジュアライザー動作中')).toBeInTheDocument();
  });

  it('should not show indicators when no audio file', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={false} />);

    expect(screen.queryByText('一時停止中')).not.toBeInTheDocument();
    expect(screen.queryByText('ビジュアライザー動作中')).not.toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} />);

    expect(screen.getByText('ビジュアライザーを初期化中...')).toBeInTheDocument();
  });

  it('should hide loading state after canvas is ready', () => {
    const onCanvasReady = vi.fn();
    render(<VisualizerCanvas {...defaultProps} onCanvasReady={onCanvasReady} />);

    // Canvas ready should hide loading
    expect(screen.queryByText('ビジュアライザーを初期化中...')).not.toBeInTheDocument();
  });

  it('should handle center image loading', () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const centerImage = new CenterImageEntity(file);
    
    render(<VisualizerCanvas {...defaultProps} centerImage={centerImage} />);

    // Should create image element
    expect(Image).toHaveBeenCalled();
    expect(mockImage.src).toBe(centerImage.url);
  });

  it('should handle center image load success', () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const centerImage = new CenterImageEntity(file);
    
    render(<VisualizerCanvas {...defaultProps} centerImage={centerImage} />);

    // Simulate successful image load
    if (mockImage.onload) {
      mockImage.onload();
    }

    // Should not throw error
    expect(mockImage.src).toBe(centerImage.url);
  });

  it('should handle center image load error', () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const centerImage = new CenterImageEntity(file);
    
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<VisualizerCanvas {...defaultProps} centerImage={centerImage} />);

    // Simulate image load error
    if (mockImage.onerror) {
      mockImage.onerror();
    }

    expect(console.warn).toHaveBeenCalledWith('センター画像の読み込みに失敗しました:', centerImage.url);
  });

  it('should clear image when centerImage is null', () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const centerImage = new CenterImageEntity(file);
    
    const { rerender } = render(<VisualizerCanvas {...defaultProps} centerImage={centerImage} />);

    // Clear the image
    rerender(<VisualizerCanvas {...defaultProps} centerImage={null} />);

    // Should not create new image when centerImage is null
    expect(Image).toHaveBeenCalledTimes(1); // Only called once initially
  });

  it('should handle centerImage without url', () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const centerImage = new CenterImageEntity(file);
    centerImage.url = ''; // Clear URL
    
    render(<VisualizerCanvas {...defaultProps} centerImage={centerImage} />);

    // Should not create image when URL is empty
    expect(Image).not.toHaveBeenCalled();
  });

  it('should apply correct aspect ratio to canvas', () => {
    render(<VisualizerCanvas {...defaultProps} width={800} height={600} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toHaveStyle({ aspectRatio: '800/600' });
  });

  it('should have proper accessibility attributes', () => {
    render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle different playing states correctly', () => {
    const { rerender } = render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} isPlaying={false} />);

    expect(screen.getByText('一時停止中')).toBeInTheDocument();

    rerender(<VisualizerCanvas {...defaultProps} hasAudioFile={true} isPlaying={true} isAnimating={false} />);

    expect(screen.queryByText('一時停止中')).not.toBeInTheDocument();
    expect(screen.queryByText('ビジュアライザー動作中')).not.toBeInTheDocument();

    rerender(<VisualizerCanvas {...defaultProps} hasAudioFile={true} isPlaying={true} isAnimating={true} />);

    expect(screen.getByText('ビジュアライザー動作中')).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    const { container } = render(<VisualizerCanvas {...defaultProps} hasAudioFile={true} />);

    const canvasContainer = container.firstChild as HTMLElement;
    expect(canvasContainer).toHaveClass('relative', 'overflow-hidden', 'rounded-xl');
    expect(canvasContainer).toHaveClass('bg-gradient-to-br', 'from-slate-900', 'via-slate-800', 'to-slate-900');
    expect(canvasContainer).toHaveClass('ring-1', 'ring-white/10', 'shadow-inner');
  });

  it('should have correct CSS classes for placeholder', () => {
    const { container } = render(<VisualizerCanvas {...defaultProps} hasAudioFile={false} />);

    const placeholder = container.firstChild as HTMLElement;
    expect(placeholder).toHaveClass('relative', 'overflow-hidden', 'rounded-xl', 'min-h-[400px]');
    expect(placeholder).toHaveClass('bg-gradient-to-br', 'from-slate-900', 'via-slate-800', 'to-slate-900');
    expect(placeholder).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should handle component updates correctly', () => {
    const { rerender } = render(<VisualizerCanvas {...defaultProps} hasAudioFile={false} />);

    expect(screen.getByText('音楽を選択してください')).toBeInTheDocument();

    rerender(<VisualizerCanvas {...defaultProps} hasAudioFile={true} />);

    expect(screen.queryByText('音楽を選択してください')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});