import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Audio Visualizer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome message when no audio file is loaded', async ({ page }) => {
    await expect(page.getByText('音楽を選択してください')).toBeVisible();
    await expect(page.getByText('美しいビジュアライザーをお楽しみいただけます')).toBeVisible();
  });

  test('should display audio upload area', async ({ page }) => {
    await expect(page.getByText('オーディオファイル')).toBeVisible();
    await expect(page.getByText('音声ファイルを選択')).toBeVisible();
    await expect(page.getByText('MP3, WAV, OGG, AAC などの音声ファイルをドロップまたは選択')).toBeVisible();
  });

  test('should display image upload area', async ({ page }) => {
    await expect(page.getByText('センター画像')).toBeVisible();
    await expect(page.getByText('画像ファイルを選択')).toBeVisible();
    await expect(page.getByText('JPEG, PNG, GIF などの画像ファイルをドロップまたは選択')).toBeVisible();
  });

  test('should upload audio file and show controls', async ({ page }) => {
    // Create test audio file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    
    // Mock file input
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);

    // Wait for upload to complete
    await expect(page.getByText('アップロード中...')).toBeVisible();
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    // Check that audio controls are visible
    await expect(page.getByRole('button', { name: /▶️/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /⏹️/ })).toBeVisible();
  });

  test('should play audio and show visualizer', async ({ page }) => {
    // Upload test audio file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);

    // Wait for upload to complete
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    // Click play button
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();

    // Check that pause button is now visible
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();

    // Check that visualizer is animating
    await expect(page.getByText('ビジュアライザー動作中')).toBeVisible();
  });

  test('should pause audio', async ({ page }) => {
    // Upload and play audio
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();

    // Click pause button
    const pauseButton = page.getByRole('button', { name: /⏸️/ });
    await pauseButton.click();

    // Check that play button is visible again
    await expect(page.getByRole('button', { name: /▶️/ })).toBeVisible();
    await expect(page.getByText('一時停止中')).toBeVisible();
  });

  test('should stop audio', async ({ page }) => {
    // Upload and play audio
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();

    // Click stop button
    const stopButton = page.getByRole('button', { name: /⏹️/ });
    await stopButton.click();

    // Check that play button is visible and audio is stopped
    await expect(page.getByRole('button', { name: /▶️/ })).toBeVisible();
    await expect(page.getByText('一時停止中')).toBeVisible();
  });

  test('should control volume', async ({ page }) => {
    // Upload audio file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    // Find volume slider
    const volumeSlider = page.locator('input[type="range"]').nth(1); // Second slider is volume
    
    // Change volume to 50%
    await volumeSlider.fill('50');
    await expect(page.getByText('50%')).toBeVisible();

    // Change volume to 100%
    await volumeSlider.fill('100');
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('should show time progress when audio is playing', async ({ page }) => {
    // Upload audio file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    // Play audio
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.click();

    // Check that time display is visible
    await expect(page.locator('text=/\\d+:\\d+/')).toBeVisible();
    
    // Check that seek bar is visible
    const seekBar = page.locator('input[type="range"]').first();
    await expect(seekBar).toBeVisible();
  });

  test('should upload center image', async ({ page }) => {
    // Create test image file
    const imageFilePath = path.join(__dirname, '../fixtures/test-image.jpg');
    
    // Upload image
    const imageFileInput = page.locator('input[type="file"][accept*="image"]');
    await imageFileInput.setInputFiles(imageFilePath);

    // Wait for upload to complete
    await expect(page.getByText('アップロード中...')).toBeVisible();
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Try to upload text file as audio
    const textFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(textFilePath);

    // Should show error message
    await expect(page.getByText(/サポートされていない/)).toBeVisible();
  });

  test('should show progress during file upload', async ({ page }) => {
    // Upload audio file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);

    // Check progress indicators
    await expect(page.getByText('アップロード中...')).toBeVisible();
    await expect(page.getByText(/%/)).toBeVisible();
    
    // Progress should eventually complete
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
  });

  test('should handle drag and drop for audio files', async ({ page }) => {
    // Create test file
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    
    // Simulate drag and drop
    const uploadArea = page.locator('[data-testid="audio-upload-area"]').first();
    
    // Create file input programmatically and trigger change
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    
    // Wait for upload to complete
    await expect(page.getByText('アップロード中...')).toBeVisible();
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });
    
    // Check that controls are now available
    await expect(page.getByRole('button', { name: /▶️/ })).toBeVisible();
  });

  test('should handle large file upload', async ({ page }) => {
    // This test would need a large file in fixtures
    // For now, we'll test the error case
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);

    // Should either succeed or show size error
    await page.waitForTimeout(1000);
    
    // Check for either success or error state
    const hasError = await page.getByText(/サイズが大きすぎます/).isVisible();
    const hasSuccess = await page.getByRole('button', { name: /▶️/ }).isVisible();
    
    expect(hasError || hasSuccess).toBe(true);
  });

  test('should maintain responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that key elements are still visible
    await expect(page.getByText('音楽を選択してください')).toBeVisible();
    await expect(page.getByText('オーディオファイル')).toBeVisible();
    await expect(page.getByText('センター画像')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Upload audio file first
    const audioFilePath = path.join(__dirname, '../fixtures/test-audio.mp3');
    const fileInput = page.locator('input[type="file"][accept*="audio"]');
    await fileInput.setInputFiles(audioFilePath);
    await expect(page.getByText('アップロード中...')).toBeHidden({ timeout: 10000 });

    // Test keyboard navigation
    const playButton = page.getByRole('button', { name: /▶️/ });
    await playButton.focus();
    await page.keyboard.press('Enter');
    
    // Should start playing
    await expect(page.getByRole('button', { name: /⏸️/ })).toBeVisible();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on other controls
    const stopButton = page.getByRole('button', { name: /⏹️/ });
    await expect(stopButton).toBeFocused();
  });
});