import { Router } from "express";
import * as scheduleController from "../controllers/scheduleController.js";

const router = Router();

/**
 * @openapi
 * /schedule:
 *   post:
 *     summary: Generate a cooking schedule
 *     description: |
 *       Given an array of Spoonacular recipe IDs, fetch their steps,
 *       convert them into ordered steps, and produce a unified cooking timeline.
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
 *         description: A scheduled cooking timeline
 *       400:
 *         description: Bad request (recipeIds missing/invalid)
 *       500:
 *         description: Internal server error
 */
router.post("/", scheduleController.createSchedule);

export default router;
