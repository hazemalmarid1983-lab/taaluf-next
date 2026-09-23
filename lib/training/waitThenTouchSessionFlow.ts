/**



 * تدفق جلسة «انتظر ثم المس» — يربط المحرك بالإعدادات دون UI.



 */







import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';



import type { TrainingSessionRuntime } from '@/lib/training/engine/types';



import {



  resolveWaitThenTouchRuntimeSettings,



  type WaitThenTouchRuntimeSettings,



  type WaitThenTouchTrialOutcome,



} from '@/lib/training/waitThenTouchEngine';







export type WaitThenTouchSessionBundle = {



  session: TrainingSessionRuntime;



  settings: WaitThenTouchRuntimeSettings;



};







const waitThenTouchActivityFlow = createTrainingActivityFlow({



  resolveSettings: resolveWaitThenTouchRuntimeSettings,



  resolveDifficulty: (settings) => settings.difficulty,



});







export function beginWaitThenTouchSession(
  input: BeginTrainingActivityInput
): WaitThenTouchSessionBundle {

  return waitThenTouchActivityFlow.begin(input);

}







export function startWaitThenTouchTrial(



  session: TrainingSessionRuntime



): TrainingSessionRuntime {



  return waitThenTouchActivityFlow.startTrial(session);



}







export function commitWaitThenTouchTrial(



  session: TrainingSessionRuntime,



  outcome: WaitThenTouchTrialOutcome



): TrainingSessionRuntime {



  return waitThenTouchActivityFlow.commitTrial(session, outcome);



}







export function finalizeWaitThenTouchSession(



  session: TrainingSessionRuntime



): TrainingSessionRuntime {



  return waitThenTouchActivityFlow.finalize(session);



}







export function isWaitThenTouchSessionComplete(



  session: TrainingSessionRuntime



): boolean {



  return waitThenTouchActivityFlow.isComplete(session);



}




