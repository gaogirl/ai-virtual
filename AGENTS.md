# Repository Guidelines

## Project Structure & Module Organization

This repository is split into two JavaScript applications. `frontend/` is a Vite + React single-page application: route views live in `src/pages/`, reusable UI in `src/components/`, API clients in `src/services/`, and authentication state in `src/context/`. Student and teacher views are grouped under `src/pages/student/` and `src/pages/teacher/`.

`backend/` is an Express API backed by MongoDB. Define data shapes in `models/`, request handlers in `controllers/`, routes in `routes/api/`, and shared request checks in `middleware/`. `server.js` registers middleware, routes, static uploads, and the database connection.

## Build, Test, and Development Commands

Install dependencies separately for each application:

```powershell
cd frontend; npm install; npm run dev     # Start Vite on its local development port
cd frontend; npm run lint                # Run ESLint over JS and JSX
cd frontend; npm run build               # Produce the production bundle in dist/
cd backend; npm install; npm start       # Start the Express API (default port 5000)
```

Run the API and frontend together during manual testing. Set `VITE_API_URL` when the API is not at `http://localhost:5000`.

## Coding Style & Naming Conventions

Use the surrounding style: ES modules and two-space indentation in frontend `.js`/`.jsx` files; CommonJS `require` in the backend. Name React components and files in PascalCase (`TeacherClasses.jsx`), component functions in PascalCase, and service modules in lower camel case (`assignments.js`). Keep route paths and API resource names lowercase. ESLint is configured in `frontend/eslint.config.js`; resolve its errors before opening a pull request.

## Testing Guidelines

No automated test runner is configured yet: `backend`'s `npm test` intentionally fails, and the frontend has no test script. For every change, run `npm run lint` and `npm run build` in `frontend/`, then manually exercise the changed workflow with both services running. When adding tests, place them near the covered module and use descriptive names such as `TeacherClasses.test.jsx`.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no repository-specific commit convention can be verified. Use short, imperative Conventional Commit-style subjects, for example `feat: add class invitation validation` or `fix: preserve login redirect`. Keep each commit focused. Pull requests should describe behavior changes, list verification commands, link relevant issues, and include screenshots for UI changes.

## Security & Configuration

Keep secrets in untracked environment files. Backend configuration includes `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `ZHIPU_API_KEY`; frontend values must use the `VITE_` prefix. Never commit credentials or expose server-only AI keys in browser code.
