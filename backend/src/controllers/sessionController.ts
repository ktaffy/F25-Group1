import type { Request, Response } from "express";
import {
    createSession, getSession, updateSession, deleteSession
} from "../services/sessionStore.js";
import { snapshot, skipForegroundNow } from "../services/timelineEngine.js";
import type { ScheduleResult } from "../types/scheduleTypes.js";
import { badRequest, notFound, conflict } from "../utils/respond.js";
import { getPreviewById } from "../services/schedulePreviewService.js";

export function createSessionHandler(req: Request, res: Response) {
    const body = req.body as ScheduleResult & { previewId?: string };
    let schedule: ScheduleResult | undefined;

    if (body.previewId) {
        schedule = getPreviewById(body.previewId);
        if (!schedule) {
            return notFound(res, "Schedule preview not found");
        }
    } else if (body?.items && Array.isArray(body.items)) {
        schedule = body;
    } else {
        return badRequest(res, "Invalid schedule payload.");
    }

    const s = createSession(schedule);
    return res
        .status(201)
        .json({ id: s.id, status: s.status, totalDurationSec: s.schedule.totalDurationSec });
}

export function startSessionHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");
    if (s.status === "ended") return conflict(res, "Session already ended");
    if (s.status === "running") return res.json({ ok: true, status: s.status });

    updateSession(s.id, sess => {
        sess.startedAt = Date.now();
        sess.totalPausedMs = 0;
        sess.pausedAt = undefined;
        sess.status = "running";
    });
    return res.json({ ok: true, status: "running" });
}

export function pauseSessionHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");
    if (s.status !== "running") return conflict(res, "Session not running");

    updateSession(s.id, sess => {
        sess.pausedAt = Date.now();
        sess.status = "paused";
    });
    return res.json({ ok: true, status: "paused" });
}

export function resumeSessionHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");
    if (s.status !== "paused" || !s.pausedAt || !s.startedAt) {
        return conflict(res, "Session not paused");
    }

    updateSession(s.id, sess => {
        const pauseSpan = Date.now() - (sess.pausedAt as number);
        sess.totalPausedMs += pauseSpan;
        sess.pausedAt = undefined;
        sess.status = "running";
    });
    return res.json({ ok: true, status: "running" });
}

export function skipForegroundHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");
    if (s.status !== "running") return conflict(res, "Session not running");

    const { ok, reason } = skipForegroundNow(s);
    if (!ok) return conflict(res, reason ?? "Cannot skip now");

    return res.json({ ok: true, snapshot: snapshot(s) });
}

export function stateHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");
    return res.json(snapshot(s));
}

export function deleteSessionHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) return notFound(res, "Session not found");

    updateSession(s.id, sess => { sess.status = "ended"; });
    deleteSession(s.id);
    return res.json({ ok: true });
}

/** SSE: emits snapshot every second. */
export function streamHandler(req: Request, res: Response) {
    if (!req.params?.id) {
        return badRequest(res, "Session id required.");
    }
    const s = getSession(req.params.id);
    if (!s) {
        // SSE init hasn't happened yet, so a normal JSON error is fine.
        return notFound(res, "Session not found");
    }

    res.writeHead(200, {
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
    });

    const send = () => {
        const data = JSON.stringify(snapshot(s));
        res.write(`event: tick\n`);
        res.write(`data: ${data}\n\n`);
    };

    send();

    const interval = setInterval(() => {
        if (s.status === "ended") {
            res.write(`event: end\n`);
            res.write(`data: {"reason":"ended"}\n\n`);
            clearInterval(interval);
            res.end();
            return;
        }
        send();
    }, 1000);

    req.on("close", () => clearInterval(interval));
}
