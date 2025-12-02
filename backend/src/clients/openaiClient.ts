import axios from "axios";
import type { ScheduleResult } from "../types/scheduleTypes.js";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Ask OpenAI to generate a *full interleaved schedule* across multiple recipes.
 * @param recipes  { recipeId: string; recipeName: string; steps: { text: string; durationSec?: number }[] }
 * @returns scheduleResult
 */
export async function generateSchedule(
  recipes: { recipeId: string; recipeName: string; steps: { text: string; durationSec?: number }[] }[]
): Promise<ScheduleResult> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY missing");

const sys = `You are a cooking scheduler assistant.
Your job is to produce a complete cooking timeline for multiple recipes.
- Each recipe has ordered steps and their order must be preserved exactly (do NOT reorder or drop any step within a recipe).
- Include every provided step; do not invent, merge, paraphrase, or remove steps.
- Interleave steps across recipes to minimize idle time while keeping each recipe's step order intact.
- If possible, overlap "background" tasks (like roasting, simmering, waiting).
- Use the provided step text verbatim in the output.
- Timing rules:
  - Prefer the provided durationSec for each step when present.
  - Detect explicit durations in each step text (e.g., \"bake for 18-22 minutes\", \"simmer 5 minutes\", \"(~4 min)\" in the text).
  - If a range is provided, use the upper bound.
  - Convert minutes to seconds. If hours appear, convert accordingly.
  - If no duration is present or provided, default to 60 seconds.
- Label each step with:
  - "foreground" if it requires active attention,
  - "background" if it can run concurrently.
- Assign start and end times (in seconds) to create a continuous global timeline using the chosen durations (provided or inferred).
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

const userText = `Here are the recipes and their ordered steps (with optional durationSec in seconds):\n\n${JSON.stringify(
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
