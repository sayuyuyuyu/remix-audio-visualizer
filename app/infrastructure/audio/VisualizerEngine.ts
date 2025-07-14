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
}

export class CircularVisualizer implements Visualizer {
  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    const canvas = this.getCanvasContext();
    if (!canvas) return;

    const { width, height, theme, sensitivity } = options;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.15;
    const maxBarHeight = Math.min(width, height) * 0.12;
    const bars = audioData.bufferLength * 0.8;

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

      this.drawRadialBar(canvas, centerX, centerY, baseRadius, angle, barHeight, barColor);
    }
  }

  private drawRadialBar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    height: number,
    color: string
  ): void {
    const gradient = ctx.createLinearGradient(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle),
      centerX + (radius + height) * Math.cos(angle),
      centerY + (radius + height) * Math.sin(angle)
    );
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(1, color);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    );
    ctx.lineTo(
      centerX + (radius + height) * Math.cos(angle),
      centerY + (radius + height) * Math.sin(angle)
    );
    ctx.stroke();
  }

  private getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return canvas?.getContext('2d') || null;
  }
}

export class WaveformVisualizer implements Visualizer {
  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    const canvas = this.getCanvasContext();
    if (!canvas) return;

    const { width, height, theme } = options;

    const gradient = canvas.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, theme.primary);
    gradient.addColorStop(0.5, theme.secondary);
    gradient.addColorStop(1, theme.accent);

    canvas.strokeStyle = gradient;
    canvas.lineWidth = 4;
    canvas.beginPath();

    const sliceWidth = width / audioData.bufferLength;
    let x = 0;

    for (let i = 0; i < audioData.bufferLength; i++) {
      const v = audioData.timeDomainData[i] / 128.0;
      const y = ((v - 1) * height) / 3 + height / 2;

      if (i === 0) canvas.moveTo(x, y);
      else canvas.lineTo(x, y);

      x += sliceWidth;
    }

    canvas.lineTo(width, height / 2);
    canvas.stroke();
  }

  private getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return canvas?.getContext('2d') || null;
  }
}

export class FrequencyBarsVisualizer implements Visualizer {
  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    const canvas = this.getCanvasContext();
    if (!canvas) return;

    const { width, height, theme, sensitivity } = options;
    const maxBars = Math.min(audioData.bufferLength, 150);
    const barWidth = (width / maxBars) * 0.8;
    const barSpacing = (width / maxBars) * 0.2;
    let x = 0;

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

      const gradient = canvas.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, barColor + '80');
      gradient.addColorStop(1, barColor);

      canvas.fillStyle = gradient;
      canvas.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + barSpacing;
    }
  }

  private getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return canvas?.getContext('2d') || null;
  }
}

export class SolarSystemVisualizer implements Visualizer {
  private animationTime = 0;

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    const canvas = this.getCanvasContext();
    if (!canvas) return;

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

