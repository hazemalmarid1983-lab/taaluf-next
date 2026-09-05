import { playNaturalAnimalSound } from '../lib/animalSoundSynth';

describe('animalSoundSynth', () => {
  it('plays without throwing for each animal id', () => {
    const gain = {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    };
    const ctx = {
      currentTime: 0,
      sampleRate: 44100,
      createBuffer: (_channels: number, length: number, rate: number) => ({
        numberOfChannels: 1,
        length,
        sampleRate: rate,
        getChannelData: () => new Float32Array(length),
      }),
      createGain: () => ({ gain, connect: jest.fn(), context: { currentTime: 0 } }),
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        context: { currentTime: 0 },
      }),
      createBiquadFilter: () => ({
        type: 'bandpass',
        frequency: { value: 0 },
        Q: { value: 0 },
        connect: jest.fn(),
        context: { currentTime: 0 },
      }),
      createBufferSource: () => ({
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        context: { currentTime: 0 },
      }),
    } as unknown as AudioContext;

    const dest = { connect: jest.fn(), context: ctx } as unknown as AudioNode;

    for (const id of ['dog', 'cat', 'bird', 'cow', 'sheep', 'lion']) {
      expect(() => playNaturalAnimalSound(ctx, dest, id, 0.6)).not.toThrow();
    }
  });
});
