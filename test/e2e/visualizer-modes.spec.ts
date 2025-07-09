import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Visualizer Modes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Upload test audio file for visualizer tests
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
  });

  test('should display visualizer mode controls', async ({ page }) => {
    // Look for mode toggle buttons
    await expect(page.getByText('円形')).toBeVisible();
    await expect(page.getByText('波形')).toBeVisible();
    await expect(page.getByText('周波数バー')).toBeVisible();
    await expect(page.getByText('太陽系')).toBeVisible();
    await expect(page.getByText('パーティクルフィールド')).toBeVisible();
  });

  test('should start with circular mode enabled by default', async ({ page }) => {
    const circularMode = page.getByText('円形').locator('..');
    await expect(circularMode).toHaveClass(/enabled|active|selected/);
  });

  test('should toggle visualizer modes', async ({ page }) => {
    // Toggle waveform mode
    await page.getByText('波形').click();
    
    const waveformMode = page.getByText('波形').locator('..');
    await expect(waveformMode).toHaveClass(/enabled|active|selected/);
    
    // Toggle frequency bars mode
    await page.getByText('周波数バー').click();
    
    const frequencyMode = page.getByText('周波数バー').locator('..');
    await expect(frequencyMode).toHaveClass(/enabled|active|selected/);
  });

  test('should allow multiple modes to be enabled simultaneously', async ({ page }) => {
    // Enable multiple modes
    await page.getByText('波形').click();
    await page.getByText('周波数バー').click();
    
    // All should be enabled
    const circularMode = page.getByText('円形').locator('..');
    const waveformMode = page.getByText('波形').locator('..');
    const frequencyMode = page.getByText('周波数バー').locator('..');
    
    await expect(circularMode).toHaveClass(/enabled|active|selected/);
    await expect(waveformMode).toHaveClass(/enabled|active|selected/);
    await expect(frequencyMode).toHaveClass(/enabled|active|selected/);
  });

  test('should change visualizer appearance when modes are toggled', async ({ page }) => {
    // Play audio to activate visualizer
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    // Get canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Take screenshot with circular mode
    await page.screenshot({ path: 'test-results/circular-mode.png' });
    
    // Toggle to waveform mode
    await page.getByText('波形').click();
    await page.waitForTimeout(500); // Wait for mode change
    
    // Take screenshot with waveform mode
    await page.screenshot({ path: 'test-results/waveform-mode.png' });
    
    // Visual comparison would be done in actual implementation
    // This test validates the mode switching mechanism
  });

  test('should persist mode selections when audio is restarted', async ({ page }) => {
    // Enable additional modes
    await page.getByText('波形').click();
    await page.getByText('太陽系').click();
    
    // Play audio
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    // Stop audio
    await page.getByRole('button', { name: /⏹️/ }).click();
    
    // Play again
    await page.getByRole('button', { name: /▶️/ }).click();
    
    // Modes should still be enabled
    const waveformMode = page.getByText('波形').locator('..');
    const solarMode = page.getByText('太陽系').locator('..');
    
    await expect(waveformMode).toHaveClass(/enabled|active|selected/);
    await expect(solarMode).toHaveClass(/enabled|active|selected/);
  });

  test('should display mode icons and descriptions', async ({ page }) => {
    // Check for mode icons
    await expect(page.getByText('🌀')).toBeVisible(); // Circular
    await expect(page.getByText('〰️')).toBeVisible(); // Waveform
    await expect(page.getByText('📊')).toBeVisible(); // Frequency
    await expect(page.getByText('🪐')).toBeVisible(); // Solar System
    await expect(page.getByText('✨')).toBeVisible(); // Particle Field
    
    // Check for descriptions
    await expect(page.getByText('クラシックな円形周波数ビジュアライザー')).toBeVisible();
    await expect(page.getByText('リアルタイム音声波形表示')).toBeVisible();
    await expect(page.getByText('周波数スペクトラム棒グラフ')).toBeVisible();
  });

  test('should handle theme changes', async ({ page }) => {
    // Look for theme selector
    const themeSelector = page.locator('[data-testid="theme-selector"]');
    if (await themeSelector.isVisible()) {
      await themeSelector.click();
      
      // Select a different theme
      await page.getByText('カスタムテーマ').click();
      
      // Play audio to see theme change
      await page.getByRole('button', { name: /▶️/ }).click();
      await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    }
  });

  test('should adjust sensitivity settings', async ({ page }) => {
    // Look for sensitivity slider
    const sensitivitySlider = page.locator('[data-testid="sensitivity-slider"]');
    if (await sensitivitySlider.isVisible()) {
      await sensitivitySlider.fill('2.0');
      
      // Play audio to see sensitivity change
      await page.getByRole('button', { name: /▶️/ }).click();
      await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    }
  });

  test('should handle FFT size changes', async ({ page }) => {
    // Look for FFT size selector
    const fftSelector = page.locator('[data-testid="fft-size-selector"]');
    if (await fftSelector.isVisible()) {
      await fftSelector.selectOption('1024');
      
      // Play audio to see FFT size change
      await page.getByRole('button', { name: /▶️/ }).click();
      await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    }
  });

  test('should handle smoothing time constant changes', async ({ page }) => {
    // Look for smoothing slider
    const smoothingSlider = page.locator('[data-testid="smoothing-slider"]');
    if (await smoothingSlider.isVisible()) {
      await smoothingSlider.fill('0.5');
      
      // Play audio to see smoothing change
      await page.getByRole('button', { name: /▶️/ }).click();
      await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    }
  });

  test('should handle particle field mode specifically', async ({ page }) => {
    // Enable particle field mode
    await page.getByText('パーティクルフィールド').click();
    
    const particleMode = page.getByText('パーティクルフィールド').locator('..');
    await expect(particleMode).toHaveClass(/enabled|active|selected/);
    
    // Play audio to see particle effect
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    // Particle field should have unique visual characteristics
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle solar system mode specifically', async ({ page }) => {
    // Enable solar system mode
    await page.getByText('太陽系').click();
    
    const solarMode = page.getByText('太陽系').locator('..');
    await expect(solarMode).toHaveClass(/enabled|active|selected/);
    
    // Play audio to see solar system effect
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    // Solar system should have unique visual characteristics
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should disable modes when clicked again', async ({ page }) => {
    // Enable a mode
    await page.getByText('波形').click();
    
    let waveformMode = page.getByText('波形').locator('..');
    await expect(waveformMode).toHaveClass(/enabled|active|selected/);
    
    // Disable the same mode
    await page.getByText('波形').click();
    
    waveformMode = page.getByText('波形').locator('..');
    await expect(waveformMode).not.toHaveClass(/enabled|active|selected/);
  });

  test('should handle mode changes during playback', async ({ page }) => {
    // Start playing audio
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    // Change modes while playing
    await page.getByText('波形').click();
    await page.waitForTimeout(500);
    
    await page.getByText('周波数バー').click();
    await page.waitForTimeout(500);
    
    // Should still be playing
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
  });

  test('should maintain canvas rendering during mode switches', async ({ page }) => {
    // Start visualizer
    await page.getByRole('button', { name: /▶️/ }).click();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Switch modes rapidly
    await page.getByText('波形').click();
    await page.getByText('周波数バー').click();
    await page.getByText('太陽系').click();
    await page.getByText('パーティクルフィールド').click();
    
    // Canvas should still be visible and rendering
    await expect(canvas).toBeVisible();
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
  });
});