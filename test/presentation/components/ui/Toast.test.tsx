import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../../../../app/presentation/components/ui/Toast';

describe('Toast', () => {
  it('should render with message', () => {
    render(<Toast message="Test message" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success variant', () => {
    render(<Toast message="Success!" variant="success" />);
    
    const toast = screen.getByText('Success!').parentElement;
    expect(toast).toHaveClass('bg-green-500');
  });

  it('should render error variant', () => {
    render(<Toast message="Error!" variant="error" />);
    
    const toast = screen.getByText('Error!').parentElement;
    expect(toast).toHaveClass('bg-red-500');
  });

  it('should render warning variant', () => {
    render(<Toast message="Warning!" variant="warning" />);
    
    const toast = screen.getByText('Warning!').parentElement;
    expect(toast).toHaveClass('bg-yellow-500');
  });

  it('should render info variant', () => {
    render(<Toast message="Info!" variant="info" />);
    
    const toast = screen.getByText('Info!').parentElement;
    expect(toast).toHaveClass('bg-blue-500');
  });

  it('should render default variant when no variant specified', () => {
    render(<Toast message="Default message" />);
    
    const toast = screen.getByText('Default message').parentElement;
    expect(toast).toHaveClass('bg-gray-800');
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<Toast message="Test" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should auto-close after duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    render(<Toast message="Test" onClose={onClose} duration={1000} />);
    
    vi.advanceTimersByTime(1000);
    
    expect(onClose).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should not auto-close when duration is 0', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    render(<Toast message="Test" onClose={onClose} duration={0} />);
    
    vi.advanceTimersByTime(5000);
    
    expect(onClose).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should use default duration when not specified', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    render(<Toast message="Test" onClose={onClose} />);
    
    vi.advanceTimersByTime(3000);
    
    expect(onClose).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should clear timeout when unmounted', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    const { unmount } = render(<Toast message="Test" onClose={onClose} duration={1000} />);
    
    unmount();
    vi.advanceTimersByTime(1000);
    
    expect(onClose).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should handle long messages', () => {
    const longMessage = 'This is a very long message that should be displayed properly in the toast component without breaking the layout or causing any issues';
    
    render(<Toast message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle empty message', () => {
    render(<Toast message="" />);
    
    const toast = screen.getByText('').parentElement;
    expect(toast).toBeInTheDocument();
  });

  it('should support custom className', () => {
    render(<Toast message="Test" className="custom-toast" />);
    
    const toast = screen.getByText('Test').parentElement;
    expect(toast).toHaveClass('custom-toast');
  });

  it('should have proper ARIA attributes', () => {
    render(<Toast message="Test message" />);
    
    const toast = screen.getByText('Test message').parentElement;
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('should have proper ARIA attributes for error variant', () => {
    render(<Toast message="Error message" variant="error" />);
    
    const toast = screen.getByText('Error message').parentElement;
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('should support keyboard navigation for close button', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.keyDown(closeButton, { key: 'Enter' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should support spacebar for close button', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.keyDown(closeButton, { key: ' ' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display close button with proper label', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('should handle rapid re-renders', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Toast message="Test 1" onClose={onClose} />);
    
    rerender(<Toast message="Test 2" onClose={onClose} />);
    rerender(<Toast message="Test 3" onClose={onClose} />);
    
    expect(screen.getByText('Test 3')).toBeInTheDocument();
  });

  it('should handle different variants in sequence', () => {
    const { rerender } = render(<Toast message="Success" variant="success" />);
    
    expect(screen.getByText('Success').parentElement).toHaveClass('bg-green-500');
    
    rerender(<Toast message="Error" variant="error" />);
    
    expect(screen.getByText('Error').parentElement).toHaveClass('bg-red-500');
  });

  it('should pause auto-close on hover', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    render(<Toast message="Test" onClose={onClose} duration={1000} />);
    
    const toast = screen.getByText('Test').parentElement;
    fireEvent.mouseEnter(toast);
    
    vi.advanceTimersByTime(1000);
    expect(onClose).not.toHaveBeenCalled();
    
    fireEvent.mouseLeave(toast);
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should handle multiple toasts', () => {
    render(
      <div>
        <Toast message="Toast 1" variant="success" />
        <Toast message="Toast 2" variant="error" />
        <Toast message="Toast 3" variant="warning" />
      </div>
    );
    
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });
});