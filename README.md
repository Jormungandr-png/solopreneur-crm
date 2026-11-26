# CoachPulse AI — Solopreneur CRM, Churn Analytics & Retention Platform

**CoachPulse AI** is a full-stack, data-science-powered CRM built for solo online coaches (fitness coaches, gaming coaches, and creator-trainers). It combines client management, explainable machine learning churn prediction, an automated loyalty reward engine, financial/LTV tracking, and a Groq-powered AI inbox prioritizer—deployed completely at **$0/month**.

- **Live Web App:** [CoachPulse AI on Vercel](https://solopreneur-fydbsm062-jormungandr-png.vercel.app/login)
- **Backend API:** [FastAPI Service on Render](https://www.google.com/search?q=https://solopreneur-crm.onrender.com/docs)
- **Repository:** `https://github.com/Jormungandr-png/solopreneur-crm`

> **Note:** The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first request after idle time may take ~30–50 seconds while the server wakes up.

## The Problem

Solo coaches run high-touch businesses across scattered channels—Instagram DMs, Discord, WhatsApp, email, and payment links. Clients rarely announce they are quitting; instead, they quietly miss sessions, delay check-ins, pay late, or send short frustrated messages weeks before canceling. CoachPulse AI surfaces those early warning signals automatically and pairs them with immediate retention actions.

## Core Features

### 1. Business Analytics Dashboard (`/`)
- Live **KPI telemetry** for Monthly Recurring Revenue (MRR), At-Risk Revenue, Predicted Retention Rate, and Overdue Invoices.
- **Interactive 3-Month MRR Forecast** (Recharts Area Chart) comparing projected revenue with *No Action* vs. *With Retention Rewards*.
- **Coaching Niche Breakdown** (Recharts Bar Chart) tracking revenue, active client count, and high-risk exposure.

### 2. Clients, Churn Analysis & Reward System (`/clients`)
- **Explainable Churn Risk Scoring (0–100%):** Every client is scored live by the ML model into `Low`, `Medium`, or `High` risk tiers, accompanied by the exact top behavioral drivers (for example, missed sessions, check-in gaps, or overdue invoices).
- **Automated Loyalty & Retention Engine:** Tracks points and tiers (`Bronze`, `Silver`, `Gold`, `Platinum`), recommends a targeted retention reward based on each client's risk drivers, and lets coaches grant or redeem points in one click.
- **Multi-Tenant Isolation & Niche Locking:** Every coach only accesses their own clients (`coach_id`), and new clients automatically inherit the coach's registered niche.

### 3. Payments & Finances (`/payments`)
- Tracks invoices across Stripe, Razorpay, PayPal, and manual/UPI links with status filters (`paid`, `pending`, `overdue`, `refunded`).
- **Revenue Collection Split** donut chart and financial summary cards.
- **ML-Powered Client LTV & Feedback Loop:** Estimates average Client Lifetime Value using predicted churn probabilities, and automatically increments `late_payments_90d` whenever an `overdue` invoice is logged—updating the client's churn risk in real time.

### 4. AI Inbox Prioritizer (`/inbox`)
- Powered by the **Groq API (`llama-3.3-70b-versatile`)** with a deterministic keyword fallback.
- Scores pasted client messages from Instagram DM, Discord, WhatsApp, or Email by **urgency (1–100)** and **sentiment (`negative`, `neutral`, `positive`)**.
- Ranks urgent/churn-risk messages at the top, drafts a tailored retention reply with 1-click copy, and persists all scored messages per coach in Supabase.

### 5. Multi-Step Coach Authentication (`/login`)
- Built with **Supabase Auth** (2-step signup collecting email, password, full name, age, and coaching niche).
- JWT bearer authentication verified on every FastAPI endpoint.
- Clean empty states for new coach accounts.

## Tech Stack

| Layer | Technology | Hosting / Cost |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router, TypeScript), Tailwind CSS, Recharts, Lucide Icons | Vercel Hobby ($0) |
| **Backend API** | Python, FastAPI, Uvicorn, Pydantic | Render Free Web Service ($0) |
| **Machine Learning** | scikit-learn (`StandardScaler` + `LogisticRegression`), pandas, NumPy | Runs inside FastAPI ($0) |
| **Generative AI** | Groq API (`llama-3.3-70b-versatile`) | Groq Free Tier ($0) |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth JWT) | Supabase Free Tier ($0) |

## Data Science & ML Architecture

