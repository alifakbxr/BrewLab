import json
import httpx
import re
import os
from dotenv import load_dotenv
from typing import Dict, List, Any
from models import BrewExperimentBase

load_dotenv()

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL")
DEFAULT_MODEL = os.getenv("MODEL_NAME", "gemma:latest")

async def extract_brew_parameters(raw_text: str, model_name: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Mengekstrak parameter seduh terstruktur dari catatan bebas pengguna
    """

    system_prompt = (
        "You are BrewLab, an intelligent coffee experiment assistant with deep Natural Language Understanding (NLU).\n"
        "Your mission is to understand casual, conversational, human language (Indonesian or English) about coffee brewing and extract it into a structured JSON schema.\n\n"
        "NATURAL LANGUAGE RULES:\n"
        "1. Bean Name Detection (Implicit Entity Extraction):\n"
        "   - Automatically detect coffee origins, varietals, farms, or processes from context (e.g. 'gayo wine', 'ethiopia guji', 'sidikalang', 'kintamani', 'toraja sapan', 'geisha', 'colombia supremo', 'kerinci', 'mandheling').\n"
        "   - Never require the user to say 'beans:' or 'nama kopi:'. Always format the extracted name in proper Title Case (e.g. 'Gayo Wine', 'Sidikalang').\n"
        "   - If no bean is mentioned at all, set to 'Unknown Bean'.\n\n"
        "2. Conversational Number & Slang Understanding:\n"
        "   - Understand Indonesian phrasing: 'takaran 1 banding 15' -> ratio: '1:15', 'sembilan puluh dua derajat' -> water_temp_c: 92.0.\n"
        "   - Understand brew times: '2 menit 30 detik' or '2 setengah menit' -> brew_time_seconds: 150.\n"
        "   - Understand ratings: 'kukasi nilai 8', 'skor 7 dari 10', 'bintang 4/5 (scale to 8/10)' -> rating integer.\n"
        "   - Understand grind descriptions: 'sedikit kasar' -> 'Medium-Coarse', 'agak halus' -> 'Medium-Fine', 'halus banget' -> 'Fine'.\n\n"
        "3. Smart Inference (Calculations):\n"
        "   - If dose is 15g and ratio is '1:15', automatically calculate water_grams = 225.0 if water is not explicitly given.\n"
        "   - If water is 225g and dose is 15g, calculate ratio = '1:15'.\n\n"
        "4. Sensory Extraction:\n"
        "   - Extract any taste, aroma, or texture sensations described in human words (e.g. 'rasa manis madu', 'asem seger lemon', 'pahit pekat', 'body tebel') into clean sensory tags.\n\n"
        "EXAMPLES OF NATURAL LANGUAGE TO JSON:\n"
        "Input: 'Aku baru seduh gayo wine 20 gram dengan ration 1:15 dengan gilingan sedikit kasar'\n"
        "Output JSON:\n"
        "{\n"
        '  "bean_name": "Gayo Wine",\n'
        '  "roast_level": "Medium",\n'
        '  "method": "V60",\n'
        '  "dose_grams": 20.0,\n'
        '  "water_grams": 300.0,\n'
        '  "ratio": "1:15",\n'
        '  "water_temp_c": null,\n'
        '  "grind_size": "Medium-Coarse",\n'
        '  "brew_time_seconds": null,\n'
        '  "sensory_notes": [],\n'
        '  "rating": null\n'
        "}\n\n"
        "Input: 'Pagi ini coba seduh sidikalang pake v60 15g air 225ml suhu 90 derajat. Waktu seduh 2m 15s. Rasanya manis gula aren sama asem segar. Rating 8.5'\n"
        "Output JSON:\n"
        "{\n"
        '  "bean_name": "Sidikalang",\n'
        '  "roast_level": "Medium",\n'
        '  "method": "V60",\n'
        '  "dose_grams": 15.0,\n'
        '  "water_grams": 225.0,\n'
        '  "ratio": "1:15",\n'
        '  "water_temp_c": 90.0,\n'
        '  "grind_size": null,\n'
        '  "brew_time_seconds": 135,\n'
        '  "sensory_notes": ["manis gula aren", "asem segar"],\n'
        '  "rating": 9\n'
        "}\n\n"
        "Return ONLY a valid JSON object matching this schema. NO markdown, NO text outside JSON."
    )



    payload = {
        'model': model_name,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f"Notes to extract:\n{raw_text}"}
        ],
        'format': 'json',
        'stream':  False,
        'options': {
            'temperature': 0.1,
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_content = data.get('message', {}).get('content', '{}').strip()

        if raw_content.startswith("```"):
            raw_content = raw_content.strip("`")
            if raw_content.startswith("json"):
                raw_content = raw_content[4:].strip()


        parsed_data = json.loads(clean_json_string(raw_content))
        parsed_data['raw_notes'] = raw_text
        return parsed_data


async def analyze_comparison(exp_a: Dict[str, Any], exp_b: Dict[str, Any], model_name: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Menganalisa perbedaan 2 eksperiment kopi, menjelaskan dampaknya (Explain),
    serta memberikan audit dan rekomendasi perbaikan (Audit & Recommend).
    """

    prompt = f""" You are BrewLab, a speciality coffee scientist.
    Analyze these two coffee brew experiments on the same or similar beans.

    EXPERIMENT A:
    - Method: {exp_a.get('method')}
    - Dose: {exp_a.get('dose_grams')}g
    - Water: {exp_a.get('water_grams')}g (Ratio: {exp_a.get('ratio')})
    - Temp: {exp_a.get('water_temp_c')}°C
    - Grind Size: {exp_a.get('grind_size')}
    - Brew Time: {exp_a.get('brew_time_seconds')}s
    - Sensory Notes: {', '.join(exp_a.get('sensory_notes') or [])}
    - Rating: {exp_a.get('rating')}/10

    EXPERIMENT B:
    - Method: {exp_b.get('method')}
    - Dose: {exp_b.get('dose_grams')}g
    - Water: {exp_b.get('water_grams')}g (Ratio: {exp_b.get('ratio')})
    - Temp: {exp_b.get('water_temp_c')}°C
    - Grind Size: {exp_b.get('grind_size')}
    - Brew Time: {exp_b.get('brew_time_seconds')}s
    - Sensory Notes: {', '.join(exp_b.get('sensory_notes') or [])}
    - Rating: {exp_b.get('rating')}/10


    Task:
    Provide a structured JSON output with:
    1. "variable_changes": Brief summary of what parameters were changed.
    2. "extraction_explanation": Scientific explanation of how the changes affected extracion (acidity, sweetness, bitterness, body, contact time).
    3. "audit": Diagnostic check - was either brew over-extracted, under-extracted, or unbalanced?
    4. "next_recommendation": Exactly ONE concrete suggestion on what single parameter to adjust for the next brew to improve flavor.

    Return ONLY a valid JSON object with keys: "variable_changes", "extraction_explanation", "audit", "next_recommendation".    
    """

    payload = {
        'model': model_name,
        'messages': [
            {'role': 'system', 'content': 'You are a coffee extraction scientist. Output strictly valid JSON without markdown'},
            {'role': 'user', 'content': prompt}
        ],
        'format': 'json',
        'stream': False,
        'options': {'temperature': 0.2}
    }


    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()

        data = response.json()
        raw_content = data.get('message', {}).get('content', '{}').strip()

        # Remove markdown code blocks if present
        if raw_content.startswith("```"):
            raw_content = raw_content.strip("`")
            if raw_content.startswith("json"):
                raw_content = raw_content[4:].strip()
        
        return json.loads(clean_json_string(raw_content))


async def generate_daily_recipe(
    user_history: list[Dict[str, Any]], 
    available_beans: list[Dict[str, Any]] = None,
    model_name: str = DEFAULT_MODEL
) -> Dict[str, Any]:
    """
    Menghasilkan rekomendasi resep seduh harian berbasis biji kopi nyata yang ada di inventaris user
    serta preferensi histori seduhan terbaik mereka.
    """    
    available_beans = available_beans or []
    
    # 1. Format available beans context
    if available_beans:
        beans_context = "USER'S CURRENT BEAN PANTRY (You MUST pick one of these available beans):\n" + "\n".join([
            f"- {b.get('name')} (Roast: {b.get('roast_level')}, Process: {b.get('process')}, Stock: {b.get('stock_grams')}g left, Notes: {', '.join(b.get('flavor_notes') or [])})"
            for b in available_beans if b.get('stock_grams', 0) > 0
        ])
    else:
        beans_context = "USER'S BEAN PANTRY: Empty. Suggest any classic specialty bean (e.g. Ethiopia Yirgacheffe Washed)."

    # 2. Format best brews context
    top_brews = sorted([b for b in user_history if b.get('rating')], key=lambda x: x.get('rating', 0), reverse=True)[:2]
    if top_brews:
        history_context = "USER'S TOP RATED BREWS:\n" + "\n".join([
            f"- {b.get('bean_name')} {b.get('method')}, ratio: {b.get('ratio')}, rating: {b.get('rating')}/10"
            for b in top_brews
        ])
    else:
        history_context = "USER HISTORY: New brewer. Provide a foolproof, sweet, and balanced recipe."

    prompt = f"""You are BrewLab AI, a precision coffee brewing engine.
{beans_context}

{history_context}

Task:
Design a precise, non-random coffee experiment recipe for today.
If beans are available in the pantry, YOU MUST pick one of them as 'recommendation_bean'.

Return strictly valid JSON only:
{{
  "title": "Recipe Title (e.g. Sweet Peach V60)",
  "recommendation_bean": "Exact Name of chosen bean from pantry",
  "method": "V60",
  "dose_grams": 15.0,
  "water_grams": 250.0,
  "ratio": "1:16.7",
  "water_temp_c": 93.0,
  "grind_size": "Medium-Fine",
  "brew_time_target": "2m 30s",
  "flavor_profile_target": "Expected sensory cup notes",
  "pro_tip": "One concise extraction tip for this specific bean and stock level"
}}"""

    payload = {
        'model': model_name,
        'messages': [
            {'role': 'system', 'content': 'You are a coffee scientist. Output strictly valid JSON only.'},
            {'role': 'user', 'content': prompt}
        ],
        'format': 'json',
        'stream': False,
        'options': {
            'temperature': 0.2,
            'num_predict': 350
        }
    }

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(OLLAMA_API_URL, json=payload)
            response.raise_for_status()
            raw_content = response.json().get('message', {}).get('content', '{}').strip()

        if raw_content.startswith("```"):
            raw_content = raw_content.strip("`")
            if raw_content.startswith("json"):
                raw_content = raw_content[4:].strip()
            
        return json.loads(clean_json_string(raw_content))
    except Exception as e:
        print(f"Daily recipe generation error: {e}")
        # Intelligent fallback to the first available bean in pantry
        chosen_bean = available_beans[0]["name"] if available_beans else "Ethiopia Yirgacheffe Washed"
        return {
            "title": "Balanced Morning Pour-Over",
            "recommendation_bean": chosen_bean,
            "method": "V60",
            "dose_grams": 15.0,
            "water_grams": 250.0,
            "ratio": "1:16.7",
            "water_temp_c": 93.0,
            "grind_size": "Medium-Fine",
            "brew_time_target": "2m 30s",
            "flavor_profile_target": "Clean fruit sweetness, floral aroma, and smooth citrus finish",
            "pro_tip": "Keep water pour steady in the center to highlight origin sweetness."
        }

    
def clean_json_string(raw_str: str) -> str:
    """
    Mengekstrak substring JSON murni dari respons LLM
    """

    raw_str = raw_str.strip()
    
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_str)
    if match:
        return match.group(1).strip()

    start = raw_str.find('{')
    end = raw_str.rfind('}')

    if start != -1 and end != -1:
        return raw_str[start:end+1]
    return raw_str
