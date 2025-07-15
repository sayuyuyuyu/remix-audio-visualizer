import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisualizerOverlay } from '../../../app/presentation/components/VisualizerOverlay';
import { VisualizerConfigEntity } from '../../../app/domain/entities/VisualizerConfig';

describe('VisualizerOverlay', () => {
  let mockConfig: VisualizerConfigEntity;
  let mockOnConfigChange: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = new VisualizerConfigEntity('circular', 256, 0.8, 1.0, 'rainbow');
    mockOnConfigChange = vi.fn();
  });

  it('should render visualizer mode selector', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByText('ビジュアライザー')).toBeInTheDocument();
    expect(screen.getByDisplayValue('circular')).toBeInTheDocument();
  });

  it('should render FFT size selector', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByText('FFT サイズ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('256')).toBeInTheDocument();
  });

  it('should render smoothing slider', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByText('スムージング')).toBeInTheDocument();
    const smoothingSlider = screen.getByDisplayValue('0.8');
    expect(smoothingSlider).toHaveAttribute('type', 'range');
  });

  it('should render sensitivity slider', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByText('感度')).toBeInTheDocument();
    const sensitivitySlider = screen.getByDisplayValue('1');
    expect(sensitivitySlider).toHaveAttribute('type', 'range');
  });

  it('should render theme selector', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByText('テーマ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('rainbow')).toBeInTheDocument();
  });

  it('should handle visualizer mode change', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const modeSelect = screen.getByDisplayValue('circular');
    fireEvent.change(modeSelect, { target: { value: 'waveform' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'waveform',
      })
    );
  });

  it('should handle FFT size change', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const fftSelect = screen.getByDisplayValue('256');
    fireEvent.change(fftSelect, { target: { value: '512' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fftSize: 512,
      })
    );
  });

  it('should handle smoothing change', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const smoothingSlider = screen.getByDisplayValue('0.8');
    fireEvent.change(smoothingSlider, { target: { value: '0.5' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        smoothing: 0.5,
      })
    );
  });

  it('should handle sensitivity change', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const sensitivitySlider = screen.getByDisplayValue('1');
    fireEvent.change(sensitivitySlider, { target: { value: '2' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sensitivity: 2,
      })
    );
  });

  it('should handle theme change', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const themeSelect = screen.getByDisplayValue('rainbow');
    fireEvent.change(themeSelect, { target: { value: 'blue' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'blue',
      })
    );
  });

  it('should not render when not visible', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={false}
      />
    );

    expect(screen.queryByText('ビジュアライザー')).not.toBeInTheDocument();
  });

  it('should show all visualizer mode options', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const modeSelect = screen.getByDisplayValue('circular');
    const options = modeSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('円形');
    expect(options[1]).toHaveTextContent('波形');
    expect(options[2]).toHaveTextContent('周波数バー');
    expect(options[3]).toHaveTextContent('太陽系');
    expect(options[4]).toHaveTextContent('パーティクル');
  });

  it('should show all FFT size options', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const fftSelect = screen.getByDisplayValue('256');
    const options = fftSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(6);
    expect(options[0]).toHaveValue('32');
    expect(options[1]).toHaveValue('64');
    expect(options[2]).toHaveValue('128');
    expect(options[3]).toHaveValue('256');
    expect(options[4]).toHaveValue('512');
    expect(options[5]).toHaveValue('1024');
  });

  it('should show all theme options', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const themeSelect = screen.getByDisplayValue('rainbow');
    const options = themeSelect.querySelectorAll('option');
    
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('レインボー');
    expect(options[1]).toHaveTextContent('ブルー');
    expect(options[2]).toHaveTextContent('グリーン');
    expect(options[3]).toHaveTextContent('オレンジ');
    expect(options[4]).toHaveTextContent('パープル');
  });

  it('should display current slider values', () => {
    const customConfig = new VisualizerConfigEntity('waveform', 512, 0.6, 2.5, 'blue');
    
    render(
      <VisualizerOverlay
        config={customConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByDisplayValue('0.6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
    expect(screen.getByText('0.6')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('should handle edge case slider values', () => {
    const edgeConfig = new VisualizerConfigEntity('circular', 256, 0, 0.1, 'rainbow');
    
    render(
      <VisualizerOverlay
        config={edgeConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
  });

  it('should handle maximum slider values', () => {
    const maxConfig = new VisualizerConfigEntity('circular', 256, 1, 5, 'rainbow');
    
    render(
      <VisualizerOverlay
        config={maxConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for visibility', () => {
    const { rerender } = render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    let overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('opacity-100');

    rerender(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={false}
      />
    );

    overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('opacity-0');
  });

  it('should handle rapid config changes', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const smoothingSlider = screen.getByDisplayValue('0.8');
    
    fireEvent.change(smoothingSlider, { target: { value: '0.5' } });
    fireEvent.change(smoothingSlider, { target: { value: '0.7' } });
    fireEvent.change(smoothingSlider, { target: { value: '0.9' } });

    expect(mockOnConfigChange).toHaveBeenCalledTimes(3);
  });

  it('should handle invalid slider values gracefully', () => {
    render(
      <VisualizerOverlay
        config={mockConfig}
        onConfigChange={mockOnConfigChange}
        isVisible={true}
      />
    );

    const smoothingSlider = screen.getByDisplayValue('0.8');
    fireEvent.change(smoothingSlider, { target: { value: 'invalid' } });

    expect(mockOnConfigChange).not.toHaveBeenCalled();
  });
});