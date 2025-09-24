export type Attention = "foreground" | "background";


export interface Step {
    index: number;
    text: string;
    durationSec: number;
    attention: Attention;
}


export interface RecipePlanInput {
    recipeId: string;
    recipeName: string;
    steps: Step[];
}


export interface TimelineItem {
    recipeId: string;
    recipeName: string;
    stepIndex: number;
    text: string;
    attention: Attention;
    startSec: number;
    endSec: number;
}


export interface ScheduleResult {
    items: TimelineItem[];
    totalDurationSec: number;
}