    this.drawOrbitalPaths(canvas, centerX, centerY, orbits, audioData, sensitivity);
    this.drawPlanets(canvas, centerX, centerY, orbits, audioData, theme, sensitivity);
  }

  private drawOrbitalPaths(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    orbits: OrbitConfig[],
    audioData: AudioAnalysisData,
    sensitivity: number
  ): void {
    ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
    ctx.lineWidth = 1;

    orbits.forEach(orbit => {
      ctx.beginPath();
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
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    });
  }

  private drawPlanets(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    orbits: OrbitConfig[],
    audioData: AudioAnalysisData,
    theme: ColorTheme,
    sensitivity: number
  ): void {
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
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;

        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
        ctx.fill();

        // トレイル効果
        if (normalizedAudio > 0.2) {
          this.drawPlanetTrail(ctx, centerX, centerY, orbit, totalAngle, planetSize, r, g, b, normalizedAudio, audioData, sensitivity);
        }
      }
    });
  }

  private drawPlanetTrail(
    ctx: CanvasRenderingContext2D,
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

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailOpacity})`;
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return canvas?.getContext('2d') || null;
  }
}

export class ParticleFieldVisualizer implements Visualizer {
  private particles: Particle[] = [];
  private lastTime = 0;

  render(audioData: AudioAnalysisData, options: VisualizerOptions): void {
    const canvas = this.getCanvasContext();
    if (!canvas) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.updateParticles(audioData, options, deltaTime);
    this.drawParticles(canvas);
  }

  private updateParticles(audioData: AudioAnalysisData, options: VisualizerOptions, deltaTime: number): void {
    const { width, height, theme, sensitivity } = options;

    // 音声の強度に基づいて新しいパーティクルを生成
    const avgFrequency = audioData.frequencyData.reduce((sum, val) => sum + val, 0) / audioData.frequencyData.length;
    const intensity = (avgFrequency / 255) * sensitivity;

    if (intensity > 0.1 && this.particles.length < 200) {
      const particleCount = Math.floor(intensity * 5);
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(width, height, theme, intensity));
      }
    }

    // パーティクルの更新
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime, audioData, sensitivity);
      return particle.life > 0;
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => {
      particle.draw(ctx);
    });
  }

  private getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return canvas?.getContext('2d') || null;
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

    this.vx += (Math.random() - 0.5) * audioInfluence;
    this.vy += (Math.random() - 0.5) * audioInfluence;

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

  // 待機状態表示用の定数
  private static readonly WAITING_STATE_CIRCLE_RADIUS = 50;
  private static readonly WAITING_STATE_STROKE_WIDTH = 3;
  private static readonly WAITING_STATE_FONT_SIZE = 24;
  private static readonly WAITING_STATE_FONT_FAMILY = 'Arial';
  private static readonly WAITING_STATE_PULSE_FREQUENCY = 2;
  private static readonly WAITING_STATE_PULSE_AMPLITUDE = 0.3;
  private static readonly WAITING_STATE_PULSE_OFFSET = 0.7;
  private static readonly WAITING_STATE_TIME_SCALE = 0.001;
  private static readonly WAITING_STATE_OPACITY_SUFFIX = '80';

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
  }

  render(
    enabledModes: VisualizerMode[],
    audioData: AudioAnalysisData | null,
    options: VisualizerOptions
  ): void {
    if (!this.ctx || !this.canvas) return;

    // 背景のクリア
    this.clearCanvas();

    // 有効なビジュアライザーをレンダリング
    if (audioData) {
      enabledModes.forEach(mode => {
        const visualizer = this.visualizers.get(mode.id);
        if (visualizer) {
          visualizer.render(audioData, options);
        }
      });
    } else {
      // 音楽が再生されていない場合は待機状態の表示
      this.renderWaitingState(options);
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

  private renderWaitingState(options: VisualizerOptions): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // パルスエフェクト用の時間ベースの値
    const time = Date.now() * VisualizerEngine.WAITING_STATE_TIME_SCALE;
    const pulse = Math.sin(time * VisualizerEngine.WAITING_STATE_PULSE_FREQUENCY) * 
                  VisualizerEngine.WAITING_STATE_PULSE_AMPLITUDE + 
                  VisualizerEngine.WAITING_STATE_PULSE_OFFSET;

    // 待機状態の円を描画
    this.ctx.strokeStyle = options.theme.primary + VisualizerEngine.WAITING_STATE_OPACITY_SUFFIX;
    this.ctx.lineWidth = VisualizerEngine.WAITING_STATE_STROKE_WIDTH;
    this.ctx.globalAlpha = pulse;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, VisualizerEngine.WAITING_STATE_CIRCLE_RADIUS, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;

    // 音楽ノートアイコンを描画
    this.ctx.fillStyle = options.theme.primary;
    this.ctx.font = `${VisualizerEngine.WAITING_STATE_FONT_SIZE}px ${VisualizerEngine.WAITING_STATE_FONT_FAMILY}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('♪', centerX, centerY);
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
}
