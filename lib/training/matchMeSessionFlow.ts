/**

 * تدفق جلسة «طابق مثلي» — يربط المحرك بالإعدادات دون UI.

 */



import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';

import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

import {

  resolveMatchMeRuntimeSettings,

  type MatchMeRuntimeSettings,

  type MatchMeTrialOutcome,

} from '@/lib/training/matchMeEngine';



export type MatchMeSessionBundle = {

  session: TrainingSessionRuntime;

  settings: MatchMeRuntimeSettings;

};



const matchMeActivityFlow = createTrainingActivityFlow({

  resolveSettings: resolveMatchMeRuntimeSettings,

  resolveDifficulty: (settings) => settings.difficulty,

});



export function beginMatchMeSession(
  input: BeginTrainingActivityInput
): MatchMeSessionBundle {

  return matchMeActivityFlow.begin(input);

}



export function startMatchMeTrial(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return matchMeActivityFlow.startTrial(session);

}



export function commitMatchMeTrial(

  session: TrainingSessionRuntime,

  outcome: MatchMeTrialOutcome

): TrainingSessionRuntime {

  return matchMeActivityFlow.commitTrial(session, outcome);

}



export function finalizeMatchMeSession(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return matchMeActivityFlow.finalize(session);

}



export function isMatchMeSessionComplete(

  session: TrainingSessionRuntime

): boolean {

  return matchMeActivityFlow.isComplete(session);

}


