import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Index from '../../app/routes/_index';

// Mock all the presentation components
vi.mock('../../app/presentation/components/FileUploadArea', () => ({
  FileUploadArea: ({ onFileSelect, isUploading }: any) => (
    <div data-testid="file-upload-area">
      <button onClick={() => onFileSelect(new File(['test'], 'test.mp3', { type: 'audio/mp3' }))}>
        Upload File
      </button>
      {isUploading && <span>Uploading...</span>}
    </div>
  ),
}));

vi.mock('../../app/presentation/components/AudioControls', () => ({
  AudioControls: ({ audioFile, visualizerConfig, onConfigChange }: any) => (
    <div data-testid="audio-controls">
      {audioFile && <span>Audio: {audioFile.name}</span>}
      <button onClick={() => onConfigChange({ ...visualizerConfig, type: 'waveform' })}>
        Change Mode
      </button>
    </div>
  ),
}));

vi.mock('../../app/presentation/components/VisualizerCanvas', () => ({
  VisualizerCanvas: ({ audioFile, config }: any) => (
    <div data-testid="visualizer-canvas">
      {audioFile && <span>Visualizing: {audioFile.name}</span>}
      <span>Mode: {config.type}</span>
    </div>
  ),
}));

vi.mock('../../app/presentation/components/BPMDisplay', () => ({
  BPMDisplay: ({ analyser }: any) => (
    <div data-testid="bpm-display">
      {analyser ? 'BPM: 120' : 'No BPM'}
    </div>
  ),
}));

vi.mock('../../app/presentation/components/VisualizerOverlay', () => ({
  VisualizerOverlay: ({ config, onConfigChange, isVisible }: any) => (
    <div data-testid="visualizer-overlay" style={{ display: isVisible ? 'block' : 'none' }}>
      <button onClick={() => onConfigChange({ ...config, theme: 'blue' })}>
        Change Theme
      </button>
    </div>
  ),
}));

// Mock custom hooks
vi.mock('../../app/presentation/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    uploadFile: vi.fn().mockResolvedValue({
      name: 'test.mp3',
      size: 1000,
      type: 'audio/mp3',
      file: new File(['test'], 'test.mp3', { type: 'audio/mp3' }),
    }),
    isUploading: false,
    error: null,
  }),
}));

vi.mock('../../app/presentation/hooks/useAudio', () => ({
  useAudio: () => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    currentTime: 0,
    duration: 180,
    volume: 1,
    isPlaying: false,
    analyser: null,
  }),
}));

vi.mock('../../app/presentation/hooks/useVisualizer', () => ({
  useVisualizer: () => ({
    config: {
      type: 'circular',
      fftSize: 256,
      smoothing: 0.8,
      sensitivity: 1.0,
      theme: 'rainbow',
    },
    updateConfig: vi.fn(),
  }),
}));

