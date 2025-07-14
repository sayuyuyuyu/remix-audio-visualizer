import { describe, it, expect, beforeEach } from 'vitest';
import { BPMDetector } from './BPMDetector';

describe('BPMDetector', () => {
  let detector: BPMDetector;

  beforeEach(() => {
    detector = new BPMDetector();
  });

  describe('detectBPM', () => {
    it('should return zero BPM for empty audio data', () => {
      const frequencyData = new Uint8Array(256).fill(0);
      const timeDomainData = new Uint8Array(256).fill(128);
      
      const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
      
      expect(result.currentBPM).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.onsets).toEqual([]);
      expect(result.stability).toBe(0);
    });

    it('should detect BPM with consistent beat patterns', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Simulate consistent beat pattern at 120 BPM (0.5 second intervals)
      for (let frame = 0; frame < 240; frame++) { // 4 seconds of data at 60fps
        // Create beat every 30 frames (0.5 seconds at 60fps)
        if (frame % 30 === 0) {
          // High energy on beat
          frequencyData.fill(200);
        } else {
          // Low energy between beats
          frequencyData.fill(50);
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // After enough beats, should detect around 120 BPM
        if (frame > 120) {
          expect(result.currentBPM).toBeGreaterThan(100);
          expect(result.currentBPM).toBeLessThan(140);
        }
      }
    });

    it('should handle irregular beat patterns', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Simulate irregular beat pattern
      const beatFrames = [0, 25, 55, 85, 110, 140, 165, 195];
      
      for (let frame = 0; frame < 200; frame++) {
        if (beatFrames.includes(frame)) {
          frequencyData.fill(200);
        } else {
          frequencyData.fill(30);
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // Should still provide reasonable confidence for irregular patterns
        if (frame > 100) {
          expect(result.confidence).toBeGreaterThan(0);
          expect(result.currentBPM).toBeGreaterThan(0);
        }
      }
    });

    it('should clamp BPM to valid range', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Test with very fast beats (should be clamped to max)
      for (let frame = 0; frame < 100; frame++) {
        if (frame % 5 === 0) { // Very fast beats
          frequencyData.fill(255);
        } else {
          frequencyData.fill(0);
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        expect(result.currentBPM).toBeLessThanOrEqual(200);
        expect(result.currentBPM).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reset detector state', () => {
      const frequencyData = new Uint8Array(256).fill(100);
      const timeDomainData = new Uint8Array(256).fill(128);
      
      // Generate some data
      for (let i = 0; i < 10; i++) {
        detector.detectBPM(frequencyData, timeDomainData, 44100);
      }
      
      // Reset and check if state is cleared
      detector.reset();
      
      const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
      expect(result.currentBPM).toBe(0);
      expect(result.onsets).toEqual([]);
    });
  });

  describe('stability calculation', () => {
    it('should provide high stability for consistent BPM', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Generate consistent 120 BPM pattern
      for (let frame = 0; frame < 300; frame++) {
        if (frame % 30 === 0) {
          frequencyData.fill(200);
        } else {
          frequencyData.fill(40);
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // After enough data, stability should be high
        if (frame > 240) {
          expect(result.stability).toBeGreaterThan(0.7);
        }
      }
    });

    it('should provide low stability for inconsistent BPM', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Generate inconsistent pattern
      const intervals = [25, 35, 20, 40, 30, 45, 25, 35];
      let currentFrame = 0;
      
      for (let i = 0; i < intervals.length; i++) {
        currentFrame += intervals[i];
        
        for (let frame = currentFrame - 5; frame < currentFrame + 5; frame++) {
          if (frame >= 0) {
            frequencyData.fill(frame === currentFrame ? 200 : 40);
            const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
            
            // After enough inconsistent data, stability should be lower
            if (frame > 150) {
              expect(result.stability).toBeLessThan(0.6);
            }
          }
        }
      }
    });
  });

  describe('confidence calculation', () => {
    it('should provide high confidence for clear beats', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Generate clear beat pattern with high contrast
      for (let frame = 0; frame < 200; frame++) {
        if (frame % 30 === 0) {
          frequencyData.fill(255); // Very high energy
        } else {
          frequencyData.fill(10);  // Very low energy
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // After enough clear beats, confidence should be high
        if (frame > 120) {
          expect(result.confidence).toBeGreaterThan(0.6);
        }
      }
    });

    it('should provide low confidence for unclear beats', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Generate unclear beat pattern with low contrast
      for (let frame = 0; frame < 200; frame++) {
        if (frame % 30 === 0) {
          frequencyData.fill(80); // Medium energy
        } else {
          frequencyData.fill(70); // Similar energy
        }
        
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // With unclear beats, confidence should be low
        if (frame > 120) {
          expect(result.confidence).toBeLessThan(0.4);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very short audio data', () => {
      const frequencyData = new Uint8Array(256).fill(100);
      const timeDomainData = new Uint8Array(256).fill(128);
      
      const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
      
      expect(result.currentBPM).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle silent audio', () => {
      const frequencyData = new Uint8Array(256).fill(0);
      const timeDomainData = new Uint8Array(256).fill(128);
      
      for (let frame = 0; frame < 100; frame++) {
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        expect(result.currentBPM).toBe(0);
        expect(result.confidence).toBe(0);
        expect(result.onsets).toEqual([]);
      }
    });

    it('should handle constant high energy audio', () => {
      const frequencyData = new Uint8Array(256).fill(255);
      const timeDomainData = new Uint8Array(256).fill(128);
      
      for (let frame = 0; frame < 100; frame++) {
        const result = detector.detectBPM(frequencyData, timeDomainData, 44100);
        
        // Should not detect beats in constant energy
        expect(result.currentBPM).toBe(0);
        expect(result.confidence).toBe(0);
      }
    });

    it('should handle different sample rates', () => {
      const frequencyData = new Uint8Array(256);
      const timeDomainData = new Uint8Array(256);
      
      // Test with different sample rates
      const sampleRates = [22050, 44100, 48000, 96000];
      
      sampleRates.forEach(sampleRate => {
        detector.reset();
        
        for (let frame = 0; frame < 100; frame++) {
          if (frame % 30 === 0) {
            frequencyData.fill(200);
          } else {
            frequencyData.fill(40);
          }
          
          const result = detector.detectBPM(frequencyData, timeDomainData, sampleRate);
          
          // Should handle different sample rates gracefully
          expect(result.currentBPM).toBeGreaterThanOrEqual(0);
          expect(result.currentBPM).toBeLessThanOrEqual(200);
        }
      });
    });
  });
});