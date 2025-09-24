import { Router } from "express";
import { createScheduleFromIds } from "../services/scheduleService.js";

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
router.post("/", async (req, res) => {
    try {
        const { recipeIds } = req.body;
        if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
            return res.status(400).json({ error: "recipeIds[] required" });
        }

        const result = await createScheduleFromIds(recipeIds);
        res.json(result);
    } catch (err: any) {
        console.error("[schedule] error:", err);
        res.status(500).json({ error: err.message || "schedule error" });
    }
});

export default router;
