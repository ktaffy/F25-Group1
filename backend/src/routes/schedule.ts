import { Router } from "express";
import * as scheduleController from "../controllers/scheduleController.js";

const router = Router();

/**
 * @openapi
 * /schedule:
 *   post:
 *     summary: Generate or fetch a cached cooking schedule
 *     description: |
 *       Given an array of Spoonacular recipe IDs, returns a locally cached schedule if it already
 *       exists for that exact set; otherwise generates a new unified cooking timeline, stores it,
 *       and returns it alongside a reusable previewId.
 *     tags:
 *       - Schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeIds:
 *                 type: array
 *                 description: List of Spoonacular recipe IDs
 *                 items:
 *                   type: integer
 *                 example: [715538, 641803]
 *     responses:
 *       200:
 *         description: A scheduled cooking timeline (cached or newly generated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 previewId:
 *                   type: string
 *                   description: Reusable identifier for this cached schedule
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipeId: { type: string }
 *                       recipeName: { type: string }
 *                       stepIndex: { type: integer }
 *                       text: { type: string }
 *                       attention:
 *                         type: string
 *                         enum: [foreground, background]
 *                       startSec: { type: integer }
 *                       endSec: { type: integer }
 *                 totalDurationSec:
 *                   type: integer
 *       400:
 *         description: Bad request (recipeIds missing/invalid)
 *       500:
 *         description: Internal server error
 */
router.post("/", scheduleController.createSchedule);

export default router;
