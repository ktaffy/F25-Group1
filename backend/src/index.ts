import express from "express";
import { setupSwagger } from "./config/swagger.js";
import recipesRouter from "./routes/recipes.js"
import healthRouter from "./routes/health.js"
import { env } from "./config/env.js";

const app = express();
app.use(express.json());

app.use("/health", healthRouter);
app.use("/recipes", recipesRouter);

setupSwagger(app);

app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
    console.log(`Docs at http://localhost:${env.port}/docs`);
});

