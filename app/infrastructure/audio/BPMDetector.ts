import { BPMAnalysisData } from './WebAudioService';

interface OnsetDetectionResult {
  onsets: number[];
  confidence: number[];
  averageInterval: number;
}

interface BPMResult {
  bpm: number;
  confidence: number;
  method: 'interval' | 'autocorrelation' | 'combined';
  stability: number;
}

export class BPMDetector {
  private energyHistory: number[] = [];
  private onsetHistory: number[] = [];
  private bpmHistory: number[] = [];
  private lastOnsetTime = 0;
  private frameCount = 0;
  
  // Parameters for onset detection
  private readonly WINDOW_SIZE = 43; // ~1 second at 43fps
  private readonly ENERGY_THRESHOLD = 1.5;
  private readonly MIN_ONSET_INTERVAL = 0.1; // Minimum 100ms between onsets
  private readonly MAX_ONSET_INTERVAL = 2.0; // Maximum 2s between onsets
  
  // Parameters for BPM calculation
  private readonly BPM_HISTORY_SIZE = 8;
  private readonly BPM_MIN = 60;
  private readonly BPM_MAX = 200;
  private readonly STABILITY_THRESHOLD = 0.1;

  /**
   * Process audio data and detect BPM
   * @param frequencyData - Frequency domain data from Web Audio API
   * @param timeDomainData - Time domain data from Web Audio API
   * @param sampleRate - Audio sample rate
   * @returns BPM analysis data
   */
  detectBPM(
    frequencyData: Uint8Array,
    _timeDomainData: Uint8Array,
    _sampleRate: number
  ): BPMAnalysisData {
    this.frameCount++;
    const currentTime = this.frameCount / 60; // Assuming 60fps
    
    // Calculate spectral energy
    const spectralEnergy = this.calculateSpectralEnergy(frequencyData);
    this.energyHistory.push(spectralEnergy);
    
    // Keep history within window size
    if (this.energyHistory.length > this.WINDOW_SIZE) {
      this.energyHistory.shift();
    }
    
    // Detect onsets
    const onsetResult = this.detectOnsets(spectralEnergy, currentTime);
    
    // Calculate BPM from onsets
    const bpmResult = this.calculateBPM(onsetResult.onsets);
    
    // Update BPM history for stability calculation
    if (bpmResult.bpm > 0) {
      this.bpmHistory.push(bpmResult.bpm);
      if (this.bpmHistory.length > this.BPM_HISTORY_SIZE) {
        this.bpmHistory.shift();
      }
    }
    
    const stability = this.calculateStability();
    
    return {
      currentBPM: bpmResult.bpm,
      confidence: bpmResult.confidence,
      onsets: onsetResult.onsets,
      stability
    };
  }

  /**
   * Calculate spectral energy from frequency data
   */
  private calculateSpectralEnergy(frequencyData: Uint8Array): number {
    let energy = 0;
    
    // Focus on lower frequencies (more relevant for beat detection)
    const lowFreqBins = Math.floor(frequencyData.length * 0.3);
    
    for (let i = 0; i < lowFreqBins; i++) {
      const normalizedValue = frequencyData[i] / 255;
      energy += normalizedValue * normalizedValue;
    }
    
    return energy / lowFreqBins;
  }

