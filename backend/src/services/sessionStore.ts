import type { ScheduleResult, TimelineItem } from "../types/scheduleTypes.js";
import type { Session } from "../types/sessionTypes.js"

const sessions = new Map<string, Session>();

/**
 * Create a new session with a unique id and store in local memory
 * @param schedule - schedule to associate with the session
 * @returns session object
 */
export function createSession(schedule: ScheduleResult): Session {
    const id = crypto.randomUUID();
    const newSession: Session = {
        id,
        schedule,
        createdAt: Date.now(),
        totalPausedMs: 0,
        status: "idle",
    };
    sessions.set(id, newSession);
    return newSession;
}

/**
 * Get a session by id
 * @param id - session id
 * @returns session object or undefined if not found
 */
export function getSession(id: string): Session | undefined {
    return sessions.get(id);
}

/**
 * Update a session by id using a mutating function
 * @param id - session id
 * @param mut - mutating function that takes a session and modifies it
 * @returns updated session object or undefined if not found
 */
export function updateSession(id: string, mut: (s: Session) => void): Session | undefined {
    const session = sessions.get(id);
    if (!session) return undefined;
    mut(session);
    return session;
}

/**
 * Ensure that items are ordered and normalized.
 * @param schedule - schedule to sanitize
 * @returns schedule items and total duration
 */
function sanitizeSchedule(schedule: ScheduleResult): ScheduleResult {
    const items = [...schedule.items].sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
    return {
        items,
        totalDurationSec: Math.max(0, schedule.totalDurationSec ?? (items.at(-1)?.endSec ?? 0)),
    }
}

/**
 * Shift every item according to an update in the future. 
 * @param session current session object
 * @param cutoffStartSec the start second after which to shift items
 * @param shift the amount to shift in seconds (can be negative)
 * @returns void
 */
export function shiftFutureItems(session: Session, cutoffStartSec: number, shift: number): void {
    if (shift === 0) return;
    session.schedule.items = session.schedule.items.map(item => {
        if (item.startSec >= cutoffStartSec) {
            const startSec = Math.max(0, item.startSec + shift);
            const endSec = Math.max(startSec + 1, item.endSec + shift);
            return { ...item, startSec, endSec };
        }
        return item;
    }).sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec);
    const newTotal = Math.max(session.schedule.totalDurationSec + shift, session.schedule.items.at(-1)?.endSec ?? 0);
    session.schedule.totalDurationSec = newTotal;
}

/**
 * Compute the elapsed seconds for a session so far. 
 * @param session session object
 * @param nowMs current time
 * @returns 0 if idle or not started, otherwise elapsed seconds
 */
export function computeElapsedSec(session: Session, nowMs = Date.now()): number {
    if (session.status === "idle") return 0;
    if (!session.startedAt) return 0;
    const pausedComponent = session.status === "paused" && session.pausedAt ? (session.pausedAt - session.startedAt - session.totalPausedMs) : 0;
    const raw = session.status === "paused"
        ? pausedComponent
        : (nowMs - session.startedAt - session.totalPausedMs);
    return Math.max(0, Math.floor(raw / 1000));
}

/**
 * Get the current active items at this second. 
 * @param session current session object
 * @param elapsedSec seconds elapsed so far
 * @returns foreground and background items
 */
export function activeItemsAt(session: Session, elapsedSec: number): {
    foreground: TimelineItem | null;
    backgrounds: TimelineItem[];
} {
    const actives = session.schedule.items.filter(item => item.startSec <= elapsedSec && elapsedSec < item.endSec);
    const foreground = actives.find(item => item.attention === "foreground") ?? null;
    const backgrounds = actives.filter(item => item.attention === "background");
    return { foreground, backgrounds };
}

/**
 * Get the next foreground item at or after a given elapsed second. 
 * @param session current session object
 * @param elapsedSec second to check
 * @returns foreground timeline item
 */
export function nextForegroundAtOrAfter(session: Session, elapsedSec: number): TimelineItem | null {
    const next = session.schedule.items.find(item => item.attention === "foreground" && item.startSec >= elapsedSec);
    return next ?? null;
}


