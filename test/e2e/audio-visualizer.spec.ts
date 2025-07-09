import { expect, test } from '@playwright/test';

test.describe('オーディオビジュアライザー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    // ヘッダーの確認
    await expect(page.getByRole('heading', { name: '🎵 オーディオビジュアライザー' })).toBeVisible();
    await expect(page.getByText('音楽を美しく視覚化し、新しい音楽体験をお楽しみください')).toBeVisible();

    // メインコンポーネントの確認
    await expect(page.getByText('📁 ファイル選択')).toBeVisible();
    await expect(page.getByText('🎛️ 再生コントロール')).toBeVisible();
    await expect(page.getByText('🎨 ビジュアライザー')).toBeVisible();

    // ビジュアライザーキャンバスの確認
    await expect(page.getByText('音楽を選択してください')).toBeVisible();
  });

  test('ファイルアップロードエリアが正しく表示される', async ({ page }) => {
    // オーディオファイルアップロードエリア
    await expect(page.getByText('🎵')).toBeVisible();
    await expect(page.getByText('オーディオファイル')).toBeVisible();
    await expect(page.getByText('音声ファイルを選択')).toBeVisible();

    // 画像ファイルアップロードエリア
    await expect(page.getByText('🖼️')).toBeVisible();
    await expect(page.getByText('センター画像')).toBeVisible();
    await expect(page.getByText('画像ファイルを選択')).toBeVisible();
  });

  test('オーディオコントロールが正しく表示される', async ({ page }) => {
    // 再生ボタン
    await expect(page.getByRole('button', { name: '▶️' })).toBeVisible();

    // 停止ボタン
    await expect(page.getByRole('button', { name: '⏹️' })).toBeVisible();

    // 音量コントロール
    await expect(page.getByText('🔊')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();

    // 時間表示（初期状態）
    await expect(page.getByText('0:00')).toBeVisible();
  });

  test('ビジュアライザー設定が正しく表示される', async ({ page }) => {
    // 表示モードセクション
    await expect(page.getByText('表示モード')).toBeVisible();

    // 感度調整セクション
    await expect(page.getByText('感度調整')).toBeVisible();
    await expect(page.getByText('1.0x')).toBeVisible();
  });

  test('ファイルアップロードボタンがクリック可能', async ({ page }) => {
    // オーディオファイル選択ボタン
    const audioButton = page.getByText('音声ファイルを選択');
    await expect(audioButton).toBeVisible();
    await expect(audioButton).toBeEnabled();

    // 画像ファイル選択ボタン
    const imageButton = page.getByText('画像ファイルを選択');
    await expect(imageButton).toBeVisible();
    await expect(imageButton).toBeEnabled();
  });

  test('ビジュアライザーモードの切り替え', async ({ page }) => {
    // モードのチェックボックスを確認
    const modeCheckboxes = page.locator('input[type="checkbox"]');
    await expect(modeCheckboxes).toHaveCount(2); // バーとサークルモード

    // 最初のモード（バー）が有効になっていることを確認
    const firstCheckbox = modeCheckboxes.first();
    await expect(firstCheckbox).toBeChecked();

    // 2番目のモード（サークル）をクリック
    const secondCheckbox = modeCheckboxes.nth(1);
    await secondCheckbox.click();

    // チェックボックスの状態が変更されることを確認
    await expect(secondCheckbox).toBeChecked();
  });

  test('感度スライダーの操作', async ({ page }) => {
    // 感度スライダーを確認
    const sensitivitySlider = page.locator('input[type="range"]').first();
    await expect(sensitivitySlider).toBeVisible();

    // スライダーの値を変更
    await sensitivitySlider.fill('2.0');

    // 値が更新されることを確認
    await expect(page.getByText('2.0x')).toBeVisible();
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップサイズでの表示
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('📁 ファイル選択')).toBeVisible();
    await expect(page.getByText('🎛️ 再生コントロール')).toBeVisible();
    await expect(page.getByText('🎨 ビジュアライザー')).toBeVisible();

    // タブレットサイズでの表示
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('📁 ファイル選択')).toBeVisible();
    await expect(page.getByText('🎛️ 再生コントロール')).toBeVisible();
    await expect(page.getByText('🎨 ビジュアライザー')).toBeVisible();

    // モバイルサイズでの表示
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('📁 ファイル選択')).toBeVisible();
    await expect(page.getByText('🎛️ 再生コントロール')).toBeVisible();
    await expect(page.getByText('🎨 ビジュアライザー')).toBeVisible();
  });

  test('アクセシビリティの確認', async ({ page }) => {
    // セマンティックHTMLの確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // チェックボックスのラベル確認
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < await checkboxes.count(); i++) {
      const checkbox = checkboxes.nth(i);
      await expect(checkbox).toHaveAttribute('aria-label');
    }

    // ボタンのロール確認
    const buttons = page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      await expect(button).toHaveAttribute('role', 'button');
    }
  });

  test('エラー状態の表示', async ({ page }) => {
    // エラーがない状態ではエラーメッセージが表示されない
    await expect(page.getByText('エラーが発生しました')).not.toBeVisible();

    // 音声ファイルがない状態で再生ボタンをクリック
    const playButton = page.getByRole('button', { name: '▶️' });
    await playButton.click();

    // エラーメッセージが表示されることを確認
    await expect(page.getByText('エラーが発生しました')).toBeVisible();
  });

  test('ファイルアップロードのドラッグ&ドロップ表示', async ({ page }) => {
    // オーディオファイルアップロードエリアにドラッグ開始
    const audioUploadArea = page.locator('[data-testid="file-upload-audio"]').first();

    // ドラッグ開始のシミュレーション
    await audioUploadArea.dispatchEvent('dragenter');

    // ドラッグ状態のスタイルが適用されることを確認
    await expect(audioUploadArea).toHaveClass(/border-indigo-400/);
  });

  test('ページのメタ情報', async ({ page }) => {
    // タイトルの確認
    await expect(page).toHaveTitle(/🎵 オーディオビジュアライザー/);

    // メタディスクリプションの確認
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /美しい音楽の視覚化体験/);
  });

  test('キーボードナビゲーション', async ({ page }) => {
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');

    // 最初のフォーカス可能要素にフォーカスが当たることを確認
    await expect(page.locator(':focus')).toBeVisible();

    // スペースキーでチェックボックスの切り替え
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.focus();
    await page.keyboard.press('Space');

    // チェックボックスの状態が変更されることを確認
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('パフォーマンスの確認', async ({ page }) => {
    // ページの読み込み時間を測定
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // 読み込み時間が3秒以内であることを確認
    expect(loadTime).toBeLessThan(3000);

    // メモリ使用量の確認（概算）
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // メモリ使用量が50MB以内であることを確認
    expect(memoryInfo).toBeLessThan(50 * 1024 * 1024);
  });
});
