import type { ColorTheme, VisualizerMode } from '../../domain/entities/VisualizerConfig';
import type { AudioAnalysisData } from './WebAudioService';

export interface VisualizerOptions {
  width: number;
  height: number;
  centerImage?: HTMLImageElement;
  theme: ColorTheme;
  sensitivity: number;
}

interface OrbitConfig {
  radius: number;
  speed: number;
  planetCount: number;
  size: number;
}

export interface Visualizer {
  render(audioData: AudioAnalysisData, options: VisualizerOptions): void;
  setCanvasContext?(ctx: CanvasRenderingContext2D | null): void;
}

export class CircularVisualizer implements Visualizer {
  private ctx: CanvasRenderingContext2D | null = null;

  setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx;
  }

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    if (!this.ctx) return;

    const { width, height, theme, sensitivity } = options;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.15;
    const maxBarHeight = Math.min(width, height) * 0.12;
    const bars = Math.min(audioData.bufferLength * 0.8, 128);

    // オーディオデータがない場合のデフォルト表示
    if (audioData.frequencyData.every(val => val === 0)) {
      // 静的な円形パターンを描画
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const progress = i / bars;
        const barHeight = Math.sin(progress * Math.PI * 4) * maxBarHeight * 0.3;

        let barColor = theme.primary;
        if (progress < 0.33) barColor = theme.primary;
        else if (progress < 0.66) barColor = theme.secondary;
        else barColor = theme.accent;

        this.drawRadialBar(centerX, centerY, baseRadius, angle, barHeight, barColor);
      }
      return;
    }

    for (let i = 0; i < bars; i++) {
      const rawValue = audioData.frequencyData[i];
      const threshold = 15;
      const scaledValue = rawValue > threshold ? (rawValue - threshold) * sensitivity : 0;
      const barHeight = Math.min(scaledValue, maxBarHeight);

      if (barHeight < 1) continue;

      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const progress = i / bars;

      let barColor = theme.primary;
      if (progress < 0.33) barColor = theme.primary;
      else if (progress < 0.66) barColor = theme.secondary;
      else barColor = theme.accent;

      this.drawRadialBar(centerX, centerY, baseRadius, angle, barHeight, barColor);
    }
  }

  private drawRadialBar(
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    height: number,
    color: string
  ): void {
    if (!this.ctx) return;

    const gradient = this.ctx.createLinearGradient(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle),
      centerX + (radius + height) * Math.cos(angle),
      centerY + (radius + height) * Math.sin(angle)
    );
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(1, color);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    );
    this.ctx.lineTo(
      centerX + (radius + height) * Math.cos(angle),
      centerY + (radius + height) * Math.sin(angle)
    );
    this.ctx.stroke();
  }
}

export class WaveformVisualizer implements Visualizer {
  private ctx: CanvasRenderingContext2D | null = null;

  setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx;
  }

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    if (!this.ctx) return;

    const { width, height, theme } = options;

    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, theme.primary);
    gradient.addColorStop(0.5, theme.secondary);
    gradient.addColorStop(1, theme.accent);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();

    const sliceWidth = width / audioData.bufferLength;
    let x = 0;

    // オーディオデータがない場合のデフォルト表示
    if (audioData.timeDomainData.every(val => val === 128)) {
      for (let i = 0; i < audioData.bufferLength; i++) {
        const progress = i / audioData.bufferLength;
        const v = Math.sin(progress * Math.PI * 8) * 0.3 + 1;
        const y = ((v - 1) * height) / 3 + height / 2;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);

        x += sliceWidth;
      }
    } else {
      for (let i = 0; i < audioData.bufferLength; i++) {
        const v = audioData.timeDomainData[i] / 128.0;
        const y = ((v - 1) * height) / 3 + height / 2;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);

        x += sliceWidth;
      }
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }
}

export class FrequencyBarsVisualizer implements Visualizer {
  private ctx: CanvasRenderingContext2D | null = null;

  setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx;
  }

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    if (!this.ctx) return;

    const { width, height, theme, sensitivity } = options;
    const maxBars = Math.min(audioData.bufferLength, 150);
    const barWidth = (width / maxBars) * 0.8;
    const barSpacing = (width / maxBars) * 0.2;
    let x = 0;

    // オーディオデータがない場合のデフォルト表示
    if (audioData.frequencyData.every(val => val === 0)) {
      for (let i = 0; i < maxBars; i++) {
        const progress = i / maxBars;
        const barHeight = Math.sin(progress * Math.PI * 3) * height * 0.2;

        let barColor = theme.primary;
        if (progress < 0.33) barColor = theme.primary;
        else if (progress < 0.66) barColor = theme.secondary;
        else barColor = theme.accent;

        const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, barColor + '80');
        gradient.addColorStop(1, barColor);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + barSpacing;
      }
      return;
    }

    for (let i = 0; i < maxBars; i++) {
      const dataIndex = Math.floor((i / maxBars) * audioData.bufferLength);
      const rawValue = audioData.frequencyData[dataIndex];
      const threshold = 20;
      const scaledValue = rawValue > threshold ? (rawValue - threshold) * sensitivity * 1.2 : 0;
      const barHeight = Math.min(scaledValue, height * 0.7);

      const progress = i / maxBars;
      let barColor = theme.primary;
      if (progress < 0.33) barColor = theme.primary;
      else if (progress < 0.66) barColor = theme.secondary;
      else barColor = theme.accent;

      const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, barColor + '80');
      gradient.addColorStop(1, barColor);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + barSpacing;
    }
  }
}

export class SolarSystemVisualizer implements Visualizer {
  private animationTime = 0;
  private ctx: CanvasRenderingContext2D | null = null;

  setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx;
  }

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    if (!this.ctx) return;

    this.animationTime += 0.01;

    const { width, height, theme, sensitivity } = options;
    const centerX = width / 2;
    const centerY = height / 2;

    const orbits = [
      { radius: 120, speed: 0.3, planetCount: 6, size: 4 },
      { radius: 180, speed: -0.2, planetCount: 8, size: 3.5 },
      { radius: 240, speed: 0.15, planetCount: 10, size: 3 },
      { radius: 300, speed: -0.1, planetCount: 12, size: 2.5 }
    ];

    // オーディオデータがない場合でも惑星は動き続ける
    this.drawOrbitalPaths(centerX, centerY, orbits, audioData, sensitivity);
    this.drawPlanets(centerX, centerY, orbits, audioData, theme, sensitivity);
  }

  private drawOrbitalPaths(
    centerX: number,
    centerY: number,
    orbits: OrbitConfig[],
    audioData: AudioAnalysisData,
    sensitivity: number
  ): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
    this.ctx.lineWidth = 1;

    orbits.forEach(orbit => {
      this.ctx!.beginPath();
      let isFirstPoint = true;
      const segmentCount = 64;

      for (let i = 0; i <= segmentCount; i++) {
        const angle = (i / segmentCount) * Math.PI * 2;
        const dataIndex = Math.floor((i / segmentCount) * audioData.bufferLength);
        const audioValue = audioData.frequencyData[dataIndex] || 0;

        const threshold = 20;
        const scaledAudio = audioValue > threshold ? (audioValue - threshold) * 0.3 * sensitivity : 0;

        let dynamicRadius = orbit.radius;
        if (scaledAudio > 5) {
          const distortion = (scaledAudio - 5) * 0.8;
          dynamicRadius = orbit.radius + distortion;
        }

        const x = centerX + dynamicRadius * Math.cos(angle);
        const y = centerY + dynamicRadius * Math.sin(angle);

        if (isFirstPoint) {
          this.ctx!.moveTo(x, y);
          isFirstPoint = false;
        } else {
          this.ctx!.lineTo(x, y);
        }
      }
      this.ctx!.closePath();
      this.ctx!.stroke();
    });
  }

  private drawPlanets(
    centerX: number,
    centerY: number,
    orbits: OrbitConfig[],
    audioData: AudioAnalysisData,
    theme: ColorTheme,
    sensitivity: number
  ): void {
    if (!this.ctx) return;
    const themeColors = [theme.primary, theme.secondary, theme.accent];

    orbits.forEach((orbit, orbitIndex) => {
      for (let i = 0; i < orbit.planetCount; i++) {
        const baseAngle = (i / orbit.planetCount) * Math.PI * 2;
        const rotationAngle = this.animationTime * orbit.speed;
        const totalAngle = baseAngle + rotationAngle;

        const segmentPosition = (totalAngle % (Math.PI * 2)) / (Math.PI * 2);
        const dataIndex = Math.floor(segmentPosition * audioData.bufferLength);
        const audioValue = audioData.frequencyData[dataIndex] || 0;

        const threshold = 20;
        const scaledAudio = audioValue > threshold ? (audioValue - threshold) * 0.3 * sensitivity : 0;

        let dynamicRadius = orbit.radius;
        if (scaledAudio > 5) {
          const distortion = (scaledAudio - 5) * 0.8;
          dynamicRadius = orbit.radius + distortion;
        }

        const planetX = centerX + dynamicRadius * Math.cos(totalAngle);
        const planetY = centerY + dynamicRadius * Math.sin(totalAngle);

        const planetDataIndex = Math.floor((i / orbit.planetCount) * audioData.bufferLength);
        const planetAudioValue = audioData.frequencyData[planetDataIndex] || 0;
        const normalizedAudio = Math.max(0, (planetAudioValue - 20) / 235);

        const planetSize = orbit.size * (1 + normalizedAudio * 0.4 * sensitivity);
        const baseColor = themeColors[orbitIndex % themeColors.length];

        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        const opacity = 0.5 + normalizedAudio * 0.4;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;

        this.ctx.beginPath();
        this.ctx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
        this.ctx.fill();

        // トレイル効果
        if (normalizedAudio > 0.2) {
          this.drawPlanetTrail(centerX, centerY, orbit, totalAngle, planetSize, r, g, b, normalizedAudio, audioData, sensitivity);
        }
      }
    });
  }

  private drawPlanetTrail(
    centerX: number,
    centerY: number,
    orbit: OrbitConfig,
    totalAngle: number,
    planetSize: number,
    r: number,
    g: number,
    b: number,
    normalizedAudio: number,
    audioData: AudioAnalysisData,
    sensitivity: number
  ): void {
    if (!this.ctx) return;
    const trailLength = 6;

    for (let t = 1; t <= trailLength; t++) {
      const trailAngle = totalAngle - (t * 0.03);
      const trailSegmentPosition = (trailAngle % (Math.PI * 2)) / (Math.PI * 2);
      const trailDataIndex = Math.floor(trailSegmentPosition * audioData.bufferLength);
      const trailAudioValue = audioData.frequencyData[trailDataIndex] || 0;

      const threshold = 20;
      const trailScaledAudio = trailAudioValue > threshold ? (trailAudioValue - threshold) * 0.3 * sensitivity : 0;

      let trailRadius = orbit.radius;
      if (trailScaledAudio > 5) {
        const trailDistortion = (trailScaledAudio - 5) * 0.8;
        trailRadius = orbit.radius + trailDistortion;
      }

      const trailX = centerX + trailRadius * Math.cos(trailAngle);
      const trailY = centerY + trailRadius * Math.sin(trailAngle);
      const trailOpacity = (1 - t / trailLength) * normalizedAudio * 0.3;
      const trailSize = planetSize * (1 - t / trailLength) * 0.4;

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailOpacity})`;
      this.ctx.beginPath();
      this.ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

export class ParticleFieldVisualizer implements Visualizer {
  private particles: Particle[] = [];
  private lastTime = 0;
  private ctx: CanvasRenderingContext2D | null = null;

  setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.ctx = ctx;
  }

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    if (!this.ctx) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.updateParticles(audioData, options, deltaTime);
    this.drawParticles();
  }

  private updateParticles(audioData: AudioAnalysisData, options: VisualizerOptions, deltaTime: number): void {
    const { width, height, theme, sensitivity } = options;

    // 音声の強度に基づいて新しいパーティクルを生成
    const avgFrequency = audioData.frequencyData.reduce((sum, val) => sum + val, 0) / audioData.frequencyData.length;
    const intensity = (avgFrequency / 255) * sensitivity;

    // オーディオデータがない場合のデフォルト強度
    const defaultIntensity = 0.3;
    const finalIntensity = intensity > 0.1 ? intensity : defaultIntensity;

    if (this.particles.length < 200) {
      const particleCount = Math.floor(finalIntensity * 3);
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(width, height, theme, finalIntensity));
      }
    }

    // パーティクルの更新
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime, audioData, sensitivity);
      return particle.life > 0;
    });
  }

  private drawParticles(): void {
    if (!this.ctx) return;

    this.particles.forEach(particle => {
      particle.draw(this.ctx!);
    });
  }

}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;

  constructor(width: number, height: number, theme: ColorTheme, intensity: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 2 * intensity;
    this.vy = (Math.random() - 0.5) * 2 * intensity;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.size = Math.random() * 3 + 1;

    const colors = [theme.primary, theme.secondary, theme.accent];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime: number, audioData: AudioAnalysisData, sensitivity: number): void {
    this.x += this.vx * deltaTime * 0.01;
    this.y += this.vy * deltaTime * 0.01;
    this.life -= deltaTime * 0.001;

    // 音声データに基づく揺らぎ
    const audioIndex = Math.floor((this.x / 1024) * audioData.bufferLength);
    const audioValue = audioData.frequencyData[audioIndex] || 0;
    const audioInfluence = (audioValue / 255) * sensitivity * 0.5;

    // オーディオデータがない場合のデフォルト揺らぎ
    const defaultInfluence = 0.1;
    const finalInfluence = audioInfluence > 0 ? audioInfluence : defaultInfluence;

    this.vx += (Math.random() - 0.5) * finalInfluence;
    this.vy += (Math.random() - 0.5) * finalInfluence;

    // 速度の減衰
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    const r = parseInt(this.color.slice(1, 3), 16);
    const g = parseInt(this.color.slice(3, 5), 16);
    const b = parseInt(this.color.slice(5, 7), 16);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class VisualizerEngine {
  private visualizers: Map<string, Visualizer> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initializeVisualizers();
  }

  private initializeVisualizers(): void {
    this.visualizers.set('circular', new CircularVisualizer());
    this.visualizers.set('waveform', new WaveformVisualizer());
    this.visualizers.set('frequency', new FrequencyBarsVisualizer());
    this.visualizers.set('solar_system', new SolarSystemVisualizer());
    this.visualizers.set('particle_field', new ParticleFieldVisualizer());
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 各ビジュアライザーにキャンバスコンテキストを設定
    this.visualizers.forEach(visualizer => {
      if ('setCanvasContext' in visualizer) {
        (visualizer as any).setCanvasContext(this.ctx);
      }
    });
  }

  render(
    enabledModes: VisualizerMode[],
    audioData: AudioAnalysisData | null,
    options: VisualizerOptions
  ): void {
    if (!this.ctx || !this.canvas) {
      console.warn("[VisualizerEngine] キャンバスコンテキストが利用できません");
      return;
    }

    // 背景のクリア
    this.clearCanvas();

    // 有効なビジュアライザーをレンダリング
    if (enabledModes.length > 0) {
      enabledModes.forEach(mode => {
        const visualizer = this.visualizers.get(mode.id);
        if (visualizer) {
          visualizer.render(audioData || this.getEmptyAudioData(), options);
        }
      });
    }

    // センター画像の描画
    if (options.centerImage) {
      this.renderCenterImage(options.centerImage, options);
    }
  }

  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;

    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
    gradient.addColorStop(0.5, "rgba(30, 41, 59, 0.9)");
    gradient.addColorStop(1, "rgba(51, 65, 85, 0.95)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderCenterImage(image: HTMLImageElement, options: VisualizerOptions): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const imageRadius = 100;

    // グロー効果
    this.ctx.shadowColor = options.theme.primary;
    this.ctx.shadowBlur = 20;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, imageRadius, 0, Math.PI * 2, false);
    this.ctx.clip();
    this.ctx.drawImage(
      image,
      centerX - imageRadius,
      centerY - imageRadius,
      imageRadius * 2,
      imageRadius * 2
    );
    this.ctx.restore();

    this.ctx.shadowBlur = 0;
  }

  private getEmptyAudioData(): AudioAnalysisData {
    const bufferLength = 256;
    return {
      frequencyData: new Uint8Array(bufferLength),
      timeDomainData: new Uint8Array(bufferLength),
      bufferLength,
      sampleRate: 44100
    };
  }
}
