import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, useToast, ToastContainer, type ToastProps } from '../../../../app/presentation/components/ui/Toast';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid')
  }
});

// Mock timers
vi.useFakeTimers();

describe('Toast', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const defaultProps: ToastProps = {
    id: 'test-id',
    message: 'Test message',
    onClose: mockOnClose
  };

  it('should render with message', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success type', () => {
    render(<Toast {...defaultProps} message="Success!" type="success" />);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should render error type', () => {
    render(<Toast {...defaultProps} message="Error!" type="error" />);
    
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should render warning type', () => {
    render(<Toast {...defaultProps} message="Warning!" type="warning" />);
    
    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should render info type by default', () => {
    render(<Toast {...defaultProps} message="Info!" />);
    
    expect(screen.getByText('Info!')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    // Wait for the leaving animation timeout
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-id');
  });

  it('should auto-close after duration', async () => {
    render(<Toast {...defaultProps} duration={1000} />);

    // Fast-forward past the duration
    vi.advanceTimersByTime(1000);

    // Wait for leaving animation
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-id');
  });

  it('should not auto-close when duration is 0', () => {
    render(<Toast {...defaultProps} duration={0} />);

    // Fast-forward a long time
    vi.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle missing onClose prop', () => {
    const propsWithoutOnClose = {
      id: 'test-id',
      message: 'Test message'
    };

    expect(() => {
      render(<Toast {...propsWithoutOnClose} />);
    }).not.toThrow();
  });

  it('should show entrance animation', async () => {
    render(<Toast {...defaultProps} />);
    
    const toastElement = screen.getByText('Test message').closest('div');
    
    // Initially should not be visible
    expect(toastElement).toHaveClass('translate-x-full');
    
    // After entrance timer
    vi.advanceTimersByTime(10);
    
    await waitFor(() => {
      expect(toastElement).toHaveClass('translate-x-0');
    });
  });
});

describe('useToast', () => {
  let toastHook: ReturnType<typeof useToast>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestComponent() {
    toastHook = useToast();
    return null;
  }

  it('should add toast when showToast is called', () => {
    render(<TestComponent />);
    
    const toastId = toastHook.showToast('Test message');
    
    expect(toastHook.toasts).toHaveLength(1);
    expect(toastHook.toasts[0].message).toBe('Test message');
    expect(toastHook.toasts[0].id).toBe(toastId);
  });

  it('should remove toast when removeToast is called', () => {
    render(<TestComponent />);
    
    const toastId = toastHook.showToast('Test message');
    expect(toastHook.toasts).toHaveLength(1);
    
    toastHook.removeToast(toastId);
    expect(toastHook.toasts).toHaveLength(0);
  });

  it('should clear all toasts when clearAll is called', () => {
    render(<TestComponent />);
    
    toastHook.showToast('Message 1');
    toastHook.showToast('Message 2');
    expect(toastHook.toasts).toHaveLength(2);
    
    toastHook.clearAll();
    expect(toastHook.toasts).toHaveLength(0);
  });

  it('should create success toast with shorthand method', () => {
    render(<TestComponent />);
    
    toastHook.success('Success message');
    
    expect(toastHook.toasts).toHaveLength(1);
    expect(toastHook.toasts[0].type).toBe('success');
    expect(toastHook.toasts[0].message).toBe('Success message');
  });

  it('should create error toast with shorthand method', () => {
    render(<TestComponent />);
    
    toastHook.error('Error message');
    
    expect(toastHook.toasts).toHaveLength(1);
    expect(toastHook.toasts[0].type).toBe('error');
    expect(toastHook.toasts[0].message).toBe('Error message');
  });

  it('should create warning toast with shorthand method', () => {
    render(<TestComponent />);
    
    toastHook.warning('Warning message');
    
    expect(toastHook.toasts).toHaveLength(1);
    expect(toastHook.toasts[0].type).toBe('warning');
    expect(toastHook.toasts[0].message).toBe('Warning message');
  });

  it('should create info toast with shorthand method', () => {
    render(<TestComponent />);
    
    toastHook.info('Info message');
    
    expect(toastHook.toasts).toHaveLength(1);
    expect(toastHook.toasts[0].type).toBe('info');
    expect(toastHook.toasts[0].message).toBe('Info message');
  });
});

describe('ToastContainer', () => {
  const mockToasts: ToastProps[] = [
    {
      id: '1',
      message: 'First toast',
      type: 'success'
    },
    {
      id: '2',
      message: 'Second toast',
      type: 'error'
    }
  ];

  it('should render all toasts', () => {
    render(<ToastContainer toasts={mockToasts} />);
    
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  it('should render empty when no toasts', () => {
    render(<ToastContainer toasts={[]} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});