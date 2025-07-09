import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploadArea } from './FileUploadArea';

// Mock the useDragAndDrop hook
vi.mock('../hooks/useFileUpload', () => ({
  useDragAndDrop: vi.fn((onDrop) => ({
    isDragging: false,
    dragProps: {
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn()
    }
  }))
}));

const defaultProps = {
  type: 'audio' as const,
  accept: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  isUploading: false,
  uploadProgress: 0,
  onFileSelect: vi.fn()
};

describe('FileUploadArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render audio upload area correctly', () => {
    render(<FileUploadArea {...defaultProps} />);

    expect(screen.getByText('🎵')).toBeInTheDocument();
    expect(screen.getByText('オーディオファイル')).toBeInTheDocument();
    expect(screen.getByText('MP3, WAV, OGG, AAC などの音声ファイルをドロップまたは選択')).toBeInTheDocument();
    expect(screen.getByText('音声ファイルを選択')).toBeInTheDocument();
  });

  it('should render image upload area correctly', () => {
    render(<FileUploadArea {...defaultProps} type="image" accept={['image/jpeg', 'image/png']} />);

    expect(screen.getByText('🖼️')).toBeInTheDocument();
    expect(screen.getByText('センター画像')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG, GIF などの画像ファイルをドロップまたは選択')).toBeInTheDocument();
    expect(screen.getByText('画像ファイルを選択')).toBeInTheDocument();
  });

  it('should display supported formats', () => {
    render(<FileUploadArea {...defaultProps} accept={['audio/mpeg', 'audio/wav', 'audio/ogg']} />);

    expect(screen.getByText('対応形式: MPEG, WAV, OGG')).toBeInTheDocument();
  });

  it('should handle file input change', () => {
    const onFileSelect = vi.fn();
    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    const fileInput = screen.getByRole('button', { name: /音声ファイルを選択/ }).querySelector('input[type="file"]');
    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(fileInput!);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should reset file input after selection', () => {
    const onFileSelect = vi.fn();
    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    const fileInput = screen.getByRole('button', { name: /音声ファイルを選択/ }).querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(fileInput);

    expect(fileInput.value).toBe('');
  });

  it('should not call onFileSelect when no file is selected', () => {
    const onFileSelect = vi.fn();
    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    const fileInput = screen.getByRole('button', { name: /音声ファイルを選択/ }).querySelector('input[type="file"]');

    Object.defineProperty(fileInput, 'files', {
      value: [],
      writable: false
    });

    fireEvent.change(fileInput!);

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should show upload progress when uploading', () => {
    render(<FileUploadArea {...defaultProps} isUploading={true} uploadProgress={45} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('アップロード中...')).toBeInTheDocument();
  });

  it('should disable file input when uploading', () => {
    render(<FileUploadArea {...defaultProps} isUploading={true} />);

    const fileInput = screen.getByRole('button', { name: /音声ファイルを選択/ }).querySelector('input[type="file"]');
    expect(fileInput).toBeDisabled();
  });

  it('should apply custom className', () => {
    const { container } = render(<FileUploadArea {...defaultProps} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle drag and drop props', () => {
    const { useDragAndDrop } = require('../hooks/useFileUpload');
    const mockDragProps = {
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn()
    };

    useDragAndDrop.mockReturnValue({
      isDragging: false,
      dragProps: mockDragProps
    });

    render(<FileUploadArea {...defaultProps} />);

    expect(useDragAndDrop).toHaveBeenCalledWith(
      expect.any(Function),
      ['audio/mpeg', 'audio/wav', 'audio/ogg']
    );
  });

  it('should handle file drop through drag and drop', () => {
    const { useDragAndDrop } = require('../hooks/useFileUpload');
    const onFileSelect = vi.fn();
    let dropCallback: (files: File[]) => void = () => {};

    useDragAndDrop.mockImplementation((callback) => {
      dropCallback = callback;
      return {
        isDragging: false,
        dragProps: {
          onDragOver: vi.fn(),
          onDragLeave: vi.fn(),
          onDrop: vi.fn()
        }
      };
    });

    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    dropCallback([file]);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should handle multiple files in drop (select first one)', () => {
    const { useDragAndDrop } = require('../hooks/useFileUpload');
    const onFileSelect = vi.fn();
    let dropCallback: (files: File[]) => void = () => {};

    useDragAndDrop.mockImplementation((callback) => {
      dropCallback = callback;
      return {
        isDragging: false,
        dragProps: {
          onDragOver: vi.fn(),
          onDragLeave: vi.fn(),
          onDrop: vi.fn()
        }
      };
    });

    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    const file1 = new File(['test1'], 'test1.mp3', { type: 'audio/mpeg' });
    const file2 = new File(['test2'], 'test2.mp3', { type: 'audio/mpeg' });
    dropCallback([file1, file2]);

    expect(onFileSelect).toHaveBeenCalledWith(file1);
  });

  it('should not call onFileSelect when no files in drop', () => {
    const { useDragAndDrop } = require('../hooks/useFileUpload');
    const onFileSelect = vi.fn();
    let dropCallback: (files: File[]) => void = () => {};

    useDragAndDrop.mockImplementation((callback) => {
      dropCallback = callback;
      return {
        isDragging: false,
        dragProps: {
          onDragOver: vi.fn(),
          onDragLeave: vi.fn(),
          onDrop: vi.fn()
        }
      };
    });

    render(<FileUploadArea {...defaultProps} onFileSelect={onFileSelect} />);

    dropCallback([]);

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should show dragging state', () => {
    const { useDragAndDrop } = require('../hooks/useFileUpload');

    useDragAndDrop.mockReturnValue({
      isDragging: true,
      dragProps: {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn()
      }
    });

    render(<FileUploadArea {...defaultProps} />);

    expect(screen.getByText('ファイルをドロップしてください')).toBeInTheDocument();
  });

  it('should show drag enter state', () => {
    const { container } = render(<FileUploadArea {...defaultProps} />);

    const uploadArea = container.firstChild as HTMLElement;
    fireEvent.dragEnter(uploadArea);

    expect(screen.getByText('ファイルをドロップしてください')).toBeInTheDocument();
  });

  it('should clear drag enter state on drag leave', () => {
    const { container } = render(<FileUploadArea {...defaultProps} />);

    const uploadArea = container.firstChild as HTMLElement;
    fireEvent.dragEnter(uploadArea);
    fireEvent.dragLeave(uploadArea);

    expect(screen.queryByText('ファイルをドロップしてください')).not.toBeInTheDocument();
  });

  it('should show correct progress circle styling', () => {
    render(<FileUploadArea {...defaultProps} isUploading={true} uploadProgress={25} />);

    const progressCircle = screen.getByText('25%').parentElement?.parentElement?.querySelector('circle[stroke="currentColor"]');
    expect(progressCircle).toBeInTheDocument();
  });

  it('should disable pointer events when uploading', () => {
    const { container } = render(<FileUploadArea {...defaultProps} isUploading={true} />);

    expect(container.firstChild).toHaveClass('pointer-events-none');
  });

  it('should handle different file types correctly', () => {
    const { rerender } = render(<FileUploadArea {...defaultProps} accept={['audio/mpeg']} />);

    expect(screen.getByText('対応形式: MPEG')).toBeInTheDocument();

    rerender(<FileUploadArea {...defaultProps} type="image" accept={['image/jpeg', 'image/png', 'image/gif']} />);

    expect(screen.getByText('対応形式: JPEG, PNG, GIF')).toBeInTheDocument();
  });
});