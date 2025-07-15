import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../../app/presentation/components/ui/Button';

describe('Button', () => {
  it('should render with text content', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply default variant styling', () => {
    render(<Button>Default</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600');
  });

  it('should apply primary variant styling', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600');
  });

  it('should apply secondary variant styling', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-slate-100', 'to-slate-200');
  });

  it('should apply danger variant styling', () => {
    render(<Button variant="danger">Delete</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-red-500', 'to-pink-600');
  });

  it('should apply outline variant styling', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-2', 'border-indigo-200', 'bg-transparent');
  });

  it('should apply ghost variant styling', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent', 'hover:bg-slate-100');
  });

  it('should apply default size styling', () => {
    render(<Button>Default Size</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('should apply sm size styling', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('should apply lg size styling', () => {
    render(<Button size="lg">Large</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('should apply xl size styling', () => {
    render(<Button size="xl">Extra Large</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
  });

  it('should merge custom className with default classes', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('inline-flex');
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Test</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should handle disabled state styling', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should handle keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    
    const button = screen.getByRole('button');
    
    // Verify button is focusable and receives keyboard events
    button.focus();
    expect(button).toHaveFocus();
    
    // Test that button responds to keyboard events (basic keydown)
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    
    // Button should be a proper button element
    expect(button.tagName).toBe('BUTTON');
  });

  it('should support button type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should support form attribute', () => {
    render(<Button form="test-form">Form Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('form', 'test-form');
  });

  it('should support aria attributes', () => {
    render(
      <Button aria-label="Custom label" aria-describedby="description">
        Accessible
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('aria-describedby', 'description');
  });

  it('should handle focus states', () => {
    render(<Button>Focus Test</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
    expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
  });

  it('should render with icons', () => {
    render(<Button>🔥 Fire Button</Button>);
    
    expect(screen.getByText('🔥 Fire Button')).toBeInTheDocument();
  });

  it('should handle long text content', () => {
    const longText = 'This is a very long button text that should be handled properly';
    render(<Button>{longText}</Button>);
    
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should handle empty content', () => {
    render(<Button></Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should support loading state', () => {
    render(<Button isLoading>Loading...</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle multiple event handlers', () => {
    const handleClick = vi.fn();
    const handleMouseOver = vi.fn();
    
    render(
      <Button onClick={handleClick} onMouseOver={handleMouseOver}>
        Multi Event
      </Button>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.mouseOver(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleMouseOver).toHaveBeenCalledTimes(1);
  });
});