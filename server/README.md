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

