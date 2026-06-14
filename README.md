# Nestly

Invite-only household organiser built with React + Vite and an Express + Postgres backend.

## Features

- Shopping list with quantities and clear-completed
- Recipe library with ingredients, method, and serving scaler
- Meal plan (breakfast / lunch / dinner, weekly view)
- Weekly and ad-hoc to-dos with optional member assignment
- Household management — members and invite-by-email
- Colour themes (ocean, forest, sunset, rose, slate, candy) + light/dark mode
- Transactional invite emails via Brevo SMTP
- Docker-based deployment via Coolify

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Express + pg (node-postgres) + JWT |
| Database | PostgreSQL |
| Email | Brevo (SMTP) via nodemailer |
| Deployment | Docker + Coolify |

## Local development

### Prerequisites

- Node 22+
- PostgreSQL running locally (or a connection string to a remote instance)

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in values
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:3002`.

### Environment variables (server/.env)

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/nestly
JWT_SECRET=change-me-to-a-long-random-string
PORT=3002

# Brevo email (optional — invite link still shown in UI without it)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-smtp-user
BREVO_SMTP_PASS=your-brevo-smtp-password
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=Nestly
APP_URL=https://your-nestly-domain.com
```

## Database setup

Run the schema once against your Postgres instance:

```bash
psql -U postgres -d nestly -f server/src/schema.sql
```

Schema migrations (e.g. new columns) run automatically on server startup — no manual steps needed after the initial schema.

### Create your first admin account

After the schema is applied, insert a user and promote them to admin:

```sql
INSERT INTO users (email, password_hash)
VALUES ('you@example.com', crypt('yourpassword', gen_salt('bf', 12)));

INSERT INTO user_roles (user_id, system_role)
VALUES (
  (SELECT id FROM users WHERE email = 'you@example.com'),
  'admin'
);
```

## Invite flow

1. Admin signs in and creates a household.
2. Admin creates an invite for an email address — an invite email is sent automatically.
3. The invited user opens the link (`?invite=<token>`), sets a password, and joins.
4. All data access is protected by membership checks on the server.

## Docker / Coolify deployment

The `Dockerfile` builds in two stages:

1. **frontend-builder** — runs `vite build`, outputs to `/app/dist`
2. **production** — installs server dependencies, copies built frontend, starts Express with `tsx`

The Express server serves the built frontend as static files in production and handles all `/api` routes.

### Required environment variables in Coolify

Set all variables from the `server/.env` section above, plus:

```env
NODE_ENV=production
PORT=3002
```

### Test email delivery

After deployment, test Brevo is configured correctly:

```sh
wget -qO- --post-data='{"to":"you@example.com"}' \
  --header='Content-Type: application/json' \
  http://localhost:3002/api/test-email
```