1. **Feature Engineering:** The churn classifier evaluates 9 behavioral, financial, and engagement features per client:
   - `tenure_months`, `sessions_attended_30d`, `sessions_missed_30d`, `days_since_last_checkin`, `avg_reply_hours`, `sentiment_score`, `late_payments_90d`, `monthly_fee`, and `reward_points`.
2. **Model & Explainability:** Features are standardized with `StandardScaler` and scored by a `LogisticRegression` model. Each feature's exact log-odds contribution (`z_i * weight_i`) is ranked to produce human-readable explanations rather than an opaque probability.
3. **Cold-Start & Retraining Strategy:** The model bootstraps on a domain-specific synthetic coaching dataset (`coaching_churn_dataset.csv`) so new deployments work immediately, and exposes `POST /api/ml/retrain` to retrain weights as real client retention outcomes accumulate in Supabase.

## Project Structure

```text
solopreneur-crm/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes, JWT auth dependency, CORS
│   │   ├── database.py          # Supabase PostgreSQL CRUD (scoped by coach_id)
│   │   ├── models.py            # Pydantic request & response schemas
│   │   └── ml/
│   │       ├── churn_model.py   # Training, inference, feature explanations, reward logic
│   │       ├── generate_data.py # Synthetic coaching dataset generator
│   │       └── inbox_scorer.py  # Groq Llama 3.3 urgency/sentiment & reply engine
│   └── requirements.txt
└── frontend/
    ├── next.config.ts           # API proxy rewrite (/api/* -> BACKEND_API_URL)
    └── src/
        ├── lib/
        │   ├── api.ts           # Authenticated API client helpers
        │   └── supabase.ts      # Supabase browser client
        ├── components/
        │   ├── AppShell.tsx     # Auth session guard & layout wrapper
        │   └── Sidebar.tsx      # Glassmorphism navigation & coach profile card
        └── app/
            ├── page.tsx         # Business Analytics Dashboard
            ├── clients/page.tsx # Clients, Churn Risk & Rewards
            ├── payments/page.tsx# Payments, Cashflow & LTV
            ├── inbox/page.tsx   # Groq AI Inbox Prioritizer
            └── login/page.tsx   # 2-Step Coach Sign In / Sign Up
```

## API Endpoints

All `/api/*` routes require `Authorization: Bearer <supabase_access_token>`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/analytics/overview` | MRR, retention rate, at-risk revenue, niche breakdown, 3-month forecast |
| `GET` | `/api/clients` | List coach's clients with live churn scores & reward recommendations |
| `POST` | `/api/clients` | Create a new client (automatically locked to coach's niche) |
| `POST` | `/api/clients/{id}/rewards/grant` | Award loyalty or retention bonus points |
| `POST` | `/api/clients/{id}/rewards/redeem` | Redeem client reward points |
| `GET` | `/api/payments` | List coach's invoices (optional `status` filter) |
| `POST` | `/api/payments` | Log a payment/invoice (overdue entries auto-increment `late_payments_90d`) |
| `GET` | `/api/payments/summary` | Collected, pending, overdue totals, and ML-estimated avg client LTV |
| `GET` | `/api/inbox` | Fetch saved prioritized inbox messages for the logged-in coach |
| `POST` | `/api/inbox/prioritize` | Score incoming messages via Groq, save to Supabase, return ranked queue |
| `POST` | `/api/ml/predict-churn` | On-demand single-client churn prediction |
| `POST` | `/api/ml/retrain` | Retrain churn classifier weights |

## Local Development Setup

### 1. Database Setup (Supabase)
Create a free Supabase project and run the schema in the **SQL Editor** to create `clients`, `payments`, `reward_events`, and `messages` tables with `coach_id` columns and `service_role` grants.

### 2. Run the Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY
GROQ_MODEL=llama-3.3-70b-versatile
FRONTEND_ORIGIN=http://localhost:3000
```

Start the API server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Run the Frontend (Next.js)
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
BACKEND_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Deployment ($0)

- **Backend (Render):** Root Directory `backend`, Build Command `pip install -r requirements.txt`, Start Command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, and `FRONTEND_ORIGIN`.
- **Frontend (Vercel):** Root Directory `frontend`, Build Command `npm run build`. Set `BACKEND_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Supabase Auth:** Add your production Vercel URL under **Authentication → URL Configuration → Site URL & Redirect URLs**.

## Future Enhancements
- Automated CSV import for Stripe, Razorpay, and WhatsApp chat exports.
- Scheduled model retraining on real coach retention outcomes stored in Supabase.
- Webhook integrations for live Instagram DM and Discord message ingestion.
