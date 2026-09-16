/**



 * تدفق جلسة «ابحث عن الهدف» — يربط المحرك بالإعدادات دون UI.



 */







import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';



import type { TrainingSessionRuntime } from '@/lib/training/engine/types';



import {



  resolveFindTheTargetRuntimeSettings,



  type FindTheTargetRuntimeSettings,



  type FindTheTargetTrialOutcome,



} from '@/lib/training/findTheTargetEngine';







export type FindTheTargetSessionBundle = {



  session: TrainingSessionRuntime;



  settings: FindTheTargetRuntimeSettings;



};







const findTheTargetActivityFlow = createTrainingActivityFlow({



  resolveSettings: resolveFindTheTargetRuntimeSettings,



  resolveDifficulty: (settings) => settings.difficulty,



});







export function beginFindTheTargetSession(
  input: BeginTrainingActivityInput
): FindTheTargetSessionBundle {

  return findTheTargetActivityFlow.begin(input);

}







export function startFindTheTargetTrial(



  session: TrainingSessionRuntime



): TrainingSessionRuntime {



  return findTheTargetActivityFlow.startTrial(session);



}







export function commitFindTheTargetTrial(



  session: TrainingSessionRuntime,



  outcome: FindTheTargetTrialOutcome



): TrainingSessionRuntime {



  return findTheTargetActivityFlow.commitTrial(session, outcome);



}







export function finalizeFindTheTargetSession(



  session: TrainingSessionRuntime



): TrainingSessionRuntime {



  return findTheTargetActivityFlow.finalize(session);



}







export function isFindTheTargetSessionComplete(



  session: TrainingSessionRuntime



): boolean {



  return findTheTargetActivityFlow.isComplete(session);



}




