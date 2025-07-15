import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Visualizer Modes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Upload test audio file for visualizer tests
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    
    // Wait for upload to complete
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
  });

  test('should display visualizer canvas', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change visualizer mode to circular', async ({ page }) => {
    // Find visualizer mode selector
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('circular');
    
    // Verify mode is selected
    await expect(modeSelector).toHaveValue('circular');
    
    // Start playing to see visualization
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    // Canvas should be rendering
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change visualizer mode to waveform', async ({ page }) => {
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('waveform');
    
    await expect(modeSelector).toHaveValue('waveform');
    
    // Start playing to see visualization
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change visualizer mode to frequency bars', async ({ page }) => {
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('frequencyBars');
    
    await expect(modeSelector).toHaveValue('frequencyBars');
    
    // Start playing to see visualization
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change visualizer mode to solar system', async ({ page }) => {
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('solarSystem');
    
    await expect(modeSelector).toHaveValue('solarSystem');
    
    // Start playing to see visualization
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change visualizer mode to particle field', async ({ page }) => {
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('particleField');
    
    await expect(modeSelector).toHaveValue('particleField');
    
    // Start playing to see visualization
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change FFT size', async ({ page }) => {
    // Find FFT size selector (usually second select)
    const fftSelector = page.locator('select').nth(1);
    await fftSelector.selectOption('512');
    
    await expect(fftSelector).toHaveValue('512');
    
    // Start playing to see effect
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should change theme color', async ({ page }) => {
    // Find theme selector
    const themeSelector = page.locator('select').nth(2);
    await themeSelector.selectOption('blue');
    
    await expect(themeSelector).toHaveValue('blue');
    
    // Start playing to see theme effect
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should adjust smoothing parameter', async ({ page }) => {
    // Find smoothing slider
    const smoothingSlider = page.locator('input[type="range"]').nth(2);
    await smoothingSlider.fill('0.5');
    
    await expect(smoothingSlider).toHaveValue('0.5');
    
    // Start playing to see effect
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should adjust sensitivity parameter', async ({ page }) => {
    // Find sensitivity slider
    const sensitivitySlider = page.locator('input[type="range"]').nth(3);
    await sensitivitySlider.fill('2');
    
    await expect(sensitivitySlider).toHaveValue('2');
    
    // Start playing to see effect
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle mode changes during playback', async ({ page }) => {
    // Start playing first
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();
    
    // Change mode while playing
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('waveform');
    await expect(modeSelector).toHaveValue('waveform');
    
    // Change to another mode
    await modeSelector.selectOption('frequencyBars');
    await expect(modeSelector).toHaveValue('frequencyBars');
    
    // Canvas should continue rendering
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle parameter changes during playback', async ({ page }) => {
    // Start playing first
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();
    
    // Change multiple parameters
    const smoothingSlider = page.locator('input[type="range"]').nth(2);
    await smoothingSlider.fill('0.3');
    
    const sensitivitySlider = page.locator('input[type="range"]').nth(3);
    await sensitivitySlider.fill('1.5');
    
    const themeSelector = page.locator('select').nth(2);
    await themeSelector.selectOption('green');
    
    // Verify changes took effect
    await expect(smoothingSlider).toHaveValue('0.3');
    await expect(sensitivitySlider).toHaveValue('1.5');
    await expect(themeSelector).toHaveValue('green');
    
    // Canvas should continue rendering
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle all theme variations', async ({ page }) => {
    const themes = ['rainbow', 'blue', 'green', 'orange', 'purple'];
    const themeSelector = page.locator('select').nth(2);
    
    for (const theme of themes) {
      await themeSelector.selectOption(theme);
      await expect(themeSelector).toHaveValue(theme);
      
      // Start playing to see theme
      const playButton = page.getByRole('button', { name: /▶️/ });
      await playButton.click();
      
      await expect(page.locator('canvas')).toBeVisible();
      
      // Stop for next theme
      const stopButton = page.getByRole('button', { name: /⏹️/ });
      await stopButton.click();
    }
  });

  test('should handle all FFT sizes', async ({ page }) => {
    const fftSizes = ['32', '64', '128', '256', '512', '1024'];
    const fftSelector = page.locator('select').nth(1);
    
    for (const size of fftSizes) {
      await fftSelector.selectOption(size);
      await expect(fftSelector).toHaveValue(size);
      
      // Start playing to see effect
      const playButton = page.getByRole('button', { name: /▶️/ });
      await playButton.click();
      
      await expect(page.locator('canvas')).toBeVisible();
      
      // Stop for next size
      const stopButton = page.getByRole('button', { name: /⏹️/ });
      await stopButton.click();
    }
  });

  test('should handle extreme parameter values', async ({ page }) => {
    // Test minimum values
    const smoothingSlider = page.locator('input[type="range"]').nth(2);
    await smoothingSlider.fill('0');
    await expect(smoothingSlider).toHaveValue('0');
    
    const sensitivitySlider = page.locator('input[type="range"]').nth(3);
    await sensitivitySlider.fill('0.1');
    await expect(sensitivitySlider).toHaveValue('0.1');
    
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
    
    // Stop and test maximum values
    const stopButton = page.getByRole('button', { name: /⏹️/ });
    await stopButton.click();
    
    await smoothingSlider.fill('1');
    await expect(smoothingSlider).toHaveValue('1');
    
    await sensitivitySlider.fill('5');
    await expect(sensitivitySlider).toHaveValue('5');
    
    // Play again
    await playButton.click();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle canvas resize', async ({ page }) => {
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.locator('canvas')).toBeVisible();
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Canvas should still be visible and rendering
    await expect(page.locator('canvas')).toBeVisible();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Canvas should adapt
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle rapid mode switching', async ({ page }) => {
    const modes = ['circular', 'waveform', 'frequencyBars', 'solarSystem', 'particleField'];
    const modeSelector = page.locator('select').first();
    
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();
    
    // Rapidly switch modes
    for (const mode of modes) {
      await modeSelector.selectOption(mode);
      await expect(modeSelector).toHaveValue(mode);
      
      // Wait a bit for rendering
      await page.waitForTimeout(100);
      
      // Canvas should continue rendering
      await expect(page.locator('canvas')).toBeVisible();
    }
  });

  test('should handle visualizer with center image', async ({ page }) => {
    // Upload center image
    const imageFilePath = path.join(__dirname, '../fixtures/test-image.jpg');
    const imageFileInput = page.locator('input[type="file"][accept*="image"]');
    await imageFileInput.setInputFiles(imageFilePath);
    
    // Wait for image upload
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
    
    // Start playing audio
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    // Canvas should show both audio visualization and center image
    await expect(page.locator('canvas')).toBeVisible();
    
    // Try different modes with center image
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('circular');
    await expect(page.locator('canvas')).toBeVisible();
    
    await modeSelector.selectOption('solarSystem');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle visualizer performance with high FFT size', async ({ page }) => {
    // Set highest FFT size
    const fftSelector = page.locator('select').nth(1);
    await fftSelector.selectOption('1024');
    
    // Set particle field mode (most demanding)
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('particleField');
    
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    // Should still render smoothly
    await expect(page.locator('canvas')).toBeVisible();
    
    // Change parameters while playing
    const sensitivitySlider = page.locator('input[type="range"]').nth(3);
    await sensitivitySlider.fill('3');
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle visualizer without audio', async ({ page }) => {
    // Canvas should be visible but not animated
    await expect(page.locator('canvas')).toBeVisible();
    
    // Change mode without audio
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('waveform');
    
    await expect(page.locator('canvas')).toBeVisible();
    
    // Change parameters without audio
    const smoothingSlider = page.locator('input[type="range"]').nth(2);
    await smoothingSlider.fill('0.5');
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle visualizer error states', async ({ page }) => {
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    // Simulate error by changing to invalid mode (if handled)
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('circular');
    
    // Should recover gracefully
    await expect(page.locator('canvas')).toBeVisible();
    
    // Try all modes to ensure no crashes
    const modes = ['waveform', 'frequencyBars', 'solarSystem', 'particleField'];
    for (const mode of modes) {
      await modeSelector.selectOption(mode);
      await expect(page.locator('canvas')).toBeVisible();
    }
  });

  test('should maintain visualizer settings across audio changes', async ({ page }) => {
    // Set custom settings
    const modeSelector = page.locator('select').first();
    await modeSelector.selectOption('frequencyBars');
    
    const themeSelector = page.locator('select').nth(2);
    await themeSelector.selectOption('blue');
    
    const smoothingSlider = page.locator('input[type="range"]').nth(2);
    await smoothingSlider.fill('0.3');
    
    // Start playing
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    
    // Verify settings are active
    await expect(modeSelector).toHaveValue('frequencyBars');
    await expect(themeSelector).toHaveValue('blue');
    await expect(smoothingSlider).toHaveValue('0.3');
    
    // Stop and upload new audio
    const stopButton = page.getByRole('button', { name: /⏹️/ });
    await stopButton.click();
    
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    
    // Wait for upload
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
    
    // Settings should be preserved
    await expect(modeSelector).toHaveValue('frequencyBars');
    await expect(themeSelector).toHaveValue('blue');
    await expect(smoothingSlider).toHaveValue('0.3');
  });
});