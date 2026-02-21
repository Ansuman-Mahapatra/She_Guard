# Security Notes — SheGuard

## Credentials

- **Never commit `.env`** — it contains secrets (MongoDB, Gmail, Cloudinary, Firebase). It is gitignored.
- **Rotate credentials** if they were ever exposed (e.g. shared in chat, committed by mistake).
- **MongoDB URI**: Replace `<user>` and `<password>` placeholders with real values. Do not use angle brackets in the actual password.
- **Firebase**: Keep `firebase-key.json` at project root; it is gitignored. Do not commit it.

## Production

- Set `CORS_ORIGIN` in `.env` to your allowed frontend origins (comma-separated) instead of `*`.
- Use HTTPS for `API_URL` and `VITE_API_URL` in production.
- Ensure MongoDB Atlas has IP allowlist configured and strong credentials.