  /**
   * Detect onsets using energy-based method
   */
  private detectOnsets(energy: number, currentTime: number): OnsetDetectionResult {
    const onsets: number[] = [];
    const confidence: number[] = [];
    
    if (this.energyHistory.length < 3) {
      return { onsets, confidence, averageInterval: 0 };
    }
    
    // Calculate dynamic threshold
    const recentEnergy = this.energyHistory.slice(-10);
    const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length;
    const threshold = avgEnergy * this.ENERGY_THRESHOLD;
    
    // Check for onset (energy increase above threshold)
    const prevEnergy = this.energyHistory[this.energyHistory.length - 2];
    const energyIncrease = energy - prevEnergy;
    
    if (energy > threshold && energyIncrease > 0) {
      // Ensure minimum interval between onsets
      const timeSinceLastOnset = currentTime - this.lastOnsetTime;
      
      if (timeSinceLastOnset >= this.MIN_ONSET_INTERVAL) {
        onsets.push(currentTime);
        confidence.push(Math.min(1.0, energyIncrease / avgEnergy));
        this.lastOnsetTime = currentTime;
        
        // Keep onset history for BPM calculation
        this.onsetHistory.push(currentTime);
        if (this.onsetHistory.length > 32) {
          this.onsetHistory.shift();
        }
      }
    }
    
    // Calculate average interval
    const averageInterval = this.calculateAverageInterval(this.onsetHistory);
    
    return { onsets, confidence, averageInterval };
  }

  /**
   * Calculate BPM from onset data
   */
  private calculateBPM(currentOnsets: number[]): BPMResult {
    const allOnsets = [...this.onsetHistory, ...currentOnsets];
    
    if (allOnsets.length < 4) {
      return { bpm: 0, confidence: 0, method: 'interval', stability: 0 };
    }
    
    // Method 1: Interval-based BPM
    const intervalBPM = this.calculateIntervalBPM(allOnsets);
    
    // Method 2: Autocorrelation-based BPM
    const autocorrelationBPM = this.calculateAutocorrelationBPM(allOnsets);
    
    // Combine results
    const combinedBPM = this.combineResults(intervalBPM, autocorrelationBPM);
    
    return combinedBPM;
  }

  /**
   * Calculate BPM using interval analysis
   */
  private calculateIntervalBPM(onsets: number[]): BPMResult {
    if (onsets.length < 2) {
      return { bpm: 0, confidence: 0, method: 'interval', stability: 0 };
    }
    
    const intervals: number[] = [];
    
    // Calculate intervals between consecutive onsets
    for (let i = 1; i < onsets.length; i++) {
      const interval = onsets[i] - onsets[i - 1];
      if (interval >= this.MIN_ONSET_INTERVAL && interval <= this.MAX_ONSET_INTERVAL) {
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) {
      return { bpm: 0, confidence: 0, method: 'interval', stability: 0 };
    }
    
    // Calculate median interval for robustness
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // Convert to BPM
    const bpm = 60 / medianInterval;
    
    // Calculate confidence based on interval consistency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const confidence = Math.max(0, 1 - Math.sqrt(variance) / avgInterval);
    
    return {
      bpm: this.clampBPM(bpm),
      confidence,
      method: 'interval',
      stability: confidence
    };
  }

  /**
   * Calculate BPM using autocorrelation method
   */
  private calculateAutocorrelationBPM(onsets: number[]): BPMResult {
    if (onsets.length < 8) {
      return { bpm: 0, confidence: 0, method: 'autocorrelation', stability: 0 };
    }
    
    // Create a time series from onsets
    const timeResolution = 0.05; // 50ms resolution
    const maxTime = Math.max(...onsets);
    const minTime = Math.min(...onsets);
    const timeRange = maxTime - minTime;
    
    if (timeRange < 2) {
      return { bpm: 0, confidence: 0, method: 'autocorrelation', stability: 0 };
    }
    
    const timeSeriesLength = Math.floor(timeRange / timeResolution);
    const timeSeries = new Array(timeSeriesLength).fill(0);
    
    // Fill time series with onset markers
    onsets.forEach(onset => {
      const index = Math.floor((onset - minTime) / timeResolution);
      if (index >= 0 && index < timeSeriesLength) {
        timeSeries[index] = 1;
      }
    });
    
    // Calculate autocorrelation
    const autocorrelation = this.calculateAutocorrelation(timeSeries);
    
    // Find peaks in autocorrelation
    const peaks = this.findPeaks(autocorrelation);
    
    if (peaks.length === 0) {
      return { bpm: 0, confidence: 0, method: 'autocorrelation', stability: 0 };
    }
    
    // Convert best peak to BPM
    const bestPeak = peaks[0];
    const period = bestPeak.index * timeResolution;
    const bpm = 60 / period;
    
    return {
      bpm: this.clampBPM(bpm),
      confidence: bestPeak.value,
      method: 'autocorrelation',
      stability: bestPeak.value
    };
  }

  /**
   * Calculate autocorrelation of a time series
   */
  private calculateAutocorrelation(series: number[]): number[] {
    const result: number[] = [];
    const n = series.length;
    
    for (let lag = 0; lag < n / 2; lag++) {
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < n - lag; i++) {
        sum += series[i] * series[i + lag];
        count++;
      }
      
      result[lag] = count > 0 ? sum / count : 0;
    }
    
    return result;
  }

