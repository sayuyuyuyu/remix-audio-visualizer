export interface VisualizerMode {
  id: string;
  name: string;
  nameJa: string;
  enabled: boolean;
  icon: string;
  description: string;
  descriptionJa: string;
}

export interface ColorTheme {
  id: string;
  name: string;
  nameJa: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface VisualizerConfig {
  id: string;
  modes: VisualizerMode[];
  theme: ColorTheme;
  sensitivity: number;
  fftSize: number;
  smoothingTimeConstant: number;
  createdAt: Date;
  updatedAt: Date;
}

export class VisualizerConfigEntity implements VisualizerConfig {
  id: string;
  modes: VisualizerMode[];
  theme: ColorTheme;
  sensitivity: number;
  fftSize: number;
  smoothingTimeConstant: number;
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    this.id = crypto.randomUUID();
    this.modes = this.getDefaultModes();
    this.theme = this.getDefaultTheme();
    this.sensitivity = 1.0;
    this.fftSize = 512;
    this.smoothingTimeConstant = 0.8;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private getDefaultModes(): VisualizerMode[] {
    return [
      {
        id: 'circular',
        name: 'Circular',
        nameJa: '円形',
        enabled: true,
        icon: '🌀',
        description: 'Classic circular frequency visualizer',
        descriptionJa: 'クラシックな円形周波数ビジュアライザー'
      },
      {
        id: 'waveform',
        name: 'Waveform',
        nameJa: '波形',
        enabled: false,
        icon: '〰️',
        description: 'Real-time audio waveform display',
        descriptionJa: 'リアルタイム音声波形表示'
      },
      {
        id: 'frequency',
        name: 'Frequency Bars',
        nameJa: '周波数バー',
        enabled: false,
        icon: '📊',
        description: 'Frequency spectrum bar chart',
        descriptionJa: '周波数スペクトラム棒グラフ'
      },
      {
        id: 'solar_system',
        name: 'Solar System',
        nameJa: '太陽系',
        enabled: false,
        icon: '🪐',
        description: 'Planetary orbital visualizer',
        descriptionJa: '惑星軌道ビジュアライザー'
      },
      {
        id: 'particle_field',
        name: 'Particle Field',
        nameJa: 'パーティクルフィールド',
        enabled: false,
        icon: '✨',
        description: 'Dynamic particle system',
        descriptionJa: 'ダイナミックパーティクルシステム'
      }
    ];
  }

  private getDefaultTheme(): ColorTheme {
    return {
      id: 'default',
      name: 'Aurora',
      nameJa: 'オーロラ',
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#0f0f23',
      text: '#ffffff'
    };
  }

  // モードの切り替え
  toggleMode(modeId: string): void {
    const mode = this.modes.find(m => m.id === modeId);
    if (mode) {
      mode.enabled = !mode.enabled;
      this.updatedAt = new Date();
    }
  }

  // テーマの適用
  applyTheme(theme: ColorTheme): void {
    this.theme = theme;
    this.updatedAt = new Date();
  }

  // 有効なモードのリスト
  getEnabledModes(): VisualizerMode[] {
    return this.modes.filter(mode => mode.enabled);
  }

  // 設定の検証
  isValid(): boolean {
    return this.modes.length > 0 &&
           this.sensitivity > 0 &&
           this.fftSize > 0 &&
           this.smoothingTimeConstant >= 0 &&
           this.smoothingTimeConstant <= 1;
  }
}
