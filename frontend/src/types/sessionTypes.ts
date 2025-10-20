export type SessionStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface TimelineItem {
    recipeId: string;
    recipeName: string;
    stepIndex: number;
    text: string;
    attention: 'foreground' | 'background';
    startSec: number;
    endSec: number;
}

export interface SessionState {
    elapsedSec: number;
    current: {
        foreground: (TimelineItem & { remainingSec: number }) | null;
        background: Array<TimelineItem & { remainingSec: number }> | null;
    };
    nextForeground: (TimelineItem & { startsInSec: number }) | null;
    session: {
        id: string;
        status: SessionStatus;
    };
}