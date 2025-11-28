import type { Request, Response, NextFunction } from "express";
import { getOrCreatePreview } from "../services/schedulePreviewService.js";
import { badRequest } from "../utils/respond.js";

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeIds } = req.body;
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return badRequest(res, "recipeIds[] required");
    }

    const numericIds = recipeIds.map(Number).filter((id: number) => Number.isFinite(id));
    if (numericIds.length === 0) {
      return badRequest(res, "At least one valid recipeId is required");
    }

    const { previewId, schedule } = await getOrCreatePreview(numericIds);
    res.json({ previewId, ...schedule });
  } catch (err) {
    next(err);
  }
}
