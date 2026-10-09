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

## Transactional booking email

The API sends the studio notification through [Resend](https://resend.com). The booking is saved first; a mail outage is logged and does not make the client retry a booking that already exists. Resend is retried up to three times with short exponential backoff.

Set these deployment environment variables:

```dotenv
RESEND_API_KEY=re_...
EMAIL_FROM=bookings@mail.example.com
NOTIFICATION_EMAIL=owner@example.com
```

Use a sender on a domain you own. Do not use `onboarding@resend.dev` in production. `EMAIL_FROM` must match the domain verified in Resend, while `Reply-To` is set to the client's validated email address.

### DNS and inbox placement

1. Add your sending domain in Resend and publish the exact DNS records shown there. Resend supplies the DKIM TXT record and usually a custom return-path record; copy the values exactly, with no extra quotes.
2. Publish SPF at the root of the sending domain. If Resend is your only sender, it will look like `v=spf1 include:resend.com -all`. Keep one SPF TXT record by merging existing providers instead of adding a second record.
3. Publish DMARC at `_dmarc.example.com`. Start with monitoring: `v=DMARC1; p=none; rua=mailto:dmarc@example.com; adkim=s; aspf=s`. Review reports, then move to `p=quarantine` and eventually `p=reject` once every legitimate sender passes alignment.
4. Verify the domain in Resend and wait for DNS propagation. Send test messages to Gmail and Outlook, then check the authentication results for `spf=pass`, `dkim=pass`, and `dmarc=pass`.
5. Keep complaint rates low: email only people who submit a booking, use a stable branded `From`, keep subjects factual, and never put client-controlled text in headers. The HTML body escapes all booking fields before rendering.

DNS values vary by provider and domain, so the Resend dashboard is authoritative for DKIM and return-path records. Never publish the API key in frontend code or commit `.env` files.

## Database configuration

TypeORM owns the PostgreSQL connection and repositories for `User` and `Booking`.

For disposable local development, add this to `backend/.env`:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/nail_inspo
TYPEORM_SYNCHRONIZE=true
```

`TYPEORM_SYNCHRONIZE=true` lets TypeORM create or update tables from the entities. Never enable it for production data.

For production, set `TYPEORM_SYNCHRONIZE=false` and apply reviewed TypeORM migrations before deploying entity changes. Keep database credentials and API keys in the deployment environment, not in source control.

