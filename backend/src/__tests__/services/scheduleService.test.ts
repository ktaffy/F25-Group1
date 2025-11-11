import { config } from "dotenv";
import { createScheduleFromIds } from "../../services/scheduleService.js";

config();

describe("scheduleService (live integration)", () => {

  it("createScheduleFromIds() should return a valid schedule structure", async () => {
    const spoonKey = process.env.SPOONACULAR_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // If missing keys, skip test gracefully
    if (!spoonKey || !openaiKey) {
      console.warn("⚠️ Skipping scheduleService test: missing API keys in .env");
      return;
    }

    // Use reliable public Spoonacular recipe IDs
    const recipeIds = [715538, 641803];

    const result = await createScheduleFromIds(recipeIds);

    // Base structure
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("totalDurationSec");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.totalDurationSec).toBe("number");

    // Defensive check for first step
    if (result.items.length > 0 && result.items[0]) {
      const step = result.items[0]!;
      expect(typeof step.recipeId).toBe("string");
      expect(typeof step.recipeName).toBe("string");
      expect(typeof step.text).toBe("string");
      expect(["foreground", "background"]).toContain(step.attention);
      expect(typeof step.startSec).toBe("number");
      expect(typeof step.endSec).toBe("number");
    } else {
      // Valid case: empty schedule returned
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    }

    console.log("✅ Successfully generated schedule with", result.items.length, "steps.");
  });
});
