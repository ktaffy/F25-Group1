import type { ScheduleResult, TimelineItem } from "../types/scheduleTypes.js";

export type SessionStatus = "idle" | "running" | "paused" | "ended";

export interface Session {
    id: string;
    schedule: ScheduleResult;
    // all times in ms
    createdAt: number;
    startedAt?: number;
    pausedAt?: number | undefined;
    totalPausedMs: number;
    status: SessionStatus;
}

/**
 * The state of the tick that the frontend consumes
 */
export interface TickState {
    elapsedSec: number,
    current: {
        foreground: (TimelineItem & { remainingSec: number }) | null,
        background: Array<TimelineItem & { remainingSec: number }> | null;
    }
    nextForeground: (TimelineItem & { startsInSec: number }) | null;
    session: { id: string; status: SessionStatus };
}