# SheGuard — Intelligent Emergency Response System

**Real-time safety for women and vulnerable users.** One tap connects victims with guardians and police—live location, risk scoring, and instant alerts.

---

## What is SheGuard?

SheGuard is a full-stack emergency response platform that connects **victims in distress** with **guardians** and a **Police Control Room (PCR)** in real time. When someone triggers an SOS, guardians and police see live location, risk level, and one-tap navigation—all within seconds.

---

## ✨ Features

### Victim App
- **One-tap SOS** — Instant alert with context (physical attack, forced vehicle, medical, harassment)
- **Live location streaming** — Real-time GPS updates to guardians and PCR
- **Shake to SOS** — Silent emergency trigger when voice isn’t an option
- **Risk score display** — See your current risk level at a glance
- **I’m Safe** — Resolve incidents in one tap

### Guardian App
- **Live emergency feed** — All active alerts with risk-level cards
- **Respond Now** — Opens Google Maps to victim’s last location
- **Push & email alerts** — Never miss a distress signal
- **Alerts history** — Track resolved incidents

### PCR Dashboard (Web)
- **Real-time session cards** — Sorted by severity
- **Tamper detection** — Alerts when device goes offline
- **Live map with direction** — Your location + route to victim
- **PDF incident reports** — Download-ready for records

### Backend
- **REST API + Socket.IO** — Real-time updates across all clients
- **MongoDB** — Persistent sessions and user data
- **Risk engine** — Dynamic scoring from context, movement, and audio
- **Tamper detection** — Flags suspicious offline periods
- **Email & push** — Multi-channel alert delivery

---

## Tech Stack

| Platform      | Technology                 |
|--------------|----------------------------|
| Victim app   | React Native, Expo         |
| Guardian app | React Native, Expo         |
| PCR dashboard| React, Vite, Tailwind      |
| Backend      | Node.js, Express, MongoDB  |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo Go app (for mobile testing)

### 1. Clone & Install
```bash
git clone <repo-url>
cd SheGuard
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your MONGODB_URI and API_URL
npm run sync-env
```

### 3. Run Everything
```bash
# Terminal 1: Backend
cd server && npm install && npm start

# Terminal 2: PCR Dashboard
cd web-pcr && npm install && npm run dev

# Terminal 3: Victim app
cd mobile-victim && npm install && npx expo start --go

# Terminal 4: Guardian app
cd mobile-guardian && npm install && npx expo start --go
```

### 4. Test the Flow
1. **Victim** — Enter name → Continue → Tap SOS → Choose context
2. **Guardian** — Enter name → Continue → See alert → Tap Respond Now
3. **PCR** — Open http://localhost:5173 → View live map and sessions

---

## Project Structure

```
SheGuard/
├── server/              # Node.js + Express + Socket.IO API
├── mobile-victim/       # Victim app (React Native / Expo)
├── mobile-guardian/     # Guardian app (React Native / Expo)
├── web-pcr/             # PCR dashboard (React + Vite)
├── scripts/             # Env sync, utilities
└── docs/                # Setup guides, publication
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/prototype` | Quick auth (name + role) for prototype |
| POST   | `/sos/start`         | Start SOS session |
| POST   | `/sos/update/:id`    | Stream location + update risk |
| POST   | `/sos/resolve/:id`   | Mark session resolved |
| GET    | `/sos/active`        | List active sessions (by risk) |
| GET    | `/sos/report/:id`    | Download PDF report |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `API_URL` | Backend URL (e.g. `http://localhost:5000`) |
| `VITE_API_URL` | Same as API_URL for PCR web |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | For push notifications |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | For email alerts |

See `.env.example` for the full list.

---

## Build for Production

```bash
# Victim app
cd mobile-victim
eas build --platform android --profile production

# Guardian app
cd mobile-guardian
eas build --platform android --profile production
```

Download the APK from the EAS build page. See `docs/PUBLICATION.md` for details.

---

## License

Private project. Use and modify as needed.
