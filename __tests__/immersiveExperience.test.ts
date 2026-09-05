import {
  isGamePlayPath,
  isSensoryRoomSessionPath,
  shouldHideRbacWidget,
} from '../lib/immersiveExperience';

describe('immersiveExperience paths', () => {
  it('detects active sensory room sessions', () => {
    expect(isSensoryRoomSessionPath('/sensory-rooms/bubbles')).toBe(true);
    expect(isSensoryRoomSessionPath('/sensory-rooms/rain')).toBe(true);
    expect(isSensoryRoomSessionPath('/sensory-room')).toBe(true);
    expect(isSensoryRoomSessionPath('/sensory-room/child_1')).toBe(true);
    expect(isSensoryRoomSessionPath('/sensory-rooms')).toBe(false);
  });

  it('detects standalone game play routes', () => {
    expect(isGamePlayPath('/games/bubble-seeker')).toBe(true);
    expect(isGamePlayPath('/games')).toBe(false);
    expect(isGamePlayPath('/sensory-matching')).toBe(true);
  });

  it('hides RBAC widget on immersive child views', () => {
    expect(shouldHideRbacWidget('/sensory-rooms/sand')).toBe(true);
    expect(shouldHideRbacWidget('/games/memory-train')).toBe(true);
    expect(shouldHideRbacWidget('/sensory-rooms')).toBe(false);
    expect(shouldHideRbacWidget('/dashboard')).toBe(false);
  });
});
