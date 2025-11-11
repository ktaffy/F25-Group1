import { snapshot, skipForegroundNow } from "../../services/timelineEngine.js";
import type { Session } from "../../types/sessionTypes.js";
import type { TimelineItem } from "../../types/scheduleTypes.js";

// ---- Helpers ----
function makeItem(
  recipeId: string,
  stepIndex: number,
  attention: "foreground" | "background",
  startSec: number,
  endSec: number
): TimelineItem {
  return {
    recipeId,
    recipeName: "Test Recipe",
    stepIndex,
    text: `${attention} step ${stepIndex}`,
    attention,
    startSec,
    endSec,
  };
}

function makeSession(): Session {
  const startedAt = Date.now() - 5000; // started 5s ago
  return {
    id: "session-1",
    status: "running",
    createdAt: startedAt - 1000,
    startedAt,
    totalPausedMs: 0,
    schedule: {
      totalDurationSec: 30,
      items: [
        makeItem("1", 0, "foreground", 0, 10),
        makeItem("1", 1, "background", 2, 20),
        makeItem("1", 2, "foreground", 10, 15),
        makeItem("1", 3, "background", 15, 30),
      ],
    },
  };
}

// ---- Tests ----
describe("timelineEngine", () => {
  it("snapshot() should compute elapsed time and current foreground/background correctly", () => {
    const s = makeSession();
    const nowMs = (s.startedAt ?? Date.now()) + 7000; // 7 seconds elapsed
    const snap = snapshot(s, nowMs);

    expect(snap).toHaveProperty("elapsedSec");
    expect(snap).toHaveProperty("current");
    expect(snap.current).toHaveProperty("foreground");
    expect(snap.current).toHaveProperty("background");

    // Foreground step should be active at t=7s
    expect(snap.current.foreground?.text).toContain("foreground step 0");
    // Background step 1 should also be active (started at 2s)
    expect(snap.current.background?.length).toBeGreaterThan(0);

    // Remaining time math sanity check
    if (snap.current.foreground) {
      const remaining = snap.current.foreground.remainingSec;
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(10);
    }

    // Next foreground should be step 2
    expect(snap.nextForeground?.text).toContain("foreground step 2");
    expect(snap.session.id).toBe("session-1");
    expect(snap.session.status).toBe("running");
  });

  it("skipForegroundNow() should truncate active foreground and shift future steps", () => {
    const s = makeSession();
    const nowMs = (s.startedAt ?? Date.now()) + 5000; // within first foreground

    const beforeEnd = s.schedule.items.find(it => it.attention === "foreground" && it.startSec === 0)!.endSec;

    const res = skipForegroundNow(s, nowMs);
    expect(res.ok).toBe(true);

    const truncated = s.schedule.items.find(it => it.attention === "foreground" && it.startSec === 0)!;
    expect(truncated.endSec).toBeLessThanOrEqual(beforeEnd);
  });

  it("skipForegroundNow() should handle no active foreground but with a next one", () => {
    const s = makeSession();
    const nowMs = (s.startedAt ?? Date.now()) + 11000; // between step 1 bg and step 2 fg start

    const res = skipForegroundNow(s, nowMs);
    expect(res.ok).toBe(true);
  });

  it("skipForegroundNow() should fail when there is no next foreground", () => {
    const s = makeSession();
    const nowMs = (s.startedAt ?? Date.now()) + 40000; // past all steps

    const res = skipForegroundNow(s, nowMs);
    expect(res.ok).toBe(false);
    expect(res.reason).toBeDefined();
  });
});
