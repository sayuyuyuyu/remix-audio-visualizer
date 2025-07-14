import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../../app/presentation/components/ui/Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default styling', () => {
      render(<Card>Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
    });

    it('should merge custom className', () => {
      render(<Card className="custom-class">Card content</Card>);
      
      const card = screen.getByText('Card content');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-lg');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Card content</Card>);
      
      expect(ref.current).toBeTruthy();
    });
  });

  describe('CardHeader', () => {
    it('should render with default styling', () => {
      render(<CardHeader>Header content</CardHeader>);
      
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should merge custom className', () => {
      render(<CardHeader className="custom-header">Header content</CardHeader>);
      
      const header = screen.getByText('Header content');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex');
    });
  });

  describe('CardTitle', () => {
    it('should render with default styling', () => {
      render(<CardTitle>Title content</CardTitle>);
      
      const title = screen.getByText('Title content');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none');
    });

    it('should merge custom className', () => {
      render(<CardTitle className="custom-title">Title content</CardTitle>);
      
      const title = screen.getByText('Title content');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('text-2xl');
    });
  });

  describe('CardDescription', () => {
    it('should render with default styling', () => {
      render(<CardDescription>Description content</CardDescription>);
      
      const description = screen.getByText('Description content');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(<CardDescription className="custom-desc">Description content</CardDescription>);
      
      const description = screen.getByText('Description content');
      expect(description).toHaveClass('custom-desc');
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('CardContent', () => {
    it('should render with default styling', () => {
      render(<CardContent>Content body</CardContent>);
      
      const content = screen.getByText('Content body');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(<CardContent className="custom-content">Content body</CardContent>);
      
      const content = screen.getByText('Content body');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('p-6');
    });
  });

  describe('CardFooter', () => {
    it('should render with default styling', () => {
      render(<CardFooter>Footer content</CardFooter>);
      
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should merge custom className', () => {
      render(<CardFooter className="custom-footer">Footer content</CardFooter>);
      
      const footer = screen.getByText('Footer content');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex');
    });
  });

  describe('Complete Card Structure', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <p>Footer text</p>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
      expect(screen.getByText('Footer text')).toBeInTheDocument();
    });

    it('should handle nested components correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Audio Player</CardTitle>
            <CardDescription>Upload and play audio files</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <button>Play</button>
              <button>Pause</button>
            </div>
          </CardContent>
          <CardFooter>
            <span>Duration: 3:45</span>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Audio Player')).toBeInTheDocument();
      expect(screen.getByText('Upload and play audio files')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.getByText('Duration: 3:45')).toBeInTheDocument();
    });

    it('should handle card without header', () => {
      render(
        <Card>
          <CardContent>
            <p>Content without header</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Content without header')).toBeInTheDocument();
    });

    it('should handle card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content without footer</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.getByText('Content without footer')).toBeInTheDocument();
    });

    it('should handle card with only content', () => {
      render(
        <Card>
          <CardContent>
            <p>Minimal card</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Minimal card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support custom HTML attributes', () => {
      render(
        <Card data-testid="audio-card" role="region" aria-label="Audio controls">
          <CardContent>Accessible card</CardContent>
        </Card>
      );

      const card = screen.getByTestId('audio-card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Audio controls');
    });

    it('should support title with heading semantics', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h2">Main Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Main Title');
    });

    it('should handle focus management', () => {
      render(
        <Card tabIndex={0}>
          <CardContent>Focusable card</CardContent>
        </Card>
      );

      const card = screen.getByText('Focusable card').parentElement;
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Responsive Design', () => {
    it('should support responsive classes', () => {
      render(
        <Card className="md:w-1/2 lg:w-1/3">
          <CardContent>Responsive card</CardContent>
        </Card>
      );

      const card = screen.getByText('Responsive card').parentElement;
      expect(card).toHaveClass('md:w-1/2', 'lg:w-1/3');
    });

    it('should support different padding on mobile', () => {
      render(
        <Card>
          <CardContent className="p-4 md:p-6">
            Responsive padding
          </CardContent>
        </Card>
      );

      const content = screen.getByText('Responsive padding');
      expect(content).toHaveClass('p-4', 'md:p-6');
    });
  });
});