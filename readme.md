# ☕ BrewLab

> **Open-Source Coffee Experiment Assistant**  
> Turn messy, informal coffee brewing notes into structured, comparable, and scientifically audited experiments using Local Open-Weight AI.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Ollama](https://img.shields.io/badge/Local%20AI-Ollama%20%2F%20Gemma-FF6F00.svg?style=flat)](https://ollama.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 Philosophy & Vision

**BrewLab is not an omniscient AI that claims to know everything about coffee.**

Instead, BrewLab is a **precision experimental instrument** that empowers home brewers, baristas, and coffee roasters to:

- Convert casual, conversational thoughts into structured experimental data.
- Compare two brew recipes side-by-side with exact mathematical parameter deltas.
- Receive scientific extraction diagnosis (*Extraction Yield, TDS, Contact Time, Channeling*) powered by local open-weight LLMs (such as Gemma or LLaMA) with zero API billing and complete privacy.
- Share reproducible recipes openly with the global specialty coffee community.

---

## 🔬 Core 4 Pillars

1. **📝 1. Capture (Messy Natural Language ➡️ Structured Data):**  
   Type casually in plain English or Indonesian (*"Just brewed 15g of Gayo Wine at 92C on V60 with 1:15 ratio, 2m 15s contact time, tasted floral and sweet citrus..."*). Local AI recognizes bean origins, infers missing parameters, and standardizes variables into a clean schema.

2. **⚖️ 2. Compare (Deterministic Variable Deltas):**  
   Select any two brews to inspect exact changes across dose, water volume, brew temperature, grind setting, ratio, and total contact time.

3. **💡 3. Explain (Extraction Science):**  
   Understand *why* flavor shifted—scientifically linking grind particle size and contact time to perceived sweetness, acidity balance, or bitterness.

4. **🩺 4. Diagnostic Audit & Dial-In Recommendation:**  
   Identifies under-extraction or over-extraction symptoms and suggests exactly **one** single parameter adjustment for the next iteration, with a one-click *"Apply as Next Brew Base"* shortcut.

### Additional Features

- **✨ Daily Personalized Recipe Feed:** Auto-curates daily recipes tailored to your highest-rated past brews.
- **📥 / 📤 Open Coffee Dataset (Export & Import):** Exchange brew records in standard JSON format.
- **📱 Responsive Lab UI:** Clean dark-mode workspace built with React & Tailwind CSS v4, optimized for mobile, tablet, and desktop.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite, python-dotenv.
- **AI Engine:** Ollama local REST API (`gemma:latest`, `llama3.1`, etc.) with defensive JSON output parsing.
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons.

---

## 🚀 Quickstart Guide

### 1. Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- [Ollama](https://ollama.com/) running locally:

  ```bash
  ollama serve
  ollama pull gemma:latest   # or llama3.1
  ```

### 2. Backend Setup

```bash
git clone https://github.com/username/BrewLab.git
cd BrewLab

# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 📂 Project Architecture

```text
BrewLab/
├── ai.py                  # Ollama NLU integration (Capture, Compare, Daily Feed)
├── database.py            # SQLite Engine & Session generator via SQLModel
├── main.py                # FastAPI entrypoint and REST endpoints
├── models.py              # Data models (BrewExperimentBase, BrewExperiment, Requests)
├── requirements.txt       # Python dependencies
├── .env.example           # Example environment configuration
├── frontend/              # Modern React client
│   ├── src/
│   │   ├── App.jsx        # 4-Pillar interactive coffee lab UI
│   │   ├── index.css      # Tailwind CSS v4 design tokens
│   │   └── main.jsx       # React DOM root
│   ├── vite.config.js     # Vite configuration with API proxy
│   └── package.json       # Frontend dependencies
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.