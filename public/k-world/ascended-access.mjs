/** Read-only portal access. The replayed linked story is the sole entitlement.
 * No preview booleans, parent messages or standalone saves can award entry.
 */
import {context,loadProgress,runsFrom,loadNight,same} from '../see-world/linked.mjs';

export const PAINTING = Object.freeze({id:'cathedral', x:4.4, z:-15.95, halfWidth:1.62});
export const RETURN_POSE = Object.freeze({position:Object.freeze([4.4,1.7,-13.4]), yaw:Math.PI});
export const ENDINGS = Object.freeze(['record-end','shared-end','quiet-end']);
const deny = reason => ({allowed:false, reason, binding:null});

export function paintingAccess(storage, {preview=false}={}) {
  if (preview) return deny('Sandbox replay cannot open linked rewards. Return to your linked playthrough.');
  try {
    const current=context(storage);
    if (!current.ok) return deny('Connect this browser to your TechOps Hero story, then complete the linked K campaign.');
    const source=current.snapshot, record=loadProgress(storage,source), run=runsFrom(record,source).k;
    if (!run?.ended || !ENDINGS.includes(run.node)) return deny('Complete K’s linked See World campaign to step beyond this painting.');
    // Explicit native boundary in addition to the linked-store replay guards.
    if (!source.milestones.returned || !loadNight(storage,source,record).record.completed['memory-anchor']) return deny('Complete the native return and memory investigation first.');
    return {allowed:true,reason:'K campaign complete. Walk into the painting, or choose Enter painting.',binding:{profileId:source.profileId,runId:source.runId}};
  } catch {
    return deny('Linked progress is unreadable or incompatible. It has not been changed. Return to TechOps Hero to recover it.');
  }
}

/** A segment crossing, not proximity: looking at a work must not teleport you. */
export function crossesPainting(before, after) {
  if (![before,after].every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))) return false;
  if (!(before[2]>PAINTING.z && after[2]<=PAINTING.z)) return false;
  const t=(before[2]-PAINTING.z)/(before[2]-after[2]);
  const x=before[0]+(after[0]-before[0])*t, y=before[1]+(after[1]-before[1])*t;
  return Math.abs(x-PAINTING.x)<PAINTING.halfWidth && y>.25 && y<4.1;
}

export function sameVisit(access, binding) {
  return access.allowed && same(access.binding,binding);
}
