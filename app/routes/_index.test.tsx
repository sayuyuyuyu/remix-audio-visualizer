import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "./_index";

// カスタムフックのモック
vi.mock("../presentation/hooks/useAudio", () => ({
  useAudio: vi.fn(() => ({
    audioFile: null,
    isPlaying: false,
    isLoading: false,
    error: null,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    audioRepository: null,
    setAudioFile: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setCurrentTime: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock("../presentation/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(() => ({
    isUploading: false,
    uploadProgress: 0,
    uploadAudioFile: vi.fn(),
    uploadImageFile: vi.fn(),
    supportedFormats: {
      audio: ["audio/mp3", "audio/wav"],
      image: ["image/jpeg", "image/png"],
    },
  })),
}));

vi.mock("../presentation/hooks/useVisualizer", () => ({
  useVisualizer: vi.fn(() => ({
    config: {
      modes: [
        {
          id: "bars",
          nameJa: "バー",
          descriptionJa: "周波数バー表示",
          icon: "📊",
          enabled: true,
        },
        {
          id: "circles",
          nameJa: "サークル",
          descriptionJa: "円形表示",
          icon: "⭕",
          enabled: false,
        },
      ],
      sensitivity: 1.0,
    },
    isAnimating: false,
    error: null,
    toggleMode: vi.fn(),
    updateSensitivity: vi.fn(),
    startAnimation: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock("../presentation/components/ui/Toast", () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
  })),
  ToastContainer: vi.fn(() => <div data-testid="toast-container" />),
}));

// コンポーネントのモック
vi.mock("../presentation/components/VisualizerCanvas", () => ({
  VisualizerCanvas: vi.fn(({ hasAudioFile, className }) => (
    <div data-testid="visualizer-canvas" className={className}>
      {hasAudioFile ? "ビジュアライザー" : "プレースホルダー"}
    </div>
  )),
}));

vi.mock("../presentation/components/FileUploadArea", () => ({
  FileUploadArea: vi.fn(({ type, onFileSelect }) => (
    <div data-testid={`file-upload-${type}`}>
      <button onClick={() => onFileSelect(new File(["test"], "test.mp3"))}>
        {type === "audio" ? "音声ファイルを選択" : "画像ファイルを選択"}
      </button>
    </div>
  )),
}));

vi.mock("../presentation/components/AudioControls", () => ({
  AudioControls: vi.fn(({ isPlaying, canPlay }) => (
    <div data-testid="audio-controls">
      <button disabled={!canPlay}>
        {isPlaying ? "⏸️" : "▶️"}
      </button>
    </div>
  )),
}));

describe("Index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本表示", () => {
    it("ヘッダーを正しく表示する", () => {
      render(<Index />);

      expect(screen.getByText("🎵 オーディオビジュアライザー")).toBeInTheDocument();
      expect(screen.getByText("音楽を美しく視覚化し、新しい音楽体験をお楽しみください")).toBeInTheDocument();
    });

    it("ビジュアライザーキャンバスを表示する", () => {
      render(<Index />);

      expect(screen.getByTestId("visualizer-canvas")).toBeInTheDocument();
    });

    it("ファイルアップロードエリアを表示する", () => {
      render(<Index />);

      expect(screen.getByTestId("file-upload-audio")).toBeInTheDocument();
      expect(screen.getByTestId("file-upload-image")).toBeInTheDocument();
    });

    it("オーディオコントロールを表示する", () => {
      render(<Index />);

      expect(screen.getByTestId("audio-controls")).toBeInTheDocument();
    });

    it("ビジュアライザー設定を表示する", () => {
      render(<Index />);

      expect(screen.getByText("表示モード")).toBeInTheDocument();
      expect(screen.getByText("感度調整")).toBeInTheDocument();
      expect(screen.getByText("バー")).toBeInTheDocument();
      expect(screen.getByText("サークル")).toBeInTheDocument();
    });
  });

  describe("ビジュアライザーの状態", () => {
    it("音声ファイルがない場合、プレースホルダーを表示する", () => {
      render(<Index />);

      expect(screen.getByText("プレースホルダー")).toBeInTheDocument();
    });

    it("音声ファイルがある場合、ビジュアライザーを表示する", () => {
      const { useAudio } = require("../presentation/hooks/useAudio");
      useAudio.mockReturnValue({
        audioFile: { name: "test.mp3" },
        isPlaying: false,
        isLoading: false,
        error: null,
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        audioRepository: null,
        setAudioFile: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
        setCurrentTime: vi.fn(),
        clearError: vi.fn(),
      });

      render(<Index />);

      expect(screen.getByText("ビジュアライザー")).toBeInTheDocument();
    });
  });

  describe("ファイルアップロード", () => {
    it("音声ファイルアップロードボタンがクリック可能", () => {
      render(<Index />);

      const audioButton = screen.getByText("音声ファイルを選択");
      expect(audioButton).toBeInTheDocument();
      expect(audioButton).not.toBeDisabled();
    });

    it("画像ファイルアップロードボタンがクリック可能", () => {
      render(<Index />);

      const imageButton = screen.getByText("画像ファイルを選択");
      expect(imageButton).toBeInTheDocument();
      expect(imageButton).not.toBeDisabled();
    });

    it("音声ファイルアップロード時にハンドラーが呼ばれる", async () => {
      const mockUploadAudioFile = vi.fn();
      const mockSetAudioFile = vi.fn();
      const mockSuccess = vi.fn();

      const { useFileUpload } = require("../presentation/hooks/useFileUpload");
      const { useAudio } = require("../presentation/hooks/useAudio");
      const { useToast } = require("../presentation/components/ui/Toast");

      useFileUpload.mockReturnValue({
        isUploading: false,
        uploadProgress: 0,
        uploadAudioFile: mockUploadAudioFile,
        uploadImageFile: vi.fn(),
        supportedFormats: {
          audio: ["audio/mp3", "audio/wav"],
          image: ["image/jpeg", "image/png"],
        },
      });

      useAudio.mockReturnValue({
        audioFile: null,
        isPlaying: false,
        isLoading: false,
        error: null,
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        audioRepository: null,
        setAudioFile: mockSetAudioFile,
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
        setCurrentTime: vi.fn(),
        clearError: vi.fn(),
      });

      useToast.mockReturnValue({
        toasts: [],
        success: mockSuccess,
        error: vi.fn(),
      });

      mockUploadAudioFile.mockResolvedValue({ name: "test.mp3" });

      render(<Index />);

      const audioButton = screen.getByText("音声ファイルを選択");
      fireEvent.click(audioButton);

      await waitFor(() => {
        expect(mockUploadAudioFile).toHaveBeenCalled();
        expect(mockSetAudioFile).toHaveBeenCalled();
        expect(mockSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("ビジュアライザーモード", () => {
    it("モードの切り替えが可能", () => {
      const mockToggleMode = vi.fn();
      const mockSuccess = vi.fn();

      const { useVisualizer } = require("../presentation/hooks/useVisualizer");
      const { useToast } = require("../presentation/components/ui/Toast");

      useVisualizer.mockReturnValue({
        config: {
          modes: [
            {
              id: "bars",
              nameJa: "バー",
              descriptionJa: "周波数バー表示",
              icon: "📊",
              enabled: true,
            },
            {
              id: "circles",
              nameJa: "サークル",
              descriptionJa: "円形表示",
              icon: "⭕",
              enabled: false,
            },
          ],
          sensitivity: 1.0,
        },
        isAnimating: false,
        error: null,
        toggleMode: mockToggleMode,
        updateSensitivity: vi.fn(),
        startAnimation: vi.fn(),
        clearError: vi.fn(),
      });

      useToast.mockReturnValue({
        toasts: [],
        success: mockSuccess,
        error: vi.fn(),
      });

      render(<Index />);

      const modeCheckbox = screen.getByLabelText("サークル モードを切り替え");
      fireEvent.click(modeCheckbox);

      expect(mockToggleMode).toHaveBeenCalledWith("circles");
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  describe("感度調整", () => {
    it("感度スライダーが機能する", () => {
      const mockUpdateSensitivity = vi.fn();

      const { useVisualizer } = require("../presentation/hooks/useVisualizer");

      useVisualizer.mockReturnValue({
        config: {
          modes: [
            {
              id: "bars",
              nameJa: "バー",
              descriptionJa: "周波数バー表示",
              icon: "📊",
              enabled: true,
            },
          ],
          sensitivity: 1.0,
        },
        isAnimating: false,
        error: null,
        toggleMode: vi.fn(),
        updateSensitivity: mockUpdateSensitivity,
        startAnimation: vi.fn(),
        clearError: vi.fn(),
      });

      render(<Index />);

      const sensitivitySlider = screen.getByRole("slider");
      fireEvent.change(sensitivitySlider, { target: { value: "2.0" } });

      expect(mockUpdateSensitivity).toHaveBeenCalledWith(2.0);
    });
  });

  describe("エラー表示", () => {
    it("オーディオエラーを表示する", () => {
      const { useAudio } = require("../presentation/hooks/useAudio");

      useAudio.mockReturnValue({
        audioFile: null,
        isPlaying: false,
        isLoading: false,
        error: "オーディオエラー",
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        audioRepository: null,
        setAudioFile: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
        setCurrentTime: vi.fn(),
        clearError: vi.fn(),
      });

      render(<Index />);

      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
      expect(screen.getByText("オーディオエラー")).toBeInTheDocument();
    });

    it("ビジュアライザーエラーを表示する", () => {
      const { useVisualizer } = require("../presentation/hooks/useVisualizer");

      useVisualizer.mockReturnValue({
        config: {
          modes: [],
          sensitivity: 1.0,
        },
        isAnimating: false,
        error: "ビジュアライザーエラー",
        toggleMode: vi.fn(),
        updateSensitivity: vi.fn(),
        startAnimation: vi.fn(),
        clearError: vi.fn(),
      });

      render(<Index />);

      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
      expect(screen.getByText("ビジュアライザーエラー")).toBeInTheDocument();
    });
  });

  describe("現在のファイル情報", () => {
    it("音声ファイルがある場合、ファイル情報を表示する", () => {
      const { useAudio } = require("../presentation/hooks/useAudio");

      useAudio.mockReturnValue({
        audioFile: { name: "test.mp3" },
        isPlaying: false,
        isLoading: false,
        error: null,
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        audioRepository: null,
        setAudioFile: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
        setCurrentTime: vi.fn(),
        clearError: vi.fn(),
      });

      render(<Index />);

      expect(screen.getByText("再生中")).toBeInTheDocument();
      expect(screen.getByText("test.mp3")).toBeInTheDocument();
    });

    it("音声ファイルがない場合、ファイル情報を表示しない", () => {
      render(<Index />);

      expect(screen.queryByText("再生中")).not.toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なセマンティックHTMLを使用する", () => {
      render(<Index />);

      expect(screen.getByRole("banner")).toBeInTheDocument(); // header
      expect(screen.getByRole("main")).toBeInTheDocument(); // main
      expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
    });

    it("チェックボックスに適切なラベルがある", () => {
      render(<Index />);

      const checkbox = screen.getByLabelText("サークル モードを切り替え");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });
  });

  describe("レスポンシブデザイン", () => {
    it("モバイルファーストのクラスを使用する", () => {
      render(<Index />);

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("p-6", "pb-8");

      const main = screen.getByRole("main");
      expect(main).toHaveClass("px-4", "md:px-6");
    });
  });
});
