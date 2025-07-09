import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  VisualizerConfigEntity,
  type ColorTheme,
} from "../../../app/domain/entities/VisualizerConfig";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-config-uuid"),
  },
});

describe("VisualizerConfigEntity", () => {
  let entity: VisualizerConfigEntity;

  beforeEach(() => {
    vi.clearAllMocks();
    entity = new VisualizerConfigEntity();
  });

  describe("constructor", () => {
    it("should create VisualizerConfigEntity with correct default values", () => {
      expect(entity.id).toBe("test-config-uuid");
      expect(entity.modes).toHaveLength(5);
      expect(entity.theme).toBeDefined();
      expect(entity.sensitivity).toBe(1.0);
      expect(entity.fftSize).toBe(512);
      expect(entity.smoothingTimeConstant).toBe(0.8);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it("should have default modes with correct structure", () => {
      const expectedModes = [
        { id: "circular", enabled: true },
        { id: "waveform", enabled: false },
        { id: "frequency", enabled: false },
        { id: "solar_system", enabled: false },
        { id: "particle_field", enabled: false },
      ];

      expectedModes.forEach((expected, index) => {
        expect(entity.modes[index].id).toBe(expected.id);
        expect(entity.modes[index].enabled).toBe(expected.enabled);
        expect(entity.modes[index].name).toBeDefined();
        expect(entity.modes[index].nameJa).toBeDefined();
        expect(entity.modes[index].icon).toBeDefined();
        expect(entity.modes[index].description).toBeDefined();
        expect(entity.modes[index].descriptionJa).toBeDefined();
      });
    });

    it("should have default theme with correct structure", () => {
      expect(entity.theme.id).toBe("default");
      expect(entity.theme.name).toBe("Aurora");
      expect(entity.theme.nameJa).toBe("オーロラ");
      expect(entity.theme.primary).toBe("#6366f1");
      expect(entity.theme.secondary).toBe("#8b5cf6");
      expect(entity.theme.accent).toBe("#ec4899");
      expect(entity.theme.background).toBe("#0f0f23");
      expect(entity.theme.text).toBe("#ffffff");
    });

    it("should call crypto.randomUUID to generate id", () => {
      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe("toggleMode", () => {
    it("should toggle mode when valid modeId is provided", async () => {
      const originalEnabled = entity.modes[0].enabled;
      const originalUpdatedAt = entity.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      entity.toggleMode("circular");

      expect(entity.modes[0].enabled).toBe(!originalEnabled);
      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it("should not change anything when invalid modeId is provided", () => {
      const originalModes = [...entity.modes];
      const originalUpdatedAt = entity.updatedAt;

      entity.toggleMode("invalid_mode");

      expect(entity.modes).toEqual(originalModes);
      expect(entity.updatedAt).toEqual(originalUpdatedAt);
    });

    it("should toggle multiple modes independently", () => {
      entity.toggleMode("circular");
      entity.toggleMode("waveform");

      expect(entity.modes.find((m) => m.id === "circular")?.enabled).toBe(
        false
      );
      expect(entity.modes.find((m) => m.id === "waveform")?.enabled).toBe(true);
    });
  });

  describe("applyTheme", () => {
    it("should apply new theme correctly", async () => {
      const newTheme: ColorTheme = {
        id: "custom",
        name: "Custom Theme",
        nameJa: "カスタムテーマ",
        primary: "#ff0000",
        secondary: "#00ff00",
        accent: "#0000ff",
        background: "#ffffff",
        text: "#000000",
      };
      const originalUpdatedAt = entity.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      entity.applyTheme(newTheme);

      expect(entity.theme).toEqual(newTheme);
      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it("should update updatedAt when theme is applied", async () => {
      const originalUpdatedAt = entity.updatedAt;
      const newTheme: ColorTheme = {
        id: "test",
        name: "Test",
        nameJa: "テスト",
        primary: "#000000",
        secondary: "#111111",
        accent: "#222222",
        background: "#333333",
        text: "#444444",
      };

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      entity.applyTheme(newTheme);

      expect(entity.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("getEnabledModes", () => {
    it("should return only enabled modes", () => {
      const enabledModes = entity.getEnabledModes();

      expect(enabledModes).toHaveLength(1);
      expect(enabledModes[0].id).toBe("circular");
      expect(enabledModes[0].enabled).toBe(true);
    });

    it("should return empty array when no modes are enabled", () => {
      // Disable all modes
      entity.modes.forEach((mode) => {
        mode.enabled = false;
      });

      const enabledModes = entity.getEnabledModes();

      expect(enabledModes).toHaveLength(0);
    });

    it("should return multiple modes when multiple are enabled", () => {
      entity.toggleMode("waveform");
      entity.toggleMode("frequency");

      const enabledModes = entity.getEnabledModes();

      expect(enabledModes).toHaveLength(3);
      expect(enabledModes.map((m) => m.id)).toContain("circular");
      expect(enabledModes.map((m) => m.id)).toContain("waveform");
      expect(enabledModes.map((m) => m.id)).toContain("frequency");
    });
  });

  describe("isValid", () => {
    it("should return true for valid configuration", () => {
      expect(entity.isValid()).toBe(true);
    });

    it("should return false when no modes exist", () => {
      entity.modes = [];

      expect(entity.isValid()).toBe(false);
    });

    it("should return false when sensitivity is zero or negative", () => {
      entity.sensitivity = 0;
      expect(entity.isValid()).toBe(false);

      entity.sensitivity = -1;
      expect(entity.isValid()).toBe(false);
    });

    it("should return false when fftSize is zero or negative", () => {
      entity.fftSize = 0;
      expect(entity.isValid()).toBe(false);

      entity.fftSize = -1;
      expect(entity.isValid()).toBe(false);
    });

    it("should return false when smoothingTimeConstant is out of range", () => {
      entity.smoothingTimeConstant = -0.1;
      expect(entity.isValid()).toBe(false);

      entity.smoothingTimeConstant = 1.1;
      expect(entity.isValid()).toBe(false);
    });

    it("should return true when smoothingTimeConstant is at boundaries", () => {
      entity.smoothingTimeConstant = 0;
      expect(entity.isValid()).toBe(true);

      entity.smoothingTimeConstant = 1;
      expect(entity.isValid()).toBe(true);
    });

    it("should return true with valid positive values", () => {
      entity.sensitivity = 2.5;
      entity.fftSize = 1024;
      entity.smoothingTimeConstant = 0.5;

      expect(entity.isValid()).toBe(true);
    });
  });
});
