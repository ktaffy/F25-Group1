import axios from "axios";
import type { ScheduleResult } from "../types/scheduleTypes.js";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Ask OpenAI to generate a *full interleaved schedule* across multiple recipes.
 * @param recipes  { recipeId: string; recipeName: string; rawSteps: string[] }
 * @returns scheduleResult
 */
export async function generateSchedule(
    recipes: { recipeId: string; recipeName: string; rawSteps: string[] }[]
): Promise<ScheduleResult> {
    if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY missing");

    const sys = `You are a cooking scheduler assistant.
Your job is to produce a complete cooking timeline for multiple recipes.
- Each recipe has raw steps (unordered).
- You must order the steps within each recipe logically AND interleave them across recipes to minimize idle time.
- If possible, overlap "background" tasks (like roasting, simmering, waiting).
- Label each step with:
  - "foreground" if it requires active attention,
  - "background" if it can run concurrently.
- Assign start and end times (in seconds) to create a continuous global timeline.
- Output a JSON object with the shape:
  {
    "items": [
      {
        "recipeId": "123",
        "recipeName": "Pasta",
        "stepIndex": 0,
        "text": "...",
        "attention": "foreground",
        "startSec": 0,
        "endSec": 120
      },
      ...
    ],
    "totalDurationSec": 2400
  }`;

    const userText = `Here are the recipes and their raw steps:\n\n${JSON.stringify(
        recipes,
        null,
        2
    )}\n\nReturn only valid JSON in the format described above.`;

    const { data } = await axios.post(
        OPENAI_API,
        {
            model: OPENAI_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: sys },
                { role: "user", content: userText },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_KEY}`,
            },
        }
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("[openai] empty response");

    return JSON.parse(content) as ScheduleResult;
}
