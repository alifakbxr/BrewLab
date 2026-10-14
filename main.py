import re

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List

from database import create_db_and_tables, get_session
from models import (
    BrewExperiment, 
    BrewExperimentBase, 
    RawBrewInput, 
    CompareRequest,
    CoffeeBean,
    CoffeeBeanCreate,
)
from ai import extract_brew_parameters, analyze_comparison, generate_daily_recipe
from curated_data import CHAMPION_RECIPES, CURATED_BEANS

app = FastAPI(title="Brew API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {
        "name": "Brewlab API",
        "status": "Online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/experiments", response_model=List[BrewExperiment])
def list_experiments(session: Session = Depends(get_session)):
    experiments = session.exec(select(BrewExperiment).order_by(BrewExperiment.created_at.desc())).all()
    return experiments


def parse_float_safe(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r"[-+]?\d*\.?\d+", str(val))
    return float(match.group(0)) if match else None

def parse_int_safe(val):
    if val is None:
        return None
    if isinstance(val, int):
        return val
    match = re.search(r"\d+", str(val))
    return int(match.group(0)) if match else None


@app.post("/api/experiments/capture", response_model=BrewExperiment)
async def capture_experiment(payload: RawBrewInput, session: Session = Depends(get_session)):
    """
    Menerima catatan bebas, Mengekstrak via AI, lalu menyimpan ke database.
    """
    try:
        extract_dict = await extract_brew_parameters(payload.text)
        
        # Normalisasi string/list
        for str_field in ["bean_name", "roast_level", "method", "ratio", "grind_size"]:
            if isinstance(extract_dict.get(str_field), list):
                extract_dict[str_field] = ", ".join(str(item) for item in extract_dict[str_field])

        # Sanitasi tipe data numerik
        extract_dict["dose_grams"] = parse_float_safe(extract_dict.get("dose_grams"))
        extract_dict["water_grams"] = parse_float_safe(extract_dict.get("water_grams"))
        extract_dict["water_temp_c"] = parse_float_safe(extract_dict.get("water_temp_c"))
        extract_dict["brew_time_seconds"] = parse_int_safe(extract_dict.get("brew_time_seconds"))
        extract_dict["rating"] = parse_int_safe(extract_dict.get("rating"))

        # Pastikan sensory_notes berupa list
        if not isinstance(extract_dict.get("sensory_notes"), list):
            extract_dict["sensory_notes"] = []

        valid_fields = BrewExperiment.model_fields.keys()
        filtered_dict = {k: v for k, v in extract_dict.items() if k in valid_fields}
        experiment = BrewExperiment(**filtered_dict)


        if experiment.bean_name and experiment.dose_grams:
            beans = session.exec(select(CoffeeBean)).all()
            for b in beans:
                if b.name.lower() in experiment.bean_name.lower() or experiment.bean_name.lower() in b.name.lower():
                    b.stock_grams = max(0.0, b.stock_grams - experiment.dose_grams)
                    session.add(b)
                    break

        session.add(experiment)
        session.commit()
        session.refresh(experiment)
        return experiment
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengekstrak catatan: {str(e)}")

    
@app.get("/api/experiments/{experiment_id}", response_model=BrewExperiment)
def get_experiment(experiment_id: int, session: Session = Depends(get_session)):
    experiment = session.get(BrewExperiment, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment tidak ditemukan")
    return experiment
    
@app.post('/api/experiments/compare')
async def compare_experiments(payload: CompareRequest, session: Session = Depends(get_session)):
    """
    Membandingkan 2 eksperimen seduh: menghasilkan diff parameter + analisa Explain & Audit dari AI.
    """

    exp_a = session.get(BrewExperiment, payload.experiment_id_a)
    exp_b = session.get(BrewExperiment, payload.experiment_id_b)

    if not exp_a or not exp_b:
        raise HTTPException(status_code=404, detail="Satu atau kedua eksperimen tidak ditemukan")

    dict_a = exp_a.model_dump()
    dict_b = exp_b.model_dump()

    param_diff = {
        "dose_delta": (exp_b.dose_grams or 0) - (exp_a.dose_grams or 0) if exp_a.dose_grams and exp_b.dose_grams else None,
        "water_delta": (exp_b.water_grams or 0) - (exp_a.water_grams or 0) if exp_a.water_grams and exp_b.water_grams else None,
        "temp_delta": (exp_b.water_temp_c or 0) - (exp_a.water_temp_c or 0) if exp_a.water_temp_c and exp_b.water_temp_c else None,
        "time_delta": (exp_b.brew_time_seconds or 0) - (exp_a.brew_time_seconds or 0) if exp_a.brew_time_seconds and exp_b.brew_time_seconds else None,
        "ratio_a": exp_a.ratio,
        "ratio_b": exp_b.ratio,
    }

    ai_analysis = await analyze_comparison(dict_a, dict_b)

    return {
        "experiment_a": exp_a,
        "experiment_b": exp_b,
        "parameter_diff": param_diff,
        "analysis": ai_analysis
    }

@app.get("/api/feed/daily-recipe")
async def get_daily_recipe(session: Session = Depends(get_session)):
    """
    Menghasilkan resep harian berbasis biji kopi di stok user dan riwayat terbaik mereka.
    """
    all_experiments = session.exec(select(BrewExperiment)).all()
    history = [exp.model_dump() for exp in all_experiments]
    
    # Ambil biji kopi dari inventory
    beans = session.exec(select(CoffeeBean)).all()
    bean_dicts = [b.model_dump() for b in beans]

    recipe = await generate_daily_recipe(history, available_beans=bean_dicts)
    return recipe


@app.get("/api/experiments/export/json")
def export_experiments_json(session: Session = Depends(get_session)):
    """
    Export seluruh eksperimen dalam format Open Coffee Experiment Dataset
    """

    experiments = session.exec(select(BrewExperiment).order_by(BrewExperiment.created_at.desc())).all()
    return experiments

@app.post("/api/experiments/import/json")
def import_experiments_json(items: List[BrewExperimentBase], session: Session = Depends(get_session)):
    """
    Import daftar resep / eksperimen dari file JSON komunitas
    """

    created_count = 0
    for item in items:
        exp = BrewExperiment(**item.model_dump())
        session.add(exp)
        created_count += 1

    session.commit()
    return {
        "message": f"Berhasil mengimpor {created_count} eksperimen baru."
    }
    
@app.delete('/api/experiments/{experiment_id}')
def delete_experiments(experiment_id: int, session: Session = Depends(get_session)):
    """
    Menghapus satu eksperimen berdasarkan ID.
    """
    experiment = session.get(BrewExperiment, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Eksperimen tidak ditemukan")

    session.delete(experiment)
    session.commit()
    
    return {"message": f"Eksperimen #{experiment_id} berhasil dihapus"}

@app.get('/api/recipes/champions')
def list_champion_recipes():
    """
    Return curated World Barista & Brewers Cup Championship recipes from 2000 to present
    """

    return CHAMPION_RECIPES

@app.get('/api/beans', response_model=List[CoffeeBean])
def list_beans(session: Session = Depends(get_session)):
    """
    List all coffe beans in users pantry/inventory with remaining stock.
    """

    return session.exec(select(CoffeeBean).order_by(CoffeeBean.stock_grams.asc())).all()

@app.post('/api/beans', response_model=CoffeeBean)
def create_bean(payload: CoffeeBeanCreate, session: Session =  Depends(get_session)):
    """
    Manually add a new coffee bag to inventory
    """

    bean = CoffeeBean(**payload.model_dump())
    session.add(bean)
    session.commit()
    session.refresh(bean)
    return bean

@app.post('/api/beans/seed-catalog')
def seed_curated_beans(session: Session = Depends(get_session)):
    """
    1-Click Zero-file Import: Seeds curated world speciality beans if not present.
    """

    added_count = 0
    for item in CURATED_BEANS:
        existing = session.exec(select(CoffeeBean).where(CoffeeBean.name == item['name'])).first()
        if not existing:
            bean = CoffeeBean(**item)
            session.add(bean)
            added_count += 1
    
    session.commit()
    return {
        "message": f"Berhasil menambahkan {added_count} speciality beans baru ke dalam inventaris."
    }

@app.patch('/api/beans/{bean_id}/stock')
def update_bean_stock(bean_id: int, stock_grams: float, session: Session = Depends(get_session)):
    """
    Update remaining grams for bean bag
    """

    bean = session.get(CoffeeBean, bean_id)
    if not bean:
        raise HTTPException(status_code=404, detail="Coffee bean not found")
    bean.stock_grams = max(0.0, stock_grams)
    session.add(bean)
    session.commit()
    session.refresh(bean)
    return bean
    
@app.delete('/api/beans/{bean_id}')
def delete_bean(bean_id: int, session: Session = Depends(get_session)):
    """
    Remove a bean from patry
    """

    bean = session.get(CoffeeBean, bean_id)
    if not bean:
        raise HTTPException(status_code=404, detail="Coffee bean not found")
    session.delete(bean)
    session.commit()
    return {"message": "Coffee bean successfully deleted"}

