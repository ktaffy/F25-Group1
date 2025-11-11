import express from "express";
import type { Request, Response } from "express";
import request from "supertest";
import {
  sendError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  internal,
} from "../../utils/respond.js";

describe("respond utils", () => {
  const app = express();

  app.get("/sendError", (_req: Request, res: Response) => {
    sendError(res, 400, "Invalid input");
  });

  app.get("/badRequest", (_req: Request, res: Response) => badRequest(res, "Bad input"));
  app.get("/unauthorized", (_req: Request, res: Response) => unauthorized(res));
  app.get("/forbidden", (_req: Request, res: Response) => forbidden(res));
  app.get("/notFound", (_req: Request, res: Response) => notFound(res));
  app.get("/conflict", (_req: Request, res: Response) => conflict(res));
  app.get("/unprocessable", (_req: Request, res: Response) => unprocessable(res));
  app.get("/internal", (_req: Request, res: Response) =>
    internal(res, "Server crashed", { traceId: "abc123" })
  );

  it("sendError returns expected JSON structure", async () => {
    const res = await request(app).get("/sendError");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid input",
        status: 400,
      },
    });
  });

  it.each([
    ["/badRequest", 400, "BAD_REQUEST"],
    ["/unauthorized", 401, "UNAUTHORIZED"],
    ["/forbidden", 403, "FORBIDDEN"],
    ["/notFound", 404, "NOT_FOUND"],
    ["/conflict", 409, "CONFLICT"],
    ["/unprocessable", 422, "UNPROCESSABLE"],
    ["/internal", 500, "INTERNAL"],
  ])("endpoint %s returns correct structure", async (path, status, code) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(status);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe(code);
    expect(res.body.error.status).toBe(status);
    expect(typeof res.body.error.message).toBe("string");
  });

  it("internal can include details", async () => {
    const res = await request(app).get("/internal");
    expect(res.body.error.details).toEqual({ traceId: "abc123" });
  });
});
