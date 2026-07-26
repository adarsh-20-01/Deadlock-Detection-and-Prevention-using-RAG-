import { useCallback } from 'react';

export const useSound = (enabled = true) => {
  const playSound = useCallback((type) => {
    if (!enabled) return;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      switch (type) {
        case 'click': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
          break;
        }

        case 'success': {
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.type = 'triangle';
          osc2.type = 'sine';

          // Play C4 and E4 chord
          osc1.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
          osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
          
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

          osc1.start();
          osc2.start();

          // After 0.15s, transition to G4
          setTimeout(() => {
            osc1.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
          }, 150);

          osc1.stop(audioCtx.currentTime + 0.4);
          osc2.stop(audioCtx.currentTime + 0.4);
          break;
        }

        case 'error': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.3);
          
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
          break;
        }

        case 'warning': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.2);
          gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.3);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.warn('AudioContext error:', err);
    }
  }, [enabled]);

  return { playSound };
};

export default useSound;
