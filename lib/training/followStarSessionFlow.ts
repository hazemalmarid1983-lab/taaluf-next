/**

 * تدفق جلسة «اتبع النجمة» — يربط المحرك بالإعدادات دون UI.

 */



import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';

import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

import {

  resolveFollowStarRuntimeSettings,

  type FollowStarRuntimeSettings,

  type FollowStarTrialOutcome,

} from '@/lib/training/followStarEngine';



export type FollowStarSessionBundle = {

  session: TrainingSessionRuntime;

  settings: FollowStarRuntimeSettings;

};



const followStarActivityFlow = createTrainingActivityFlow({

  resolveSettings: resolveFollowStarRuntimeSettings,

  resolveDifficulty: (settings) => settings.difficulty,

});



export function beginFollowStarSession(
  input: BeginTrainingActivityInput
): FollowStarSessionBundle {

  return followStarActivityFlow.begin(input);

}



export function startFollowStarTrial(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return followStarActivityFlow.startTrial(session);

}



export function commitFollowStarTrial(

  session: TrainingSessionRuntime,

  outcome: FollowStarTrialOutcome

): TrainingSessionRuntime {

  return followStarActivityFlow.commitTrial(session, outcome);

}



export function finalizeFollowStarSession(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return followStarActivityFlow.finalize(session);

}



export function isFollowStarSessionComplete(

  session: TrainingSessionRuntime

): boolean {

  return followStarActivityFlow.isComplete(session);

}


