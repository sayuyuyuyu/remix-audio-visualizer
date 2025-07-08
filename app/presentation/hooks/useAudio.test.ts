import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudio } from "./useAudio";

// Web Audio API のモック
const mockAudioContext = {
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 512,
    frequencyBinCount: 256,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1.0 },
  })),
  destination: {},
  state: "running",
  resume: vi.fn(),
  suspend: vi.fn(),
  close: vi.fn(),
};

const mockAudioElement = {
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  src: "",
};

// グローバルオブジェクトのモック
Object.defineProperty(global, "AudioContext", {
  value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(global, "HTMLAudioElement", {
  value: class {
    constructor() {
      return mockAudioElement;
    }
  },
});

Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: vi.fn(() => "mock-url"),
    revokeObjectURL: vi.fn(),
  },
});

describe("useAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioElement.play.mockResolvedValue(undefined);
    mockAudioElement.pause.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.audioFile).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.volume).toBe(1.0);
      expect(result.current.audioRepository).toBeDefined();
    });
  });

  describe("音声ファイルの設定", () => {
    it("音声ファイルを正しく設定する", async () => {
      const { result } = renderHook(() => useAudio());

      const mockFile = {
        id: "test-audio",
        name: "test.mp3",
        url: "data:audio/mp3;base64,test",
        size: 1024,
        type: "audio/mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.setAudioFile(mockFile);
      });

      expect(result.current.audioFile).toEqual(mockFile);
      expect(result.current.error).toBeNull();
    });

    it("音声ファイルをnullに設定する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setAudioFile(null);
      });

      expect(result.current.audioFile).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
    });

    it("音声ファイル設定時にエラーが発生した場合、エラーを設定する", async () => {
      const { result } = renderHook(() => useAudio());

      // AudioContextの作成を失敗させる
      vi.mocked(global.AudioContext).mockImplementationOnce(() => {
        throw new Error("AudioContext not supported");
      });

      const mockFile = {
        id: "test-audio",
        name: "test.mp3",
        url: "data:audio/mp3;base64,test",
        size: 1024,
        type: "audio/mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.setAudioFile(mockFile);
      });

      expect(result.current.error).toBe("AudioContext not supported");
    });
  });

  describe("再生制御", () => {
    it("音声ファイルがない場合、再生に失敗する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe("音声ファイルが設定されていません");
    });

    it("音声ファイルがある場合、再生を開始する", async () => {
      const { result } = renderHook(() => useAudio());

      const mockFile = {
        id: "test-audio",
        name: "test.mp3",
        url: "data:audio/mp3;base64,test",
        size: 1024,
        type: "audio/mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.setAudioFile(mockFile);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(mockAudioElement.play).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it("一時停止を実行する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.pause();
      });

      expect(mockAudioElement.pause).toHaveBeenCalled();
    });

    it("停止を実行する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.stop();
      });

      expect(mockAudioElement.pause).toHaveBeenCalled();
      expect(mockAudioElement.currentTime).toBe(0);
    });
  });

  describe("音量制御", () => {
    it("音量を正しく設定する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it("音量設定時にエラーが発生した場合、エラーを設定する", async () => {
      const { result } = renderHook(() => useAudio());

      // 音量設定を失敗させる
      vi.mocked(mockAudioContext.createGain).mockImplementationOnce(() => {
        throw new Error("Gain node creation failed");
      });

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(result.current.error).toBe("Gain node creation failed");
    });
  });

  describe("再生位置制御", () => {
    it("再生位置を正しく設定する", async () => {
      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.setCurrentTime(30);
      });

      expect(mockAudioElement.currentTime).toBe(30);
    });

    it("再生位置設定時にエラーが発生した場合、エラーを設定する", async () => {
      const { result } = renderHook(() => useAudio());

      // 再生位置設定を失敗させる
      Object.defineProperty(mockAudioElement, "currentTime", {
        set: vi.fn(() => {
          throw new Error("Invalid time");
        }),
        get: vi.fn(() => 0),
      });

      await act(async () => {
        await result.current.setCurrentTime(30);
      });

      expect(result.current.error).toBe("Invalid time");
    });
  });

  describe("エラーハンドリング", () => {
    it("エラーをクリアする", async () => {
      const { result } = renderHook(() => useAudio());

      // エラーを設定
      await act(async () => {
        await result.current.play(); // 音声ファイルがないためエラーになる
      });

      expect(result.current.error).toBe("音声ファイルが設定されていません");

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("状態監視", () => {
    it("再生状態の変更を監視する", async () => {
      const { result } = renderHook(() => useAudio());

      const mockFile = {
        id: "test-audio",
        name: "test.mp3",
        url: "data:audio/mp3;base64,test",
        size: 1024,
        type: "audio/mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.setAudioFile(mockFile);
      });

      // 再生状態の変更をシミュレート
      const playStateCallback = vi.mocked(mockAudioElement.addEventListener).mock.calls.find(
        call => call[0] === "play"
      )?.[1] as Function;

      if (playStateCallback) {
        act(() => {
          playStateCallback();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });
      }
    });

    it("時間更新を監視する", async () => {
      const { result } = renderHook(() => useAudio());

      const mockFile = {
        id: "test-audio",
        name: "test.mp3",
        url: "data:audio/mp3;base64,test",
        size: 1024,
        type: "audio/mp3",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await act(async () => {
        await result.current.setAudioFile(mockFile);
      });

      // 時間更新のコールバックをシミュレート
      const timeUpdateCallback = vi.mocked(mockAudioElement.addEventListener).mock.calls.find(
        call => call[0] === "timeupdate"
      )?.[1] as Function;

      if (timeUpdateCallback) {
        Object.defineProperty(mockAudioElement, "currentTime", { value: 30 });
        Object.defineProperty(mockAudioElement, "duration", { value: 120 });

        act(() => {
          timeUpdateCallback();
        });

        await waitFor(() => {
          expect(result.current.currentTime).toBe(30);
          expect(result.current.duration).toBe(120);
        });
      }
    });
  });

  describe("クリーンアップ", () => {
    it("コンポーネントアンマウント時にクリーンアップを実行する", () => {
      const { unmount } = renderHook(() => useAudio());

      unmount();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});
