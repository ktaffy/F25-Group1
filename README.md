# Mise En Place
Mise en Place is a cooking copilot that turns multiple recipes into a single, minute-by-minute schedule. It helps home cooks plan, preview, and execute meals while keeping personal recipes, favorites, and live session state synced through Supabase.

## Client and Project
Our customers are regular people who have struggled before with preparing multiple recipes at once and want to improve their cooking skills. While cooking for one person presents its own set of difficulties, organizing multiple dishes or cooking for a large group of people presents even greater difficulties. The application called Mise en Place was created to make this procedure easier. By breaking down multiple recipes into simple, step-by-step directions, it assists users in planning and guiding them in real time through the cooking process, allowing them to concentrate on what really matters—cooking, which becomes as easy as following a minute-by-minute schedule. 

## Project layout
- backend - Node.js + Express + TypeScript API that follows a layered strategy: src/index.ts boots middleware and routers, controllers translate HTTP into service calls, services orchestrate the timeline engine and data access, and clients wrap Supabase, Spoonacular, and OpenAI. The schedule/timeline engine produces step-by-step plans, while the session store keeps user cooking state synced. Swagger at /docs documents the contract; Jest keeps the layers verified.
- frontend - React + Vite + TypeScript SPA that treats src/App.tsx as the session-aware shell. Supabase auth gates routes, pages fetch via src/api/sessionApi.ts, and shared types mirror the backend. UI pages are stateful flows: they request schedule previews, stream live cooking steps, and write favorites/recipes back through the API, with environment-driven endpoints for local or hosted runs.
- root - npm lockfiles and shared ignores; see subsystem READMEs for setup/runtime specifics.

## Code organization
```
.
|-- backend/
|   `-- src/
|       |-- index.ts              # Express bootstrap (CORS/JSON/routers/Swagger)
|       |-- config/
|       |   `-- swagger.ts
|       |-- controllers/          # HTTP handlers for health, recipes, schedule, sessions
|       |-- services/
|       |   |-- timelineEngine.ts
|       |   |-- schedulePreviewService.ts
|       |   |-- sessionStore.ts
|       |   `-- recipeService.ts
|       |-- clients/              # Supabase, Spoonacular, OpenAI
|       |-- utils/                # respond helpers, recipe formatting
|       `-- __tests__/            # Jest test suite
`-- frontend/
    `-- src/
        |-- App.tsx               # Supabase session + route shell
        |-- pages/                # Landing, Plan, SchedulePreview, Cooking, CreateRecipe, Favorites, MyRecipes, Profile
        |-- api/
        |   `-- sessionApi.ts     # REST helpers using VITE_API_BASE_URL
        |-- utils/
        |   `-- apiBase.ts
        `-- types/                # Shared DTOs aligned with backend
```

## Running locally
Prerequisites: Node.js 18+ and npm. Use separate terminals for backend and frontend.

Backend
1) cd backend
2) Create .env with SUPABASE_URL, SUPABASE_ANON_KEY, and optional SPOONACULAR_API_KEY; API_BASE_URL and PORT default to http://localhost:3001.
3) npm install
4) npm run dev (Swagger docs at http://localhost:3001/docs)
5) npm test for coverage, npm run build && npm start for a compiled run.

Frontend
1) cd frontend
2) Create .env with VITE_SUPABASE_URL, VITE_SUPABASE_KEY, and VITE_API_BASE_URL pointing at the backend.
3) npm install
4) npm run dev (Vite serves at http://localhost:5173; it proxies requests to VITE_API_BASE_URL).

## Deployment
- Frontend: Deployed to Vercel at https://mise-en-place-alpha.vercel.app/. Builds use the same Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VITE_API_BASE_URL).
- Backend: Deployed on Railway using the serverless option; environment matches the local .env (SUPABASE_URL, SUPABASE_ANON_KEY, SPOONACULAR_API_KEY, API_BASE_URL, PORT).
- Database/Auth: Supabase provides auth and Postgres storage for users, favorites, and recipe data.

## Testing
- Backend tests: cd backend && npm test to run Jest; append -- --coverage to check statement/branch coverage.
- API contract: With the backend running (npm run dev), open http://localhost:3001/docs to explore Swagger UI. Use it to inspect schemas and try endpoints like schedule preview, session state updates, favorites, and health checks; hosted deployments expose the same UI at /docs.
