import type { Request, Response, NextFunction } from "express";
import * as scheduleService from "../services/scheduleService.js";

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeIds } = req.body;
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: "recipeIds[] required" });
    }

    const result = await scheduleService.createScheduleFromIds(recipeIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
