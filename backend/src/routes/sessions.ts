import { Router } from "express";
import {
  createSessionHandler,
  startSessionHandler,
  pauseSessionHandler,
  resumeSessionHandler,
  skipForegroundHandler,
  stateHandler,
  deleteSessionHandler,
  streamHandler
} from "../controllers/sessionController.js";

const router = Router();

router.post("/", createSessionHandler);
router.post("/:id/start", startSessionHandler);
router.post("/:id/pause", pauseSessionHandler);
router.post("/:id/resume", resumeSessionHandler);
router.post("/:id/skip", skipForegroundHandler);
router.get("/:id/state", stateHandler);
router.get("/:id/stream", streamHandler);
router.delete("/:id", deleteSessionHandler);

export default router;
