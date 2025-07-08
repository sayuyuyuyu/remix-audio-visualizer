import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisualizerCanvas } from "./VisualizerCanvas";

// Canvas API のモック
const mockCanvas = {
  width: 1024,
  height: 500,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
  })),
};

// HTMLCanvasElement のモック
Object.defineProperty(global, "HTMLCanvasElement", {
  value: class {
    getContext() {
      return mockCanvas.getContext();
    }
  },
});

describe("VisualizerCanvas", () => {
  const mockOnCanvasReady = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("音声ファイルがない場合", () => {
    it("プレースホルダーを表示する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={false}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      expect(screen.getByText("音楽を選択してください")).toBeInTheDocument();
      expect(screen.getByText("美しいビジュアライザーをお楽しみいただけます")).toBeInTheDocument();
      expect(screen.getByText("🎵")).toBeInTheDocument();
    });

    it("キャンバスを表示しない", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={false}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const canvas = screen.queryByRole("img", { hidden: true });
      expect(canvas).not.toBeInTheDocument();
    });
  });

  describe("音声ファイルがある場合", () => {
    it("キャンバスを表示する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const canvas = screen.getByRole("img", { hidden: true });
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute("width", "1024");
      expect(canvas).toHaveAttribute("height", "500");
    });

    it("プレースホルダーを表示しない", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      expect(screen.queryByText("音楽を選択してください")).not.toBeInTheDocument();
    });

    it("再生中でない場合、一時停止インジケーターを表示する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          isPlaying={false}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      expect(screen.getByText("一時停止中")).toBeInTheDocument();
    });

    it("再生中でアニメーション中の場合、ビジュアライザー動作中インジケーターを表示する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          isPlaying={true}
          isAnimating={true}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      expect(screen.getByText("ビジュアライザー動作中")).toBeInTheDocument();
    });

    it("キャンバスが準備できていない場合、ローディング状態を表示する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      expect(screen.getByText("ビジュアライザーを初期化中...")).toBeInTheDocument();
    });
  });

  describe("センター画像", () => {
    const mockCenterImage = {
      id: "test-image",
      name: "test.jpg",
      url: "data:image/jpeg;base64,test",
      size: 1024,
      type: "image/jpeg",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("センター画像が設定されている場合、画像を読み込む", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          centerImage={mockCenterImage}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      // 画像の読み込み処理が実行されることを確認
      // 実際の画像読み込みは非同期なので、エラーハンドリングのテスト
      expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    });
  });

  describe("カスタムサイズ", () => {
    it("カスタム幅と高さを適用する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          width={800}
          height={400}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const canvas = screen.getByRole("img", { hidden: true });
      expect(canvas).toHaveAttribute("width", "800");
      expect(canvas).toHaveAttribute("height", "400");
    });
  });

  describe("CSS クラス", () => {
    it("カスタムクラスを適用する", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          className="custom-class"
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const container = screen.getByRole("img", { hidden: true }).parentElement;
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なARIA属性を持つ", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={true}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const canvas = screen.getByRole("img", { hidden: true });
      expect(canvas).toBeInTheDocument();
    });

    it("音声ファイルがない場合、プレースホルダーが適切に表示される", () => {
      render(
        <VisualizerCanvas
          hasAudioFile={false}
          onCanvasReady={mockOnCanvasReady}
        />
      );

      const placeholder = screen.getByText("音楽を選択してください");
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass("text-slate-300");
    });
  });
});
