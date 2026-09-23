/**

 * تدفق جلسة «أين اختفت؟» — يربط المحرك بالإعدادات دون UI.

 */



import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';

import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

import {

  resolveWhereDidItGoRuntimeSettings,

  type WhereDidItGoRuntimeSettings,

  type WhereDidItGoTrialOutcome,

} from '@/lib/training/whereDidItGoEngine';



export type WhereDidItGoSessionBundle = {

  session: TrainingSessionRuntime;

  settings: WhereDidItGoRuntimeSettings;

};



const whereDidItGoActivityFlow = createTrainingActivityFlow({

  resolveSettings: resolveWhereDidItGoRuntimeSettings,

  resolveDifficulty: (settings) => settings.difficulty,

});



export function beginWhereDidItGoSession(
  input: BeginTrainingActivityInput
): WhereDidItGoSessionBundle {

  return whereDidItGoActivityFlow.begin(input);

}



export function startWhereDidItGoTrial(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return whereDidItGoActivityFlow.startTrial(session);

}



export function commitWhereDidItGoTrial(

  session: TrainingSessionRuntime,

  outcome: WhereDidItGoTrialOutcome

): TrainingSessionRuntime {

  return whereDidItGoActivityFlow.commitTrial(session, outcome);

}



export function finalizeWhereDidItGoSession(

  session: TrainingSessionRuntime

): TrainingSessionRuntime {

  return whereDidItGoActivityFlow.finalize(session);

}



export function isWhereDidItGoSessionComplete(

  session: TrainingSessionRuntime

): boolean {

  return whereDidItGoActivityFlow.isComplete(session);

}


