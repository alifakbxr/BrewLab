import json
import httpx
from typing import Dict, List, Any
from models import BrewExperimentBase

OLLAMA_API_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "gemma:latest"

async def extract_brew_parameters(raw_text: str, model_name: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """
    Mengekstrak parameter seduh terstruktur dari catatan bebas pengguna
    """

    system_prompt = (
        "You are BrewLab, an expert coffe experiment data assistant"
        "Extract structured coffe brewing parameters from the user's messy notes into a valid JSON object. \n"
        "Return ONLY a raw JSON object with NO markdown formatting, No backticks, and NO conversational text. \n"
        "The JSON must be have the folowing keys:\n"
        "- bean_name (string or null)\n"
        "- roast_level (Light, Medium, or Dark, or null)\n"
        "- method (e.g, V60, Aeropress, French Press, Kalita, Espresso, or null)\n"
        "- dose_grams (float or null)\n"
        "- water_grams (float or null)\n"
        "- ratio (string like 1:15 or null: calculate from water/dose if possible)\n"
        "- water_temp_c (float in Celsius or null)\n"
        "- grind_size (string or null, e.g. 'Medium Fine', '20 clicks)\n"
        "- brew_time_seconds (integer total brew duration in seconds or null)\n"
        "- sensory_notes (list of strings describing taste/aroma/body, e.g. ['fruity', 'bitter finish'])\n"
        "- rating (integer 1-10 or null)"
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


        parsed_data = json.loads(raw_content)
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
        
        return json.loads(raw_content)