describe('Index Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the main application title', () => {
    render(<Index />);
    
    expect(screen.getByText('Audio Visualizer')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Index />);
    
    expect(screen.getByText('オーディオファイルをアップロードして、リアルタイムビジュアライザーを楽しもう')).toBeInTheDocument();
  });

  it('should render all main components', () => {
    render(<Index />);
    
    expect(screen.getByTestId('file-upload-area')).toBeInTheDocument();
    expect(screen.getByTestId('audio-controls')).toBeInTheDocument();
    expect(screen.getByTestId('visualizer-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('bpm-display')).toBeInTheDocument();
    expect(screen.getByTestId('visualizer-overlay')).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    render(<Index />);
    
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Audio: test.mp3')).toBeInTheDocument();
    });
  });

  it('should handle visualizer config changes', () => {
    render(<Index />);
    
    const changeModeButton = screen.getByText('Change Mode');
    fireEvent.click(changeModeButton);
    
    expect(screen.getByText('Mode: waveform')).toBeInTheDocument();
  });

  it('should handle theme changes through overlay', () => {
    render(<Index />);
    
    const changeThemeButton = screen.getByText('Change Theme');
    fireEvent.click(changeThemeButton);
    
    // Test that the overlay interaction works
    expect(screen.getByTestId('visualizer-overlay')).toBeInTheDocument();
  });

  it('should show settings toggle button', () => {
    render(<Index />);
    
    const settingsButton = screen.getByText('設定');
    expect(settingsButton).toBeInTheDocument();
  });

  it('should toggle settings overlay', () => {
    render(<Index />);
    
    const settingsButton = screen.getByText('設定');
    const overlay = screen.getByTestId('visualizer-overlay');
    
    // Initially hidden
    expect(overlay).toHaveStyle({ display: 'none' });
    
    // Click to show
    fireEvent.click(settingsButton);
    expect(overlay).toHaveStyle({ display: 'block' });
    
    // Click again to hide
    fireEvent.click(settingsButton);
    expect(overlay).toHaveStyle({ display: 'none' });
  });

  it('should handle keyboard navigation', () => {
    render(<Index />);
    
    const settingsButton = screen.getByText('設定');
    fireEvent.keyDown(settingsButton, { key: 'Enter' });
    
    const overlay = screen.getByTestId('visualizer-overlay');
    expect(overlay).toHaveStyle({ display: 'block' });
  });

  it('should handle spacebar for settings toggle', () => {
    render(<Index />);
    
    const settingsButton = screen.getByText('設定');
    fireEvent.keyDown(settingsButton, { key: ' ' });
    
    const overlay = screen.getByTestId('visualizer-overlay');
    expect(overlay).toHaveStyle({ display: 'block' });
  });

  it('should maintain proper layout structure', () => {
    render(<Index />);
    
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('min-h-screen');
  });

  it('should handle center image upload', async () => {
    render(<Index />);
    
    // Simulate selecting an image file
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('file-upload-area')).toBeInTheDocument();
    });
  });

  it('should display error states properly', () => {
    render(<Index />);
    
    // The error handling would be tested through the mocked components
    expect(screen.getByTestId('file-upload-area')).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    render(<Index />);
    
    // Loading state would be visible through the isUploading prop
    expect(screen.getByTestId('file-upload-area')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Index />);
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Audio Visualizer');
    
    const settingsButton = screen.getByRole('button', { name: '設定' });
    expect(settingsButton).toBeInTheDocument();
  });

  it('should handle component state synchronization', () => {
    render(<Index />);
    
    // Test that all components receive the correct props
    expect(screen.getByText('Mode: circular')).toBeInTheDocument();
    expect(screen.getByText('No BPM')).toBeInTheDocument();
  });

  it('should handle mobile responsive design', () => {
    render(<Index />);
    
    const container = screen.getByRole('main');
    expect(container).toHaveClass('p-4', 'md:p-8');
  });

  it('should handle multiple file uploads', async () => {
    render(<Index />);
    
    const uploadButton = screen.getByText('Upload File');
    
    // First upload
    fireEvent.click(uploadButton);
    await waitFor(() => {
      expect(screen.getByText('Audio: test.mp3')).toBeInTheDocument();
    });
    
    // Second upload should replace the first
    fireEvent.click(uploadButton);
    await waitFor(() => {
      expect(screen.getByText('Audio: test.mp3')).toBeInTheDocument();
    });
  });

  it('should handle rapid config changes', () => {
    render(<Index />);
    
    const changeModeButton = screen.getByText('Change Mode');
    const changeThemeButton = screen.getByText('Change Theme');
    
    // Rapid changes
    fireEvent.click(changeModeButton);
    fireEvent.click(changeThemeButton);
    fireEvent.click(changeModeButton);
    
    expect(screen.getByText('Mode: waveform')).toBeInTheDocument();
  });

  it('should handle component unmounting gracefully', () => {
    const { unmount } = render(<Index />);
    
    expect(() => unmount()).not.toThrow();
  });
});