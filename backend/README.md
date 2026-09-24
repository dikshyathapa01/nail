# Nail Inspo booking API

## Run locally

```bash
npm install
npm run start:dev
```

The API runs on `http://localhost:5000` (the port configured in the workspace `.env`).

- `POST /api/bookings` creates a booking request.
- `GET /api/bookings/availability?date=2026-09-07` returns the four studio time slots and their availability.

Requests are validated and stored in PostgreSQL using the `DATABASE_URL` from the workspace `.env` file. The `bookings` table is created automatically when the API starts.

## Database configuration

TypeORM owns the PostgreSQL connection and repositories for `User` and `Booking`.

For disposable local development, add this to `backend/.env`:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/nail_inspo
TYPEORM_SYNCHRONIZE=true
```

`TYPEORM_SYNCHRONIZE=true` lets TypeORM create or update tables from the entities. Never enable it for production data.

For production, set `TYPEORM_SYNCHRONIZE=false` and apply reviewed TypeORM migrations before deploying entity changes. Keep database credentials and API keys in the deployment environment, not in source control.