  /**
   * Find peaks in autocorrelation function
   */
  private findPeaks(autocorrelation: number[]): Array<{ index: number; value: number }> {
    const peaks: Array<{ index: number; value: number }> = [];
    const minPeakDistance = 4; // Minimum distance between peaks
    
    for (let i = minPeakDistance; i < autocorrelation.length - minPeakDistance; i++) {
      const current = autocorrelation[i];
      let isPeak = true;
      
      // Check if it's a local maximum
      for (let j = i - minPeakDistance; j <= i + minPeakDistance; j++) {
        if (j !== i && autocorrelation[j] >= current) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak && current > 0.1) {
        peaks.push({ index: i, value: current });
      }
    }
    
    // Sort peaks by value (descending)
    peaks.sort((a, b) => b.value - a.value);
    
    return peaks;
  }

  /**
   * Combine results from different methods
   */
  private combineResults(intervalResult: BPMResult, autocorrelationResult: BPMResult): BPMResult {
    const intervalWeight = intervalResult.confidence;
    const autocorrelationWeight = autocorrelationResult.confidence;
    const totalWeight = intervalWeight + autocorrelationWeight;
    
    if (totalWeight === 0) {
      return { bpm: 0, confidence: 0, method: 'combined', stability: 0 };
    }
    
    // Weighted average of BPM values
    const combinedBPM = (
      intervalResult.bpm * intervalWeight +
      autocorrelationResult.bpm * autocorrelationWeight
    ) / totalWeight;
    
    // Average confidence
    const combinedConfidence = (intervalResult.confidence + autocorrelationResult.confidence) / 2;
    
    // Stability based on consistency between methods
    const bpmDifference = Math.abs(intervalResult.bpm - autocorrelationResult.bpm);
    const maxBPM = Math.max(intervalResult.bpm, autocorrelationResult.bpm);
    const consistency = maxBPM > 0 ? 1 - (bpmDifference / maxBPM) : 0;
    
    return {
      bpm: this.clampBPM(combinedBPM),
      confidence: combinedConfidence,
      method: 'combined',
      stability: consistency
    };
  }

  /**
   * Calculate average interval between onsets
   */
  private calculateAverageInterval(onsets: number[]): number {
    if (onsets.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  /**
   * Calculate BPM stability based on recent history
   */
  private calculateStability(): number {
    if (this.bpmHistory.length < 3) return 0;
    
    const recentBPMs = this.bpmHistory.slice(-5);
    const avgBPM = recentBPMs.reduce((a, b) => a + b, 0) / recentBPMs.length;
    
    let maxDeviation = 0;
    for (const bpm of recentBPMs) {
      const deviation = Math.abs(bpm - avgBPM) / avgBPM;
      maxDeviation = Math.max(maxDeviation, deviation);
    }
    
    return Math.max(0, 1 - maxDeviation / this.STABILITY_THRESHOLD);
  }

  /**
   * Clamp BPM to valid range
   */
  private clampBPM(bpm: number): number {
    return Math.max(this.BPM_MIN, Math.min(this.BPM_MAX, bpm));
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.energyHistory = [];
    this.onsetHistory = [];
    this.bpmHistory = [];
    this.lastOnsetTime = 0;
    this.frameCount = 0;
  }
}