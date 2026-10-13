from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List


from database import create_db_and_tables, get_session
from models import BrewExperiment, BrewExperimentBase, RawBrewInput, CompareRequest
from ai import extract_brew_parameters, analyze_comparison

app = FastAPI(title="Brew API", version="0.1.0")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/experiments", response_model=List[BrewExperiment])
def list_experiments(session: Session = Depends(get_session)):
    experiments = session.exec(select(BrewExperiment).order_by(BrewExperiment.created_at.desc())).all()
    return experiments


@app.post("/api/experiments/capture", response_model=BrewExperiment)
async def capture_experiment(payload: RawBrewInput, session: Session = Depends(get_session)):
    """
    Menerima catatan bebas, Mengekstrak via AI, lalu menyimpan ke database.
    """
    try:
        extract_dict= await extract_brew_parameters(payload.text)
        experiment = BrewExperiment(**extract_dict)
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

    exp_a = session.get(BrewExperiment, payload.expreiment_id_a)
    exp_b = session.get(BrewExperiment, payload.expreiment_id_b)

    if not exp_a or not exp_b:
        raise HTTPException(status_code=404, detail="Satu atau kedua eksperimen tidak ditemukan")

    exp_a_dict = exp_a.dict()
    exp_b_dict = exp_b.dict()

    if not exp_a or not exp_b:
        raise HTTPException(status_code=404, detail="Satu atau kedua eksperimen tidak ditemukan")

    dict_a = exp_a.model_dump()
    dict_b = exp_b.model_dump()

    param_diff = {
        "dose_delta": (exp_b.dose_grams or 0) - (exp_a.dose_grams or 0) if exp_a.dose_grams and exp_b.dose_grams else None,
        "water_delta": (exp_b.water_grams or 0) - (exp_a.water_grams or 0) if exp_a.water_grams and exp_b.water_grams else None,
        "temp_delta": (exp_b.water_temp_c or 0) - (exp_a.water_temp_c or 0) if exp_a.water_temp_c and exp_b.water_temp_c else None,
        "time_delta": (exp_b.brew_time_seconds or 0) - (exp_a.brew_time_seconds or 0) if exp_a.brew_time_seconds and exp_b.brew_time_seconds else None,
    }

    ai_analysis = await analyze_comparison(dict_a, dict_b)

    return {
        "experiment_a": exp_a,
        "experiment_b": exp_b,
        "parameter_diff": param_diff,
        "analysis": ai_analysis
    }

    

    