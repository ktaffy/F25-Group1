import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import type { Express } from "express";
import { env } from "./env.js";

export function setupSwagger(app: Express) {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Mise en Place API",
        version: "0.1.0",
        description: "Backend API for Mise en Place (Express + Spoonacular)"
      },
      servers: [{ url: env.apiBaseUrl }],
    },
    apis: ["./src/routes/*.ts"],
  };

  const swaggerSpec = swaggerJSDoc(swaggerOptions);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
