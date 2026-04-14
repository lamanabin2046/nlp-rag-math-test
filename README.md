# Nepal Math AI — Human Evaluation Web App

MERN stack web application for collecting teacher and student evaluations
of AI-generated mathematics solutions (Experiment 4).

---

## Project Structure

```
eval-app/
├── backend/
│   ├── data/                    ← place human_eval_packet.json here
│   ├── models/Score.js          ← MongoDB schema
│   ├── routes/scores.js         ← API endpoints
│   ├── routes/questions.js      ← serves questions to frontend
│   ├── server.js
│   ├── .env                     ← add your MONGO_URI here
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx          ← role selection (Teacher / Student)
    │   │   ├── TeacherEval.jsx   ← rubric scoring 0-3
    │   │   ├── StudentEval.jsx   ← star ratings 1-5
    │   │   ├── AdminDashboard.jsx← live results view
    │   │   └── ThankYou.jsx
    │   ├── components/
    │   │   └── ProgressBar.jsx
    │   └── App.jsx
    ├── vercel.json
    └── package.json
```

---

## Local Setup

### Step 1 — MongoDB Atlas

1. Go to https://mongodb.com/atlas and create a free account
2. Create a free M0 cluster
3. Database Access → Add user (username + password)
4. Network Access → Add IP → Allow from anywhere (0.0.0.0/0)
5. Connect → Drivers → Copy connection string

### Step 2 — Backend

```bash
cd eval-app/backend
npm install

# Edit .env and paste your connection string:
# MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eval_app
```

Copy `human_eval_packet.json` into `backend/data/`:
```bash
mkdir data
cp path/to/human_eval_packet.json data/
```

Start backend:
```bash
npm run dev
# Running on http://localhost:5000
```

### Step 3 — Frontend

```bash
cd eval-app/frontend
npm install
npm run dev
# Running on http://localhost:5173
```

Open http://localhost:5173 in browser.

---

## Pages

| URL | Who uses it | What it does |
|-----|-------------|--------------|
| `/` | Everyone | Enter name, choose Teacher or Student |
| `/teacher` | Teachers | Grade each solution 0–3 |
| `/student` | Students | Rate clarity, alignment, usefulness (stars) |
| `/thankyou` | Everyone | Confirmation after submission |
| `/admin` | Researcher | Live dashboard with all scores |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Returns all questions (safe fields only) |
| POST | `/api/scores` | Save one evaluation score |
| GET | `/api/scores` | Get all scores |
| GET | `/api/scores/summary` | Per-item averages |
| GET | `/api/scores/export` | Download human_eval_scores.json |

---

## Deploy to Internet

### Backend → Render (free tier)

1. Push `eval-app/backend` to a GitHub repo
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set environment variable: `MONGO_URI` = your Atlas connection string
5. Build command: `npm install`
6. Start command: `node server.js`
7. Copy your Render URL (e.g. `https://eval-app-backend.onrender.com`)

### Frontend → Vercel (free tier)

1. Edit `frontend/vercel.json`:
   Replace `https://eval-app-backend.onrender.com` with your actual Render URL

2. Push `eval-app/frontend` to a GitHub repo
3. Go to https://vercel.com → New Project → Import repo
4. Framework: Vite
5. Deploy

Share the Vercel URL with your evaluators!

---

## After Collecting All Scores

Download scores for Experiment 4 analysis:
```
GET https://your-render-url.onrender.com/api/scores/export
```

Save as `results/human_eval_scores.json`, then run:
```bash
python experiments/experiment4_human_evaluation.py --analyze
```

---

## Evaluator Instructions

**Teachers:**
- Go to the app URL
- Enter your Teacher ID (e.g. T01, T02)
- Select "Teacher"
- For each solution, select a rubric score 0–3
- Click "Next Question" until done

**Students:**
- Go to the app URL
- Enter your Student ID (e.g. S01, S02)
- Select "Student"
- For each solution, rate Clarity, Alignment, Usefulness (1–5 stars)
- Click "Next Question" until done
