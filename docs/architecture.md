# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`. It owns navigation, forms, rendering, and accessible loading, success, empty, and error states. It calls relative `/api` paths through the shared client and does not implement business rules or access MongoDB.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`. Routes translate HTTP input and output; services validate references and apply business rules, calculations, and recommendation selection. Invalid input receives a deliberate 4xx response.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`. Schemas define required fields and relationships; seed operations use stable upserts and do not clear unrelated records.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implement and verify each tier before moving to the next: data models and seed first, API services and routes second, and the presentation components last. This follows the dependency direction and keeps each change testable against its contract.

- Presentation tier decision: Keep the existing React routes and components as the presentation boundary; use the shared API client for all requests and render accessible loading, success, empty, and error states.
- Logic tier decision: Keep HTTP handling in Express routes and put validation and business behavior in explicit TypeScript service functions; return deliberate 4xx responses for invalid or unknown inputs.
- Data tier decision: Use Mongoose schemas for User, Team, Activity, and Workout validation and references; seed representative demo records with idempotent upserts without deleting user data.
- Activity tracking approach: Validate that `userId` and `teamId` are well-formed IDs referencing existing records before creating an activity; store the user, team, type, and minutes with computed points and an occurrence date.
- Team management approach: Require a team name, preserve its name and mascot, and maintain the supplied member references when creating and listing teams.
- Leaderboard approach: Aggregate activity points per team in the service, sort from highest to lowest, and return `teamName`, `totalPoints`, and a 1-based rank.
- Workout suggestions approach: Find the user by email, use the fitness goal and recent activity to select matching workouts, explain the first recommendation with a reason, and return a deliberate 4xx when no user matches.

## Test plan

Run the data, API, and frontend contracts in implementation order. Use the build commands as tier-specific type-check and production-build gates after their behavior tests pass. A failure in these application checks points to the corresponding model/seed, route/service, component, or compile/build contract.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` (schema constraints and idempotent seed behavior).
- API command: `npm run test:api --prefix octofit-tracker/backend` (HTTP status and payload contracts, references, aggregation, and recommendation logic).
- Frontend command: `npm test --prefix octofit-tracker/frontend` (API-backed views and accessible loading, empty, and error states).
- Backend build command: `npm run build --prefix octofit-tracker/backend` (TypeScript compile/type-check failures in the backend).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` (TypeScript or Vite production-build failures in the frontend).
- Exercise-validator command: `node --test tests/exercise-validation.test.mjs` (exercise metadata and grading-validator tests; failures here are separate from application contract failures).

### Baseline observed before implementation

- Application contracts: `test:data` had 4 failures out of 5; the four Mongoose models did not reject missing required fields, while the idempotent seed test passed. `test:api` had 4 failures out of 4: invalid activity and team requests returned 501 instead of 400, the leaderboard was empty, and workout suggestions lacked a reason. The frontend suite had 15 failures out of 15 because the views still displayed the starter "Implementation pending" state instead of loading data and rendering contract states.
- Exercise validator: `node --test tests/exercise-validation.test.mjs` had 4 failures out of 40, including the repository README badge failing its expected template-owner/name contract; related fixture cases also failed. These are exercise-metadata/validator failures, not application behavior failures. The remaining 36 tests passed.
- Build commands: not run in this baseline check.
