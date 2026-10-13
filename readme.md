# ☕ BrewLab

> **Open-Source Coffee Experiment Assistant**  
> Turn messy, informal coffee brewing notes into structured, comparable, and scientifically audited experiments using Local Open-Weight AI.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![Ollama](https://img.shields.io/badge/Local%20AI-Ollama%20%2F%20Gemma-FF6F00.svg?style=flat)](https://ollama.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 Philosophy & Vision

**BrewLab is not an omniscient AI that claims to know everything about coffee.**

Instead, BrewLab is a **precision experimental instrument** that empowers home brewers, baristas, and coffee roasters to:

- Convert casual, conversational thoughts into structured experimental data.
- Compare two brew recipes side-by-side with exact mathematical parameter deltas.
- Receive scientific extraction diagnosis (*Extraction Yield, TDS, Contact Time, Channeling*) powered by local open-weight LLMs (such as Gemma or LLaMA) with zero API billing.
- Share reproducible recipes openly with the global specialty coffee community.

---

## 🔬 Core 4 Pillars

1. **📝 1. Capture (Messy Natural Language ➡️ Structured Data):**  
   Type casually in plain English or Indonesian (*"Just brewed 15g of Gayo Wine at 92C on V60 with 1:15 ratio, medium-coarse grind..."*). Local AI recognizes bean origins, infers missing parameters, and standardizes variables into a clean schema.

2. **⚖️ 2. Compare (Deterministic Variable Deltas):**  
   Select any two brews to inspect exact changes across dose, water volume, brew temperature, grind setting, and total contact time.

3. **💡 3. Explain (Extraction Science):**  
   Understand *why* flavor shifted—scientifically linking grind particle size and contact time to perceived sweetness, bitterness, or astringency.

4. **🩺 4. Diagnostic Audit & Dial-In Recommendation:**  
   Identifies under-extraction or over-extraction symptoms and suggests exactly **one** single parameter adjustment for the next iteration, with a one-click *"Apply as Next Brew Base"* shortcut.

### Additional Features

- **✨ Daily Personalized Recipe Feed:** Auto-curates daily recipes tailored to your highest-rated past brews.
- **📥 / 📤 Open Coffee Dataset (Export & Import):** Exchange brew records in standard JSON format.
- **📱 Responsive Lab UI:** Clean dark-mode workspace crafted for mobile phones, tablets, and desktop workstations.

---

## 🛠️ Tech Stack

- **Backend:** Python 3, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite.
- **AI Engine:** Ollama local REST API (`gemma`, `llama3.1`, etc.) with defensive JSON output parsing.
- **Frontend:** Vanilla HTML5, Tailwind CSS, Plus Jakarta Sans & JetBrains Mono typography, served directly via FastAPI static mounts (Zero Build Step).

---

## 🚀 Quickstart Guide

### 1. Prerequisites

- Python 3.11+
- [Ollama](https://ollama.com/) running locally:

  ```bash
  ollama serve
  ollama pull gemma:2b   # or llama3.1:8b
  ```

### 2. Clone & Virtual Environment Setup

```bash
git clone https://github.com/username/BrewLab.git
cd BrewLab

python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Model Configuration (Optional)

In `ai.py`, specify your preferred local model:

```python
DEFAULT_MODEL = "gemma:2b"  # or "llama3.1:8b-instruct-q4_K_M"
```

### 4. Run the Application

```bash
uvicorn main:app --reload --port 8000
```

Open your browser at:

- **Web App:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Architecture

```text
BrewLab/
├── ai.py              # Ollama NLU integration (Capture, Compare, Daily Feed)
├── database.py        # SQLite Engine & Session generator via SQLModel
├── main.py            # FastAPI entrypoint, REST endpoints, and static server
├── models.py          # Data models (BrewExperimentBase, BrewExperiment, Requests)
├── requirements.txt   # Python dependencies
└── static/
    ├── app.js         # Reactive UI logic, filters, comparison modal, export/import
    └── index.html     # Responsive lab dashboard with Tailwind CSS
```

---

## 🤝 Open Innovation & Contributing

Contributions are warmly welcomed!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/scaa-flavor-wheel`).
3. Commit your changes (`git commit -m "feat: add SCAA flavor wheel mapping"`).
4. Push to the branch (`git push origin feature/scaa-flavor-wheel`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.