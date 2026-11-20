# solopreneur-crm

## Run locally

Start the backend from the repository root:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open the frontend at [http://localhost:3000](http://localhost:3000). Next.js
forwards `/api/*` requests to the backend at `http://127.0.0.1:8000`; set
`BACKEND_API_URL` in `frontend/.env.local` if the backend uses another address.