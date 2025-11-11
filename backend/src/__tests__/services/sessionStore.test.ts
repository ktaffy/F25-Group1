import {
  createSession,
  getSession,
  updateSession,
  deleteSession
} from "../../services/sessionStore.js";

describe("sessionStore", () => {
  it("should create a new session with default fields", () => {
    const schedule = {
      items: [],
      totalDurationSec: 100,
    };

    const session = createSession(schedule);

    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("status", "idle");
    expect(session).toHaveProperty("schedule");
    expect(session.schedule.totalDurationSec).toBe(100);
  });

  it("should retrieve an existing session", () => {
    const schedule = { items: [], totalDurationSec: 50 };
    const session = createSession(schedule);

    const fetched = getSession(session.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(session.id);
  });

  it("should update a session’s properties using a callback", () => {
    const schedule = { items: [], totalDurationSec: 80 };
    const session = createSession(schedule);

    updateSession(session.id, (s) => {
      s.status = "running";
      s.startedAt = 123;
    });

    const updated = getSession(session.id);
    expect(updated?.status).toBe("running");
    expect(updated?.startedAt).toBe(123);
  });

  it("should delete a session from the store", () => {
    const schedule = { items: [], totalDurationSec: 10 };
    const session = createSession(schedule);

    deleteSession(session.id);
    const gone = getSession(session.id);

    expect(gone).toBeUndefined();
  });

  it("should gracefully handle updating non-existent sessions", () => {
    expect(() =>
      updateSession("non-existent", (s) => {
        s.status = "paused";
      })
    ).not.toThrow();
  });

  it("should gracefully handle deleting non-existent sessions", () => {
    expect(() => deleteSession("fake-id")).not.toThrow();
  });
});
