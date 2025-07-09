import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioControls } from "./AudioControls";

describe("AudioControls", () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    canPlay: true,
    currentTime: 0,
    duration: 120,
    volume: 0.5,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStop: vi.fn(),
    onSeek: vi.fn(),
    onVolumeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本表示", () => {
    it("再生ボタンと停止ボタンを表示する", () => {
      render(<AudioControls {...defaultProps} />);

      expect(screen.getByText("▶️")).toBeInTheDocument();
      expect(screen.getByText("⏹️")).toBeInTheDocument();
    });

    it("音量コントロールを表示する", () => {
      render(<AudioControls {...defaultProps} />);

      expect(screen.getByText("🔊")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("時間表示を表示する", () => {
      render(<AudioControls {...defaultProps} />);

      expect(screen.getByText("0:00")).toBeInTheDocument();
      expect(screen.getByText("2:00")).toBeInTheDocument();
    });
  });

  describe("再生状態", () => {
    it("再生中は一時停止ボタンを表示する", () => {
      render(<AudioControls {...defaultProps} isPlaying={true} />);

      expect(screen.getByText("⏸️")).toBeInTheDocument();
      expect(screen.queryByText("▶️")).not.toBeInTheDocument();
    });

    it("再生中でない場合は再生ボタンを表示する", () => {
      render(<AudioControls {...defaultProps} isPlaying={false} />);

      expect(screen.getByText("▶️")).toBeInTheDocument();
      expect(screen.queryByText("⏸️")).not.toBeInTheDocument();
    });

    it("再生ボタンクリック時にonPlayが呼ばれる", () => {
      render(<AudioControls {...defaultProps} />);

      const playButton = screen.getByText("▶️").closest("button");
      fireEvent.click(playButton!);

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it("一時停止ボタンクリック時にonPauseが呼ばれる", () => {
      render(<AudioControls {...defaultProps} isPlaying={true} />);

      const pauseButton = screen.getByText("⏸️").closest("button");
      fireEvent.click(pauseButton!);

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it("停止ボタンクリック時にonStopが呼ばれる", () => {
      render(<AudioControls {...defaultProps} />);

      const stopButton = screen.getByText("⏹️").closest("button");
      fireEvent.click(stopButton!);

      expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe("無効状態", () => {
    it("canPlayがfalseの場合、ボタンが無効化される", () => {
      render(<AudioControls {...defaultProps} canPlay={false} />);

      const playButton = screen.getByText("▶️").closest("button");
      const stopButton = screen.getByText("⏹️").closest("button");

      expect(playButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
    });

    it("isLoadingがtrueの場合、ボタンが無効化される", () => {
      render(<AudioControls {...defaultProps} isLoading={true} />);

      const playButton = screen.getByText("▶️").closest("button");
      const stopButton = screen.getByText("⏹️").closest("button");

      expect(playButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
    });
  });

  describe("時間表示", () => {
    it("現在時間を正しく表示する", () => {
      render(<AudioControls {...defaultProps} currentTime={65} />);

      expect(screen.getByText("1:05")).toBeInTheDocument();
    });

    it("総再生時間を正しく表示する", () => {
      render(<AudioControls {...defaultProps} duration={185} />);

      expect(screen.getByText("3:05")).toBeInTheDocument();
    });

    it("時間が0の場合、0:00を表示する", () => {
      render(<AudioControls {...defaultProps} currentTime={0} duration={0} />);

      expect(screen.getByText("0:00")).toBeInTheDocument();
    });
  });

  describe("シークバー", () => {
    it("シークバーの値が正しく設定される", () => {
      render(<AudioControls {...defaultProps} currentTime={60} duration={120} />);

      const seekBar = screen.getByRole("slider");
      expect(seekBar).toHaveValue("50");
    });

    it("シークバー変更時にonSeekが呼ばれる", () => {
      render(<AudioControls {...defaultProps} />);

      const seekBar = screen.getByRole("slider");
      fireEvent.change(seekBar, { target: { value: "50" } });

      expect(defaultProps.onSeek).toHaveBeenCalledWith(60); // 50% of 120 seconds
    });

    it("durationが0の場合、シークバーを表示しない", () => {
      render(<AudioControls {...defaultProps} duration={0} />);

      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    });
  });

  describe("音量コントロール", () => {
    it("音量スライダーの値が正しく設定される", () => {
      render(<AudioControls {...defaultProps} volume={0.75} />);

      const volumeSlider = screen.getAllByRole("slider")[1]; // 2番目のスライダー
      expect(volumeSlider).toHaveValue("75");
    });

    it("音量表示が正しく表示される", () => {
      render(<AudioControls {...defaultProps} volume={0.75} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("音量スライダー変更時にonVolumeChangeが呼ばれる", () => {
      render(<AudioControls {...defaultProps} />);

      const volumeSlider = screen.getAllByRole("slider")[1];
      fireEvent.change(volumeSlider, { target: { value: "80" } });

      expect(defaultProps.onVolumeChange).toHaveBeenCalledWith(0.8);
    });

    it("音量が0%の場合、0%を表示する", () => {
      render(<AudioControls {...defaultProps} volume={0} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("音量が100%の場合、100%を表示する", () => {
      render(<AudioControls {...defaultProps} volume={1} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("ローディング中はローディングインジケーターを表示する", () => {
      render(<AudioControls {...defaultProps} isLoading={true} />);

      // ローディング状態ではボタンのテキストが表示されない
      expect(screen.queryByText("▶️")).not.toBeInTheDocument();
      expect(screen.queryByText("⏸️")).not.toBeInTheDocument();
    });
  });

  describe("カスタムクラス", () => {
    it("カスタムクラスを適用する", () => {
      render(<AudioControls {...defaultProps} className="custom-class" />);

      const container = screen.getByText("▶️").closest('[class*="Card"]');
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("アクセシビリティ", () => {
    it("ボタンに適切なロールがある", () => {
      render(<AudioControls {...defaultProps} />);

      const playButton = screen.getByText("▶️").closest("button");
      const stopButton = screen.getByText("⏹️").closest("button");

      expect(playButton).toHaveAttribute("role", "button");
      expect(stopButton).toHaveAttribute("role", "button");
    });

    it("スライダーに適切なロールがある", () => {
      render(<AudioControls {...defaultProps} />);

      const sliders = screen.getAllByRole("slider");
      expect(sliders).toHaveLength(2); // シークバーと音量スライダー
    });
  });

  describe("エッジケース", () => {
    it("非常に長い時間を正しく表示する", () => {
      render(<AudioControls {...defaultProps} currentTime={3661} duration={7200} />);

      expect(screen.getByText("61:01")).toBeInTheDocument();
      expect(screen.getByText("120:00")).toBeInTheDocument();
    });

    it("小数点の時間を正しく表示する", () => {
      render(<AudioControls {...defaultProps} currentTime={30.5} duration={60.7} />);

      expect(screen.getByText("0:30")).toBeInTheDocument();
      expect(screen.getByText("1:00")).toBeInTheDocument();
    });
  });
});
