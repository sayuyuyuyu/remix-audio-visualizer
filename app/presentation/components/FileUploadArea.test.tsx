import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileUploadArea } from "./FileUploadArea";

// File API のモック
const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe("FileUploadArea", () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("オーディオファイルアップロード", () => {
    const audioProps = {
      type: 'audio' as const,
      accept: ['audio/mp3', 'audio/wav', 'audio/ogg'],
      isUploading: false,
      uploadProgress: 0,
      onFileSelect: mockOnFileSelect,
    };

    it("オーディオファイル用のUIを表示する", () => {
      render(<FileUploadArea {...audioProps} />);

      expect(screen.getByText("🎵")).toBeInTheDocument();
      expect(screen.getByText("オーディオファイル")).toBeInTheDocument();
      expect(screen.getByText("MP3, WAV, OGG, AAC などの音声ファイルをドロップまたは選択")).toBeInTheDocument();
      expect(screen.getByText("音声ファイルを選択")).toBeInTheDocument();
    });

    it("ファイル選択ボタンがクリック可能", () => {
      render(<FileUploadArea {...audioProps} />);

      const button = screen.getByText("音声ファイルを選択");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("ファイル選択時にonFileSelectが呼ばれる", async () => {
      render(<FileUploadArea {...audioProps} />);

      const file = createMockFile("test.mp3", "audio/mp3");
      const input = screen.getByDisplayValue("");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it("アップロード中はボタンが無効化される", () => {
      render(<FileUploadArea {...audioProps} isUploading={true} />);

      const button = screen.getByText("音声ファイルを選択");
      expect(button).toBeDisabled();
    });

    it("アップロード進行状況を表示する", () => {
      render(<FileUploadArea {...audioProps} isUploading={true} uploadProgress={50} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("アップロード中...")).toBeInTheDocument();
    });
  });

  describe("画像ファイルアップロード", () => {
    const imageProps = {
      type: 'image' as const,
      accept: ['image/jpeg', 'image/png', 'image/gif'],
      isUploading: false,
      uploadProgress: 0,
      onFileSelect: mockOnFileSelect,
    };

    it("画像ファイル用のUIを表示する", () => {
      render(<FileUploadArea {...imageProps} />);

      expect(screen.getByText("🖼️")).toBeInTheDocument();
      expect(screen.getByText("センター画像")).toBeInTheDocument();
      expect(screen.getByText("JPEG, PNG, GIF などの画像ファイルをドロップまたは選択")).toBeInTheDocument();
      expect(screen.getByText("画像ファイルを選択")).toBeInTheDocument();
    });

    it("画像ファイル選択時にonFileSelectが呼ばれる", async () => {
      render(<FileUploadArea {...imageProps} />);

      const file = createMockFile("test.jpg", "image/jpeg");
      const input = screen.getByDisplayValue("");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });
  });

  describe("ドラッグ&ドロップ", () => {
    const props = {
      type: 'audio' as const,
      accept: ['audio/mp3'],
      isUploading: false,
      uploadProgress: 0,
      onFileSelect: mockOnFileSelect,
    };

    it("ドラッグ開始時にスタイルが変わる", () => {
      render(<FileUploadArea {...props} />);

      const container = screen.getByText("🎵").closest('[class*="Card"]');
      expect(container).toBeInTheDocument();

      // ドラッグ開始のシミュレーション
      fireEvent.dragEnter(container!);

      // ドラッグ状態のスタイルが適用されることを確認
      expect(container).toHaveClass("border-indigo-400");
    });

    it("ドラッグ終了時にスタイルが元に戻る", () => {
      render(<FileUploadArea {...props} />);

      const container = screen.getByText("🎵").closest('[class*="Card"]');

      fireEvent.dragEnter(container!);
      fireEvent.dragLeave(container!);

      // ドラッグ状態のスタイルが解除されることを確認
      expect(container).not.toHaveClass("border-indigo-400");
    });
  });

  describe("対応形式の表示", () => {
    it("オーディオファイルの対応形式を表示する", () => {
      render(
        <FileUploadArea
          type="audio"
          accept={['audio/mp3', 'audio/wav']}
          isUploading={false}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByText("対応形式: MP3, WAV")).toBeInTheDocument();
    });

    it("画像ファイルの対応形式を表示する", () => {
      render(
        <FileUploadArea
          type="image"
          accept={['image/jpeg', 'image/png']}
          isUploading={false}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
        />
      );

      expect(screen.getByText("対応形式: JPEG, PNG")).toBeInTheDocument();
    });
  });

  describe("カスタムクラス", () => {
    it("カスタムクラスを適用する", () => {
      render(
        <FileUploadArea
          type="audio"
          accept={['audio/mp3']}
          isUploading={false}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
          className="custom-class"
        />
      );

      const container = screen.getByText("🎵").closest('[class*="Card"]');
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("アクセシビリティ", () => {
    it("ファイル入力に適切なaccept属性がある", () => {
      render(
        <FileUploadArea
          type="audio"
          accept={['audio/mp3', 'audio/wav']}
          isUploading={false}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
        />
      );

      const input = screen.getByDisplayValue("");
      expect(input).toHaveAttribute("accept", "audio/mp3,audio/wav");
    });

    it("アップロード中はファイル入力を無効化する", () => {
      render(
        <FileUploadArea
          type="audio"
          accept={['audio/mp3']}
          isUploading={true}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
        />
      );

      const input = screen.getByDisplayValue("");
      expect(input).toBeDisabled();
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なファイル形式を拒否する", async () => {
      render(
        <FileUploadArea
          type="audio"
          accept={['audio/mp3']}
          isUploading={false}
          uploadProgress={0}
          onFileSelect={mockOnFileSelect}
        />
      );

      const file = createMockFile("test.txt", "text/plain");
      const input = screen.getByDisplayValue("");

      fireEvent.change(input, { target: { files: [file] } });

      // 無効なファイル形式の場合、onFileSelectが呼ばれないことを確認
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });
  });
});
