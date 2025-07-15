import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioControls } from './AudioControls';

const defaultProps = {
  isPlaying: false,
  isLoading: false,
  canPlay: true,
  currentTime: 0,
  duration: 180,
  volume: 0.8,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onSeek: vi.fn(),
  onVolumeChange: vi.fn()
};

describe('AudioControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render play button when not playing', () => {
    render(<AudioControls {...defaultProps} />);

    const playButton = screen.getByRole('button', { name: /▶️/ });
    expect(playButton).toBeInTheDocument();
    expect(playButton).not.toBeDisabled();
  });

  it('should render pause button when playing', () => {
    render(<AudioControls {...defaultProps} isPlaying={true} />);

    const pauseButton = screen.getByRole('button', { name: /⏸️/ });
    expect(pauseButton).toBeInTheDocument();
    expect(pauseButton).not.toBeDisabled();
  });

  it('should render stop button', () => {
    render(<AudioControls {...defaultProps} />);

    const stopButton = screen.getByRole('button', { name: /⏹️/ });
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).not.toBeDisabled();
  });

  it('should disable controls when cannot play', () => {
    render(<AudioControls {...defaultProps} canPlay={false} />);

    const playButton = screen.getByRole('button', { name: /▶️/ });
    const stopButton = screen.getByRole('button', { name: /⏹️/ });

    expect(playButton).toBeDisabled();
    expect(stopButton).toBeDisabled();
  });

  it('should show loading state on play button', () => {
    render(<AudioControls {...defaultProps} isLoading={true} />);

    const playButton = screen.getByRole('button', { name: /▶️/ });
    expect(playButton).toBeDisabled();
    
    // Loading state should hide the play icon
    expect(playButton).not.toHaveTextContent('▶️');
  });

  it('should call onPlay when play button is clicked', () => {
    const onPlay = vi.fn();
    render(<AudioControls {...defaultProps} onPlay={onPlay} />);

    const playButton = screen.getByRole('button', { name: /▶️/ });
    fireEvent.click(playButton);

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('should call onPause when pause button is clicked', () => {
    const onPause = vi.fn();
    render(<AudioControls {...defaultProps} isPlaying={true} onPause={onPause} />);

    const pauseButton = screen.getByRole('button', { name: /⏸️/ });
    fireEvent.click(pauseButton);

    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('should call onStop when stop button is clicked', () => {
    const onStop = vi.fn();
    render(<AudioControls {...defaultProps} onStop={onStop} />);

    const stopButton = screen.getByRole('button', { name: /⏹️/ });
    fireEvent.click(stopButton);

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('should format time correctly', () => {
    render(<AudioControls {...defaultProps} currentTime={75} duration={180} />);

    expect(screen.getByText('1:15')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should format time with zero padding', () => {
    render(<AudioControls {...defaultProps} currentTime={5} duration={65} />);

    expect(screen.getByText('0:05')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('should display seek bar when can play and has duration', () => {
    render(<AudioControls {...defaultProps} currentTime={30} duration={180} />);

    const seekBar = screen.getByRole('slider', { name: /seek/i });
    expect(seekBar).toBeInTheDocument();
    expect(seekBar).toHaveValue('16.666666666666668'); // (30/180) * 100
  });

  it('should not display seek bar when cannot play', () => {
    render(<AudioControls {...defaultProps} canPlay={false} />);

    const seekBar = screen.queryByRole('slider', { name: /seek/i });
    expect(seekBar).not.toBeInTheDocument();
  });

  it('should not display seek bar when duration is zero', () => {
    render(<AudioControls {...defaultProps} duration={0} />);

    const seekBar = screen.queryByRole('slider', { name: /seek/i });
    expect(seekBar).not.toBeInTheDocument();
  });

  it('should call onSeek when seek bar is changed', () => {
    const onSeek = vi.fn();
    render(<AudioControls {...defaultProps} onSeek={onSeek} currentTime={30} duration={180} />);

    const seekBar = screen.getByRole('slider', { name: /seek/i });
    fireEvent.change(seekBar, { target: { value: '50' } });

    expect(onSeek).toHaveBeenCalledWith(90); // (50/100) * 180
  });

  it('should display volume control', () => {
    render(<AudioControls {...defaultProps} volume={0.8} />);

    const volumeBar = screen.getByRole('slider', { name: /volume/i });
    expect(volumeBar).toBeInTheDocument();
    expect(volumeBar).toHaveValue('80');

    const volumePercent = screen.getByText('80%');
    expect(volumePercent).toBeInTheDocument();
  });

  it('should call onVolumeChange when volume bar is changed', () => {
    const onVolumeChange = vi.fn();
    render(<AudioControls {...defaultProps} onVolumeChange={onVolumeChange} />);

    const volumeBar = screen.getByRole('slider', { name: /volume/i });
    fireEvent.change(volumeBar, { target: { value: '60' } });

    expect(onVolumeChange).toHaveBeenCalledWith(0.6);
  });

  it('should display volume icon', () => {
    render(<AudioControls {...defaultProps} />);

    expect(screen.getByText('🔊')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<AudioControls {...defaultProps} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should calculate progress correctly', () => {
    const { rerender } = render(<AudioControls {...defaultProps} currentTime={60} duration={180} />);

    const seekBar = screen.getByRole('slider', { name: /seek/i });
    expect(seekBar).toHaveValue('33.333333333333336'); // (60/180) * 100

    rerender(<AudioControls {...defaultProps} currentTime={0} duration={180} />);
    expect(seekBar).toHaveValue('0');

    rerender(<AudioControls {...defaultProps} currentTime={180} duration={180} />);
    expect(seekBar).toHaveValue('100');
  });

  it('should handle zero duration gracefully', () => {
    render(<AudioControls {...defaultProps} currentTime={30} duration={0} />);

    // Should not crash and should not show progress bar
    expect(screen.queryByRole('slider', { name: /seek/i })).not.toBeInTheDocument();
  });

  it('should handle edge cases for time formatting', () => {
    render(<AudioControls {...defaultProps} currentTime={0} duration={0} />);

    // Should not show time display when duration is 0
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  it('should handle volume range correctly', () => {
    const { rerender } = render(<AudioControls {...defaultProps} volume={0} />);

    let volumeBar = screen.getByRole('slider', { name: /volume/i });
    expect(volumeBar).toHaveValue('0');
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<AudioControls {...defaultProps} volume={1} />);
    volumeBar = screen.getByRole('slider', { name: /volume/i });
    expect(volumeBar).toHaveValue('100');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should apply proper styles to seek bar based on progress', () => {
    render(<AudioControls {...defaultProps} currentTime={45} duration={180} />);

    const seekBar = screen.getByRole('slider', { name: /seek/i });
    const progress = (45 / 180) * 100; // 25%

    expect(seekBar).toHaveStyle({
      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progress}%, #e2e8f0 ${progress}%, #e2e8f0 100%)`
    });
  });

  it('should apply proper styles to volume bar based on volume', () => {
    render(<AudioControls {...defaultProps} volume={0.7} />);

    const volumeBar = screen.getByRole('slider', { name: /volume/i });
    
    expect(volumeBar).toHaveStyle({
      background: `linear-gradient(to right, #6366f1 0%, #6366f1 70%, #e2e8f0 70%, #e2e8f0 100%)`
    });
  });
});