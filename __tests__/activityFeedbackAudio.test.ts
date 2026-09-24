import { ActivityFeedbackAudio } from '../lib/training/activityFeedbackAudio';
import { shouldAutoFinishTrial } from '../lib/training/activityResponsePolicy';

describe('activity response policy', () => {
  it('does not finish a trial on a timer', () => {
    expect(shouldAutoFinishTrial()).toBe(false);
  });
});

describe('activity feedback audio', () => {
  it('schedules a soft tap, a success phrase, and a gentle retry tone', () => {
    const started: string[] = [];
    class FakeOsc {
      type: OscillatorType = 'sine';
      frequency = {
        setValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      };
      connect() {}
      start() {
        started.push(this.type);
      }
      stop() {}
    }
    class FakeGain {
      gain = {
        setValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
      };
      connect() {}
    }
    class FakeContext {
      currentTime = 0;
      state: AudioContextState = 'running';
      destination = {};
      createOscillator() {
        return new FakeOsc();
      }
      createGain() {
        return new FakeGain();
      }
      resume() {
        return Promise.resolve();
      }
    }

    const previous = globalThis.AudioContext;
    (globalThis as { AudioContext?: typeof AudioContext }).AudioContext =
      FakeContext as unknown as typeof AudioContext;
    (globalThis as { window?: Window }).window = globalThis as unknown as Window;

    const audio = new ActivityFeedbackAudio();
    audio.playTap();
    const afterTap = started.length;
    audio.playSuccess();
    const afterSuccess = started.length;
    audio.playIncorrect();

    expect(afterTap).toBe(1);
    expect(afterSuccess).toBeGreaterThan(afterTap);
    expect(started.length).toBeGreaterThan(afterSuccess);

    (globalThis as { AudioContext?: typeof AudioContext }).AudioContext = previous;
  });
});
