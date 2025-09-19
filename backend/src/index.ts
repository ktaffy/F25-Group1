import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

app.get("/health", (_: any, res: any) => res.json({ status: "ok"}));



