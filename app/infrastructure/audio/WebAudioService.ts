export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bufferLength: number;
  sampleRate: number;
}

export class WebAudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;

  // 音声コンテキストの初期化
  async initializeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContext();

    // コンテキストが中断されている場合は再開
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.setupAnalyser();
  }

  // アナライザーの設定
  private setupAnalyser(): void {
    if (!this.audioContext) return;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;
  }

  // 音声要素の接続
  connectAudioElement(audioElement: HTMLAudioElement): void {
    if (!this.audioContext || !this.analyser || !this.gainNode) {
      throw new Error('音声コンテキストが初期化されていません');
    }

    this.audioElement = audioElement;

    // 既存のソースがある場合は切断
    if (this.source) {
      this.source.disconnect();
    }

    // 新しいソースを作成
    this.source = this.audioContext.createMediaElementSource(audioElement);

    // ノード接続：ソース → ゲイン → アナライザー → 出力
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  // 音声解析データの取得
  getAnalysisData(): AudioAnalysisData | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);

    return {
      frequencyData,
      timeDomainData,
      bufferLength,
      sampleRate: this.audioContext?.sampleRate || 44100
    };
  }

  // 音量の設定
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // 音量の取得
  getVolume(): number {
    return this.gainNode?.gain.value || 1.0;
  }

  // FFTサイズの設定
  setFFTSize(fftSize: number): void {
    if (this.analyser) {
      this.analyser.fftSize = fftSize;
    }
  }

  // スムージング時定数の設定
  setSmoothingTimeConstant(smoothing: number): void {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0, Math.min(1, smoothing));
    }
  }

  // 音声コンテキストの状態取得
  getContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  // 再生状態の取得
  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  // 再生
  async play(): Promise<void> {
    if (!this.audioElement) {
      throw new Error('音声要素が設定されていません');
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    await this.audioElement.play();
  }

  // 一時停止
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  // 停止
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  // 再生時間の設定
  setCurrentTime(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  // 現在の再生時間
  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  // 総再生時間
  getDuration(): number {
    return this.audioElement?.duration || 0;
  }

  // リソースの解放
  dispose(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioElement = null;
  }
}
