# BluePrint

BluePrint is a small-team project workspace: projects, tasks in board/list/table/
timeline views, attachments, comments, and a role-aware members area with email
invitations.

## Stack

- **Client** — Next.js 16 (App Router), React 19, Redux Toolkit + RTK Query,
  MUI X data grid, Tailwind CSS 4, Better Auth client.
- **Server** — Express 5, Prisma 7 (PostgreSQL), Better Auth, Zod, Nodemailer.
- **Tests** — Vitest + Supertest integration suites against a real PostgreSQL
  database.
- **Delivery** — GitHub Actions, Docker Compose (app, PostgreSQL, Mailpit).

## Roles

| Workspace role | Can do |
| --- | --- |
| `OWNER` | Everything, including granting/removing ownership and managing any member. |
| `ADMIN` | Manage members below owner, invite people, see every project. |
| `MEMBER` | Create projects, manage the projects they belong to, work on tasks. |
| `VIEWER` | Read-only access to projects they are added to. |

Project roles are separate: `MANAGER`, `CONTRIBUTOR`, `VIEWER`. A project always
keeps at least one manager, and the workspace always keeps at least one owner.

Invitations are delivered by email when SMTP is configured. Without SMTP the
server prints the invitation link to its log, and the settings screen always
offers a copyable link.

## Local development

Requirements: Node 24+, PostgreSQL 15+.

```bash
# 1. Create the databases
createdb blueprint
createdb blueprint_test

# 2. Configure the server
cd server
cp .env.example .env          # edit DATABASE_URL and BETTER_AUTH_SECRET
npm install
npx prisma migrate deploy
npm run seed                  # optional demo data

# 3. Configure the client
cd ../client
cp .env.example .env.local
npm install

# 4. Run both apps
cd ../server && npm run dev   # http://localhost:8000
cd ../client && npm run dev   # http://localhost:3000
```

The browser only talks to Next.js. Rewrites proxy `/api/auth/*` and `/backend/*`
to Express, which keeps the session cookie first-party.

### First owner

Registration creates a `MEMBER`. Promote the first real account through Prisma
Studio or SQL:

```sql
UPDATE "User" SET role = 'OWNER' WHERE email = 'you@example.com';
```

`npm run auth:bootstrap` and `npm run auth:fixture` are available for scripted
local setups.

## Tests

The integration suite runs against a **throwaway** database. It derives
`<database>_test` from `DATABASE_URL` (or uses `TEST_DATABASE_URL`) and refuses
to run against a database named `blueprint` or `postgres`.

```bash
cd server
npm run test:db:setup   # prisma migrate deploy against the test database
npm test                # vitest run
npm run typecheck       # app + tests
```

Coverage includes auth guards, onboarding, workspace roles and ownership rules,
member deactivation/reactivation, invitation lifecycle (create, duplicate,
preview, wrong recipient, accept, resend, revoke, expiry), project scoping,
project member management, last-manager protection, and assignee restrictions.

## Docker Compose

```bash
cp .env.example .env     # set BETTER_AUTH_SECRET
docker compose up --build
```

- App: <http://localhost:3000>
- API: <http://localhost:8000>
- Mailpit inbox: <http://localhost:8025>

Compose starts PostgreSQL, runs `prisma migrate deploy` in a one-shot `migrate`
service, then starts the API and client. Seed data is not loaded automatically:

```bash
docker compose run --rm migrate npm run seed
```

## CI

`.github/workflows/ci.yml` runs two jobs on pushes and pull requests:

1. **Server** — starts PostgreSQL, generates the Prisma client, typechecks the
   app and tests, builds, migrates the test database, and runs Vitest.
2. **Client** — installs, lints, typechecks, and produces a production build.

## Project layout

```
client/          Next.js app, components, RTK Query API, permissions helpers
server/          Express app, controllers, Prisma schema/migrations, tests
docker-compose.yml
```
