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

    if (foreground) {
        // We are currently inside a foreground step -> truncate it and pull future forward
        const remaining = Math.max(0, foreground.endSec - elapsedSec);
        if (remaining === 0) {
            // Edge: we're exactly at the end boundary; just look for the next foreground to pull to now
            const nextFg = nextForegroundAtOrAfter(session, elapsedSec);
            if (!nextFg) return { ok: false, reason: "No foreground step to skip." };
            const shift = elapsedSec - nextFg.startSec;
            shiftFutureItems(session, nextFg.startSec, shift);
            return { ok: true };
        }

        // 1) Truncate the active foreground so it ends now
        session.schedule.items = session.schedule.items.map(it => {
            if (
                it.recipeId === foreground.recipeId &&
                it.stepIndex === foreground.stepIndex &&
                it.startSec === foreground.startSec &&
                it.endSec === foreground.endSec &&
                it.attention === "foreground"
            ) {
                // allow zero-length end (end == elapsedSec). Do NOT force +1 here.
                return { ...it, endSec: elapsedSec };
            }
            return it;
        }).sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);

        // 2) Pull all items that have NOT started yet to fill the gap
        // cutoff is 'elapsedSec' so anything already started (startSec < elapsedSec) is untouched
        shiftFutureItems(session, elapsedSec, -remaining);

        return { ok: true };
    }

    // No active foreground: pull the next foreground to now (your original behavior)
    const next = nextForegroundAtOrAfter(session, elapsedSec);
    if (!next) return { ok: false, reason: "No foreground step to skip." };

    const shift = elapsedSec - next.startSec; // usually negative
    shiftFutureItems(session, next.startSec, shift);
    return { ok: true };
}
