# ☕ BrewLab

> **Open-Source Coffee Experiment Assistant**  
> Mengubah catatan seduhan kopi yang berantakan menjadi eksperimen terstruktur, dapat diuji, dan diaudit secara ilmiah menggunakan Local AI.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![Ollama](https://img.shields.io/badge/Local%20AI-Ollama%20%2F%20Gemma-FF6F00.svg?style=flat)](https://ollama.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 Filosofi & Visi

**BrewLab bukan AI yang mengklaim tahu segalanya tentang kopi.**  
Sebaliknya, BrewLab adalah **alat instrumen laboratorium seduh** yang membantu *home brewer*, barista, dan antusias kopi untuk:
- Mengabadikan variabel seduh dari catatan bebas ke format data terstruktur.
- Membandingkan dua seduhan (*dial-in process*) secara berdampingan dengan selisih variabel terukur.
- Mendapatkan telaah ilmiah ekstraksi (*extraction yield, contact time, channeling, TDS*) dari open-weight LLM lokal tanpa biaya cloud API.
- Membagikan resep terbuka (*open dataset*) ke komunitas.

---

## 🔬 4 Pilar Utama BrewLab

1. **📝 1. Capture (Unstructured ➡️ Structured):**  
   Ketik atau rekam catatan seduh apa adanya (*"Gayo Wine 15g air 225g suhu 92C V60 grind 18 klik..."*). Model AI lokal mengekstraknya ke skema parameter seduh baku: dosis, air, rasio, suhu, ukuran gilingan, waktu seduh, dan *sensory notes*.
2. **⚖️ 2. Compare (Deterministic Variable Diff):**  
   Pilih dua eksperimen untuk melihat perbandingan berdampingan dengan kalkulasi selisih delta parameter (misal: suhu $+2^\circ\text{C}$, gilingan lebih halus, waktu kontak $+35\text{s}$).
3. **💡 3. Explain (Sains Ekstraksi Kopi):**  
   Menganalisis alasan ilmiah di balik perubahan profil rasa (kenapa seduhan kedua menjadi kering/*astringent*, hilangnya *sweetness*, atau naiknya *clarity*).
4. **🩺 4. Diagnostic Audit & Dial-in Recommendation:**  
   Pengecekan over-extraction / under-extraction dan rekomendasi tepat **satu variabel** yang harus diubah pada seduhan berikutnya, lengkap dengan tombol satu-klik *"Use as Next Brew Base"*.

### Fitur Tambahan
- **✨ Daily Personalized Recipe Feed:** Kurasi resep harian dari AI berdasarkan preferensi seduhan dengan rating tertinggi di histori Anda.
- **📥 / 📤 Open Coffee Dataset (Export & Import):** Bagikan catatan seduhan dalam format standar JSON terbuka kepada komunitas.
- **📱 Fully Responsive Mobile-First UI:** Antarmuka dark-mode modern yang rapi di layar ponsel, tablet, maupun desktop monitor.

---

## 🛠️ Stack Teknologi

- **Backend:** Python 3, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), SQLite.
- **AI Engine:** Ollama API (`gemma`, `llama3.1`, atau model open-weight lainnya) dengan parsing JSON deterministik.
- **Frontend:** Vanilla HTML5, Tailwind CSS, Plus Jakarta Sans & JetBrains Mono typography, dilayani langsung oleh FastAPI Static Files (Zero Build Step).

---

## 🚀 Panduan Memulai (Quickstart)

### 1. Prasyarat
- Python 3.11+
- [Ollama](https://ollama.com/) sudah terpasang dan berjalan di mesin lokal Anda:
  ```bash
  ollama serve
  ollama pull gemma:2b   # atau llama3.1:8b
