import { Router } from "express";
import * as sessionController from "../controllers/sessionController.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Sessions
 *     description: Live cooking session (real-time timeline) APIs
 */

/**
 * @openapi
 * /sessions:
 *   post:
 *     summary: Create a live cooking session from a schedule
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, totalDurationSec]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     [recipeId, recipeName, stepIndex, text, attention, startSec, endSec]
 *                   properties:
 *                     recipeId: { type: string }
 *                     recipeName: { type: string }
 *                     stepIndex: { type: integer }
 *                     text: { type: string }
 *                     attention:
 *                       type: string
 *                       enum: [foreground, background]
 *                     startSec: { type: integer }
 *                     endSec: { type: integer }
 *               totalDurationSec:
 *                 type: integer
 *                 description: Total duration of the schedule in seconds
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 status:
 *                   type: string
 *                   enum: [idle, running, paused, ended]
 *                 totalDurationSec: { type: integer }
 *       400:
 *         description: Invalid schedule payload
 */
router.post("/", sessionController.createSessionHandler);

/**
 * @openapi
 * /sessions/{id}/start:
 *   post:
 *     summary: Start a session clock
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session started (idempotent if already running)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 status:
 *                   type: string
 *                   enum: [idle, running, paused, ended]
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session already ended
 */
router.post("/:id/start", sessionController.startSessionHandler);

/**
 * @openapi
 * /sessions/{id}/pause:
 *   post:
 *     summary: Pause a running session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session paused
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 status:
 *                   type: string
 *                   enum: [idle, running, paused, ended]
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session not running
 */
router.post("/:id/pause", sessionController.pauseSessionHandler);

/**
 * @openapi
 * /sessions/{id}/resume:
 *   post:
 *     summary: Resume a paused session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session resumed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 status:
 *                   type: string
 *                   enum: [idle, running, paused, ended]
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session not paused
 */
router.post("/:id/resume", sessionController.resumeSessionHandler);

/**
 * @openapi
 * /sessions/{id}/skip:
 *   post:
 *     summary: Skip the current (or next) foreground step
 *     description: Retimes future foreground steps to start now; background steps already running are unaffected.
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Skip applied and current snapshot returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 snapshot:
 *                   type: object
 *                   properties:
 *                     elapsedSec: { type: integer }
 *                     current:
 *                       type: object
 *                       properties:
 *                         foreground:
 *                           anyOf:
 *                             - type: "null"
 *                             - type: object
 *                               properties:
 *                                 recipeId: { type: string }
 *                                 recipeName: { type: string }
 *                                 stepIndex: { type: integer }
 *                                 text: { type: string }
 *                                 attention:
 *                                   type: string
 *                                   enum: [foreground, background]
 *                                 startSec: { type: integer }
 *                                 endSec: { type: integer }
 *                                 remainingSec: { type: integer }
 *                         background:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               recipeId: { type: string }
 *                               recipeName: { type: string }
 *                               stepIndex: { type: integer }
 *                               text: { type: string }
 *                               attention:
 *                                 type: string
 *                                 enum: [foreground, background]
 *                               startSec: { type: integer }
 *                               endSec: { type: integer }
 *                               remainingSec: { type: integer }
 *                     nextForeground:
 *                       anyOf:
 *                         - type: "null"
 *                         - type: object
 *                           properties:
 *                             recipeId: { type: string }
 *                             recipeName: { type: string }
 *                             stepIndex: { type: integer }
 *                             text: { type: string }
 *                             attention:
 *                               type: string
 *                               enum: [foreground, background]
 *                             startSec: { type: integer }
 *                             endSec: { type: integer }
 *                             startsInSec: { type: integer }
 *                     session:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         status:
 *                           type: string
 *                           enum: [idle, running, paused, ended]
 *       404:
 *         description: Session not found
 *       409:
 *         description: Cannot skip in current state
 */
router.post("/:id/skip", sessionController.skipForegroundHandler);

/**
 * @openapi
 * /sessions/{id}/state:
 *   get:
 *     summary: Get the current session snapshot
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current snapshot (tick state)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 elapsedSec: { type: integer }
 *                 current:
 *                   type: object
 *                   properties:
 *                     foreground:
 *                       anyOf:
 *                         - type: "null"
 *                         - type: object
 *                           properties:
 *                             recipeId: { type: string }
 *                             recipeName: { type: string }
 *                             stepIndex: { type: integer }
 *                             text: { type: string }
 *                             attention:
 *                               type: string
 *                               enum: [foreground, background]
 *                             startSec: { type: integer }
 *                             endSec: { type: integer }
 *                             remainingSec: { type: integer }
 *                     background:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recipeId: { type: string }
 *                           recipeName: { type: string }
 *                           stepIndex: { type: integer }
 *                           text: { type: string }
 *                           attention:
 *                             type: string
 *                             enum: [foreground, background]
 *                           startSec: { type: integer }
 *                           endSec: { type: integer }
 *                           remainingSec: { type: integer }
 *                 nextForeground:
 *                   anyOf:
 *                     - type: "null"
 *                     - type: object
 *                       properties:
 *                         recipeId: { type: string }
 *                         recipeName: { type: string }
 *                         stepIndex: { type: integer }
 *                         text: { type: string }
 *                         attention:
 *                           type: string
 *                           enum: [foreground, background]
 *                         startSec: { type: integer }
 *                         endSec: { type: integer }
 *                         startsInSec: { type: integer }
 *                 session:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     status:
 *                       type: string
 *                       enum: [idle, running, paused, ended]
 *       404:
 *         description: Session not found
 */
router.get("/:id/state", sessionController.stateHandler);

/**
 * @openapi
 * /sessions/{id}/stream:
 *   get:
 *     summary: Subscribe to real-time session ticks (SSE)
 *     description: >
 *       Server-Sent Events stream emitting a `tick` event every second with the current snapshot.
 *       **Content-Type:** text/event-stream. Use EventSource on the client.
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: SSE stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 event: tick
 *                 data: {"elapsedSec":1,"current":{"foreground":null,"background":[]},"nextForeground":null,"session":{"id":"abc123","status":"running"}}
 *
 *                 event: tick
 *                 data: {"elapsedSec":2,"current":{"foreground":null,"background":[]},"nextForeground":null,"session":{"id":"abc123","status":"running"}}
 *       404:
 *         description: Session not found
 */
router.get("/:id/stream", sessionController.streamHandler);

/**
 * @openapi
 * /sessions/{id}:
 *   delete:
 *     summary: End and delete a session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       404:
 *         description: Session not found
 */
router.delete("/:id", sessionController.deleteSessionHandler);

export default router;
