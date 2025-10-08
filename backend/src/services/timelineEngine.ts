import type { Session, TickState } from "../types/sessionTypes.js";
import { computeElapsedSec, activeItemsAt, nextForegroundAtOrAfter, shiftFutureItems } from "./sessionStore.js";
import type { TimelineItem } from "../types/scheduleTypes.js";

/**
 * Provides a current snapshot of the session state for the frontend to consume. 
 * @param session current session object
 * @param nowMs current time
 * @returns TickState
 */
export function snapshot(session: Session, nowMs = Date.now()): TickState {
    const elapsedSec = computeElapsedSec(session, nowMs);
    let { foreground, backgrounds } = activeItemsAt(session, elapsedSec);

    const withRemaining = <T extends TimelineItem>(item: T | null) => {
        return item ? { ...item, remainingSec: Math.max(0, item.endSec - elapsedSec) } : null;
    }

    const foreground_tasks = withRemaining(foreground);
    const background_tasks = backgrounds.map(bg => ({ ...bg, remainingSec: Math.max(0, bg.endSec - elapsedSec) }));

    const next = nextForegroundAtOrAfter(session, elapsedSec);
    const nextAug = next ? { ...next, startsInSec: Math.max(0, next.startSec - elapsedSec) } : null;

    return {
        elapsedSec,
        current: { foreground: foreground_tasks, background: background_tasks },
        nextForeground: nextAug,
        session: {
            id: session.id,
            status: session.status
        }
    }
}

/**
 * Skip current foreground step.
 * Only allowed if a foreground is currently active or there is a next foreground step. 
 * @param session current session object
 * @param nowMs current time in ms
 * @returns { ok: boolean, reason?: string }
 */
export function skipForegroundNow(session: Session, nowMs = Date.now()): { ok: boolean; reason?: string } {
    const elapsedSec = computeElapsedSec(session, nowMs);
    const { foreground } = activeItemsAt(session, elapsedSec);

    let pivot: TimelineItem | null = foreground;
    if (!pivot) {
        pivot = nextForegroundAtOrAfter(session, elapsedSec);
    }
    if (!pivot) {
        return { ok: false, reason: "No foreground step to skip."};
    }

    const shift = elapsedSec - pivot.startSec;
    shiftFutureItems(session, pivot.startSec, shift);
    return { ok: true };
}