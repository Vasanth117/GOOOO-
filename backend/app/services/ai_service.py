import groq
import httpx
from app.config import settings
import logging
import json
import base64
import io
from typing import Optional, List, Dict, Any
from pathlib import Path
from beanie import PydanticObjectId

logger = logging.getLogger(__name__)

class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, PydanticObjectId):
            return str(obj)
        if isinstance(obj, bytes):
            return obj.decode('utf-8', errors='ignore')
        return super().default(obj)

# Initialize Groq
if settings.GROQ_API_KEY:
    client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)
    TEXT_MODEL = "llama-3.1-8b-instant"
    VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
else:
    client = None
    logger.warning("GROQ_API_KEY not set. AI features will use mock responses.")

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
 
def _clean_json_response(content: str) -> str:
    """Extracts exactly the FIRST complete JSON object from the LLM output, ignoring anything else."""
    content = content.strip()
    
    # Locate the first '{'
    start_idx = content.find('{')
    if start_idx == -1:
        return content
        
    # Standard brace-counting to find the matching '}' for the FIRST object
    depth = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end_idx = i
                break
                
    if start_idx != -1 and end_idx != -1:
        return content[start_idx:end_idx+1]
        
    return content

# ─── YOLOv8 CROP DISEASE MODEL ────────────────────────────────
_yolo_model = None
MODEL_PATH = Path(__file__).parent.parent.parent / "runs" / "classify" / "goo_ai_models" / "crop_classifier" / "weights" / "best.pt"

DISEASE_LABELS = {
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Tomato Spider Mites (Two-Spotted)",
    "Tomato__Target_Spot": "Tomato Target Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "Tomato Yellow Leaf Curl Virus",
    "Tomato__Tomato_mosaic_virus": "Tomato Mosaic Virus",
    "Tomato_healthy": "Healthy Tomato Leaf",
}


def _get_yolo_model():
    """Lazy-loads the YOLOv8 model on first use to avoid slow startup."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            if MODEL_PATH.exists():
                _yolo_model = YOLO(str(MODEL_PATH))
                logger.info(f"YOLOv8 crop disease model loaded from {MODEL_PATH}")
            else:
                logger.warning(f"YOLOv8 model not found at {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
    return _yolo_model


async def get_farming_advice(user_query: str, context: dict) -> dict:
    """Gets expert farming advice from a high-performance Llama 3 model."""
    if not client:
        return _mock_advice("AI Service Offline (Missing API Key)")

    weather_keywords = ['weather', 'rain', 'temperature', 'forecast', 'climate', 'sun', 'cloud', 'hot', 'cold']
    disease_keywords = ['disease', 'pest', 'leaf', 'spot', 'rot', 'insect', 'protection', 'safe', 'health']

    is_weather_asked = any(k in user_query.lower() for k in weather_keywords)
    is_disease_asked = any(k in user_query.lower() for k in disease_keywords)

    user_prefs = context.get("preferences", {})
    language = user_prefs.get("language", "English")
    priority = user_prefs.get("advice_priority", "General Sustainability")

    system_prompt = (
        "You are the GOO Master Agriculture Expert. Your goal is to provide specific, "
        "evidence-based organic farming advice that WOWS the user."
        f"\n\nUSER PREFERENCES:"
        f"\n- Primary Language: {language} (You MUST respond in this language if it is not English)"
        f"\n- Advice Priority: {priority} (Focus your advice on this goal)"
        "\n\nFOLLOW THESE PERSONALITY GUIDELINES:"
        "\n- BE PROACTIVE: If you see the user has a specific crop, give them its 'Organic Growth Tip of the Day'."
        "\n- BE TECHNICAL BUT ACCESSIBLE: Mention specific organic fertilizers (e.g., Neem cake, Vermicompost) and techniques (e.g., mulching, crop rotation)."
        "\n- BE SUPPORTIVE: If they haven't planted yet, push them to try profitable, sustainable crops based on their soil."
        "\n\nSTRICT JSON SCHEMA:"
        "\n- 'response': A SINGLE FLAT STRING containing the well-formatted, detailed answer (Markdown supported). DO NOT use nested objects or multiple keys for translations. MUST be in the user's Primary Language."
        "\n- 'suggestions': Exactly 3 helpful follow-up questions (strings only). MUST be in the user's Primary Language."
        "\n- 'detected_intent': One of 'onboarding', 'advice', 'weather', 'disease'."
        "\n- 'audio_trigger': boolean (true to read the response out loud)."
        "\n\nCRITICAL: The 'response' field MUST ALWAYS be a single string, even when translating to specialized languages like Tamil, Telugu, or Hindi. Do not use an object for the response. You MUST respond with PURE JSON only. DO NOT wrap the JSON in markdown code blocks (e.g. ```json). Your response must begin with '{' and end with '}'."
    )

    clean_context = {
        "user_name": context.get("user_name"),
        "farm_profile": context.get("farm_profile", {}),
        "location": "Automatically Detected via GPS",
        "weather": context.get("current_weather") if (is_weather_asked or is_disease_asked) else "Available on request"
    }

    full_prompt = f"""
    EXPERT CONTEXT:
    {json.dumps(clean_context, cls=MongoJSONEncoder)}

    FARMER MESSAGE:
    {user_query}

    Respond now as the Master Expert in JSON format.
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt},
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        content = chat_completion.choices[0].message.content
        logger.info(f"Expert Raw Content: {content}")
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Groq Expert Error: {e}")
        return _mock_advice(f"AI Service Temporarily Unstable: {str(e)}")


async def analyze_crop_health(image_data: bytes, user_query: Optional[str] = None) -> dict:
    """
    Three-stage pipeline (strict order):
    1. Vision AI validates it's actually a plant/leaf — ALWAYS runs first (gatekeeper).
       Non-plant images are immediately rejected. YOLO cannot do this — it is trained
       only on plant disease classes and will assign a disease label to ANY image.
    2. YOLOv8 classifies the disease — only runs if Stage 1 confirms a plant.
    3. Groq LLM generates detailed organic treatment advice for the identified disease.
    """
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception:
        return _error_analysis("Invalid image file. Please upload a valid JPG or PNG.")

    # ── STAGE 1: VISION AI PLANT VALIDATION (ALWAYS FIRST — STRICT GATEKEEPER) ──
    # CRITICAL: YOLO is trained ONLY on tomato disease classes. It will assign one of
    # those labels to ANY image (a dog, a car, food, anything). We MUST use Vision AI
    # first to confirm the image is actually a plant before letting YOLO classify it.
    is_plant = False
    plant_rejection_reason = "This does not appear to be a plant or leaf image."

    if not client:
        return _error_analysis(
            "AI verification service is offline. Cannot safely analyze the image."
        )

    base64_image = base64.b64encode(image_data).decode('utf-8')
    try:
        validation = await client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are a strict agricultural image gatekeeper. "
                            "Your ONLY job is to determine if this image shows a plant leaf, crop, or vegetation."
                            "\n\nRULES:"
                            "\n- ACCEPT: Close-up of a leaf, plant stem, crop row, vegetable on plant, fruit on plant, or any agricultural plant."
                            "\n- REJECT: People, animals, food on plates, buildings, vehicles, bare soil without plants, sky, indoor objects, random items, blurry unrecognizable images."
                            "\n- When in doubt → mark is_plant as false."
                            "\n\nReply ONLY with valid JSON (no markdown): "
                            '{"is_plant": true/false, "plant_type": "type of plant if detected or null", "reason": "one sentence reason"}'
                        )
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                ],
            }],
            model=VISION_MODEL,
            max_tokens=200,
            temperature=0.1,
        )
        v = json.loads(_clean_json_response(validation.choices[0].message.content))
        is_plant = v.get("is_plant", False)
        plant_rejection_reason = v.get("reason", plant_rejection_reason)
        logger.info(f"Vision plant gate: is_plant={is_plant}, reason={plant_rejection_reason}")
    except Exception as e:
        logger.error(f"Vision validation error: {e}")
        return _error_analysis(
            "Our image verification system is temporarily unavailable. Please try again in a moment."
        )

    # Hard gate: if not a plant, reject immediately with clear message
    if not is_plant:
        return {
            "diagnosis": "Invalid Image — Not a Plant",
            "severity": "None",
            "advice": (
                f"❌ {plant_rejection_reason} "
                f"Please upload a clear, close-up photo of a plant leaf or crop to get an accurate disease analysis. "
                f"Valid examples: tomato leaves, crop rows, leaves showing spots or discoloration."
            ),
            "precautions": [],
            "safety_measures": [],
            "is_organic_friendly": True,
            "confidence": 0,
            "is_valid_plant": False,
        }

    # ── STAGE 2: YOLOv8 DISEASE CLASSIFICATION (plant confirmed — safe to run) ──
    yolo = _get_yolo_model()
    yolo_diagnosis = None
    yolo_confidence = 0.0

    if yolo:
        try:
            results = yolo.predict(source=img, imgsz=224, verbose=False)
            top1_idx = results[0].probs.top1
            top1_conf = float(results[0].probs.top1conf)
            raw_label = results[0].names[top1_idx]
            yolo_confidence = top1_conf
            yolo_diagnosis = DISEASE_LABELS.get(raw_label, raw_label.replace("_", " "))
            logger.info(f"YOLOv8 detected: {yolo_diagnosis} ({yolo_confidence:.2%})")

            # Require minimum confidence — low score means YOLO is unsure, skip it
            if top1_conf < 0.55:
                logger.info(f"YOLO confidence too low ({top1_conf:.2%}), falling back to Vision AI")
                yolo_diagnosis = None
                yolo_confidence = 0.0
        except Exception as e:
            logger.error(f"YOLOv8 inference error: {e}")

    # ── STAGE 3: GENERATE TREATMENT ADVICE ───────────────────────────────────
    # Path A: YOLO gave a confident diagnosis — generate specific treatment
    if client and yolo_diagnosis:
        is_healthy = "healthy" in yolo_diagnosis.lower()
        prompt = f"""You are a Master Crop Disease Specialist and Organic Farming Expert for Indian farmers.

A YOLOv8 AI model scanned a verified plant image and detected: "{yolo_diagnosis}" with {yolo_confidence:.1%} confidence.

{"The plant appears HEALTHY. Provide encouraging tips to keep it thriving organically." if is_healthy else "The plant has a DISEASE. Provide specific, detailed organic treatment steps and safety precautions."}

Farmer note: {user_query or "No additional info provided."}

Respond ONLY with valid JSON (no markdown):
{{
    "diagnosis": "{yolo_diagnosis}",
    "severity": "{"None" if is_healthy else "Low/Medium/High"}",
    "advice": "A comprehensive 3-4 sentence paragraph explaining what this is, how it spreads, and the best organic treatment approach.",
    "precautions": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"],
    "safety_measures": ["Measure 1", "Measure 2", "Measure 3", "Measure 4", "Measure 5"],
    "is_organic_friendly": true
}}"""

        try:
            response = await client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=TEXT_MODEL,
                response_format={"type": "json_object"},
                temperature=0.4,
            )
            content = response.choices[0].message.content
            result = json.loads(_clean_json_response(content))
            result["confidence"] = round(yolo_confidence * 100, 1)
            result["is_valid_plant"] = True
            return result
        except Exception as e:
            logger.error(f"Groq precaution generation error: {e}")

    # Path B: YOLO worked but Groq is down — return basic YOLO result
    if yolo_diagnosis:
        is_healthy = "healthy" in yolo_diagnosis.lower()
        return {
            "diagnosis": yolo_diagnosis,
            "severity": "None" if is_healthy else "Medium",
            "advice": (
                f"{'✅ Your plant appears healthy!' if is_healthy else f'⚠️ Disease detected: {yolo_diagnosis}.'} "
                f"{'Continue your current organic routine.' if is_healthy else 'Apply organic treatment and monitor closely.'}"
            ),
            "precautions": [
                "Maintain current watering schedule",
                "Apply vermicompost every 2 weeks",
                "Inspect leaves weekly for early signs",
                "Use mulching to retain moisture",
                "Rotate crops each season",
                "Ensure adequate plant spacing",
            ] if is_healthy else [
                "Isolate affected plants immediately",
                "Remove and destroy all infected leaves",
                "Avoid overhead watering — use drip irrigation",
                "Apply Neem oil spray (5ml/litre) every 3 days",
                "Dust affected areas with wood ash",
                "Improve air circulation by pruning dense foliage",
            ],
            "safety_measures": [
                "Wear gloves when handling plants",
                "Wash hands thoroughly with soap after field work",
                "Disinfect all tools with 70% alcohol solution",
                "Do not consume affected produce without clearance",
                "Keep children and animals away from treated areas for 24 hours",
            ],
            "is_organic_friendly": True,
            "confidence": round(yolo_confidence * 100, 1),
            "is_valid_plant": True,
        }

    # Path C: YOLO unavailable but Vision confirmed it's a plant — ask Groq Vision directly
    try:
        vision_diagnosis = await client.chat.completions.create(
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are a certified crop disease specialist. "
                            "This image has been verified to show a plant or leaf. "
                            "Analyze it carefully for any disease, pest damage, or nutrient deficiency. "
                            f"Farmer note: {user_query or 'General health check'}. "
                            "Respond ONLY with valid JSON (no markdown): "
                            '{"diagnosis": "Disease name or Healthy", "severity": "None/Low/Medium/High", '
                            '"advice": "3-4 sentence paragraph", "precautions": ["step1","step2","step3","step4","step5"], '
                            '"safety_measures": ["m1","m2","m3"], "is_organic_friendly": true}'
                        )
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                ],
            }],
            model=VISION_MODEL,
            max_tokens=1000,
            temperature=0.3,
        )
        content = vision_diagnosis.choices[0].message.content
        result = json.loads(_clean_json_response(content))
        result["confidence"] = 0
        result["is_valid_plant"] = True
        return result
    except Exception as e:
        logger.error(f"Vision fallback diagnosis error: {e}")

    return _mock_vision_analysis()


async def generate_voice_advice(text: str, voice_id: str = "pNInz6obpg8nEByWQX2t") -> Optional[bytes]:
    """Generates audio from text using ElevenLabs for multilingual support."""
    if not settings.ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not set.")
        return None

    headers = {
        "Accept": "audio/mpeg",
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }

    actual_voice_id = voice_id or DEFAULT_VOICE_ID
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{ELEVENLABS_URL}/{actual_voice_id}",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            if response.status_code == 200:
                return response.content
            else:
                logger.error(f"ElevenLabs Error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        logger.error(f"Voice generation exception: {e}")
        return None


async def analyze_periodic_report(image_data: bytes, report_text: str) -> dict:
    """
    Analyzes a peridoic report (3-day cycle) to detect:
    1. Abnormal growth patterns (suggesting chemical use).
    2. Verification of reported organic tasks.
    3. Health of the crops.
    """
    if not client:
        return {
            "is_valid": True,
            "abnormal_growth": False,
            "confidence": 0.5,
            "notes": "AI service offline. Provisionally approved."
        }

    base64_image = base64.b64encode(image_data).decode('utf-8')
    system_prompt = (
        "You are an Agricultural Auditor. Analyze the provided image of a crop and the farmer's report. "
        "Your goal is to detect if the growth looks UNNATURAL for its stage or if there are signs of chemical use "
        "(e.g., specific chemical burn patterns, unnatural deep colors but thin stems, or growth spikes "
        "inconsistent with organic methods). "
        "\n\nSTRICT JSON output format (PURE JSON ONLY, NO MARKDOWN WRAPPERS): "
        "{\"abnormal_growth\": boolean, \"organic_consistency_score\": 0-100, \"health_score\": 0-100, \"analysis_notes\": \"string\"}"
    )

    user_prompt = f"FARMER REPORT: {report_text}"
    
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }
            ],
            model=VISION_MODEL,
            max_tokens=800,
        )
        content = response.choices[0].message.content
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Periodic report AI analysis error: {e}")
        return {
            "abnormal_growth": False,
            "organic_consistency_score": 70,
            "health_score": 75,
            "analysis_notes": f"API Error: {str(e)}",
            "api_failure": True
        }


async def generate_personalized_missions(farm_profile: dict, weather: dict) -> List[dict]:
    """Generates 9 personalized missions (3 Daily, 3 Weekly, 3 Monthly) strictly based on farm data and climate."""
    if not client:
        return [
            # DAILY
            {"title": "Morning Crop Hydration", "description": "Water your crops early to avoid evaporation.", "difficulty": "easy", "reward_points": 10, "mission_type": "daily", "eco_benefit": "Reduces water waste.", "next_step": "Water the crop beds.", "personalization_tag": "For your irrigation type"},
            {"title": "Soil Moisture Check", "description": "Check soil moisture levels manually.", "difficulty": "easy", "reward_points": 15, "mission_type": "daily", "eco_benefit": "Prevents overwatering.", "next_step": "Check soil 2 inches deep.", "personalization_tag": "For your soil type"},
            {"title": "Pest Inspection Walk", "description": "Inspect leaf undersides for signs of pests.", "difficulty": "medium", "reward_points": 20, "mission_type": "daily", "eco_benefit": "Avoids chemical pesticides.", "next_step": "Inspect 5 plants.", "personalization_tag": "For your crops"},
            # WEEKLY
            {"title": "Weekly Organic Fertilizer Feed", "description": "Feed crops with rich organic compost.", "difficulty": "medium", "reward_points": 40, "mission_type": "weekly", "eco_benefit": "Increases soil microbiology.", "next_step": "Apply compost to beds.", "personalization_tag": "For your practices"},
            {"title": "Water Flow Audit", "description": "Audit your irrigation system for any leaks.", "difficulty": "medium", "reward_points": 35, "mission_type": "weekly", "eco_benefit": "Conserves groundwater.", "next_step": "Walk the entire pipe/hose line.", "personalization_tag": "For your irrigation type"},
            {"title": "Natural Weed Management", "description": "Clear weeds manually and lay organic mulch.", "difficulty": "medium", "reward_points": 50, "mission_type": "weekly", "eco_benefit": "Maintains soil temperature and humidity.", "next_step": "Mulch the weeded area.", "personalization_tag": "For your farm size"},
            # MONTHLY
            {"title": "Deep Soil Nourishment", "description": "Add Peat/Loam organic cover to boost soil nitrogen.", "difficulty": "hard", "reward_points": 100, "mission_type": "monthly", "eco_benefit": "Rebuilds depleted topsoil.", "next_step": "Cover entire target crop plot.", "personalization_tag": "For your soil type"},
            {"title": "Crop Rotation Planning", "description": "Plan your next seasonal crop rotation pattern.", "difficulty": "hard", "reward_points": 80, "mission_type": "monthly", "eco_benefit": "Prevents pest cycles naturally.", "next_step": "Submit your rotation map plan.", "personalization_tag": "For your crop types"},
            {"title": "Zero Chemical Milestone", "description": "Verify zero synthetic pesticide usage for 30 days.", "difficulty": "hard", "reward_points": 120, "mission_type": "monthly", "eco_benefit": "Restores biological balance.", "next_step": "Submit organic log records.", "personalization_tag": "For your practices"}
        ]

    system_prompt = (
        "You are the GOO AI Mission Architect. Your goal is to create exactly 9 HYPER-PERSONALIZED, high-impact organic farming missions "
        "(comprising exactly 3 daily, 3 weekly, and 3 monthly missions)."
        "\n\nYou MUST analyze and customize the tasks STRICTLY based on all the farmer's custom profile properties: "
        "\n- Crop types: Create tasks directly relevant to managing, watering, weeding, or harvesting these specific crops. Do not assign general or unrelated crops."
        "\n- Soil type: Recommend soil amendments, aeration, or nutrition specifically suited for this soil class (e.g. clay, sandy, loam)."
        "\n- Irrigation type: Design water-saving or irrigation audit tasks tailored for this system (e.g. drip, flood, rain-fed)."
        "\n- Fertilizer / Pesticide usage: Recommend organic swaps or compost applications if they are using chemical inputs."
        "\n- Farming practice: Align the mission with the farmer's chosen practice (organic, regenerative, conventional, permaculture, biodynamic, etc.)."
        "\n- Farm size: Set the scale of tasks (e.g. smaller container tasks for micro-farms, larger grid management for large acreage)."
        "\n- Current Weather: Adapt to local precipitation, temperature, and wind levels (e.g. rainwater storage tasks if raining, mulching/shade tasks if dry/hot)."
        "\nMake the 'title' catchy and the 'description' scientific yet simple. "
        "\n\nSTRICT JSON output format (PURE JSON WRAPPED IN OBJECT ONLY): "
        "{\"missions\": [{"
        "  \"title\": \"string\", "
        "  \"description\": \"string\", "
        "  \"mission_type\": \"daily/weekly/monthly\", "
        "  \"difficulty\": \"easy/medium/hard\", "
        "  \"reward_points\": int, "
        "  \"eco_benefit\": \"string (What it does for environment)\", "
        "  \"next_step\": \"string (Single actionable next step)\", "
        "  \"personalization_tag\": \"string (e.g. 'For your black soil growing wheat in hot dry weather')\""
        "}]}"
    )

    user_context = f"FARM PROFILE: {json.dumps(farm_profile, cls=MongoJSONEncoder)}. WEATHER: {json.dumps(weather, cls=MongoJSONEncoder)}"
    
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_context}
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        content = response.choices[0].message.content
        data = json.loads(_clean_json_response(content))
        
        # Format for backend
        missions = data.get("missions", [])
        return missions
    except Exception as e:
        logger.error(f"AI Mission Generation Error: {e}")
        return []


async def analyze_farming_proof(image_data: bytes, mission_text: str, system_prompt: Optional[str] = None) -> dict:
    """
    Analyzes local proof (mission completion photo) against the mission description.
    Returns: {"is_valid": bool, "confidence": float, "analysis_notes": str}
    """
    if not client:
        return {
            "is_valid": True,
            "confidence": 0.5,
            "analysis_notes": "AI offline. Manual review fallback."
        }

    user_prompt = f"MISSION TO VERIFY: {mission_text}"
    final_system_prompt = system_prompt if system_prompt else (
        "You are an ELITE Agricultural Forensic Auditor. Your mission is to verify farming activity with 100% certainty. "
        "A user has submitted a photo/video frame as proof for a specific farming task. "
        "\n\nDETECTION PRIORITIES:"
        "\n1. REJECT placeholder images, pure black/white screens, indoor living rooms, selfies, and internet memes immediately."
        "\n2. AUDIT for task-specific objects: "
        "   - Watering -> Visible water/damp soil/hoses."
        "   - Planting -> Seeds/saplings/soil disturbance."
        "   - Weeding -> Pile of weeds/hand in soil/tools."
        "\n3. REJECT if the image is too blurry to identify the task."
        "\n4. If the photo is real but UNRELATED to the specific mission text -> REJECT."
        "\n\nSTRICT JSON output format (PURE JSON ONLY): "
        "{\"is_valid\": boolean, \"confidence\": 0.0-1.0, \"analysis_notes\": \"Detailed reason for audit decision\"}"
    )

    base64_image = base64.b64encode(image_data).decode('utf-8')
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": final_system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }
            ],
            model=VISION_MODEL,
            max_tokens=800,  # Required by Groq Vision
            temperature=0.2
        )
        content = response.choices[0].message.content
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Proof analysis error: {e}")
        return {
            "is_valid": False,  # Changed to False so it strictly rejects on API failure
            "confidence": 0.0,
            "analysis_notes": f"API Error: {str(e)}. Please try again."
        }


# ─── MOCK RESPONSES ───────────────────────────────────────────

def _mock_advice(error_msg: Optional[str] = None):
    response = "Hello! I'm GOO Advisor. Could you please share your farm size and soil type so I can help you better?"
    if error_msg:
        response = f"I'm having a bit of trouble reaching my knowledge base ({error_msg}). But I'm still here to help! {response}"
    return {
        "response": response,
        "suggestions": ["Tell farm size", "Share soil type"],
        "detected_intent": "onboarding",
        "audio_trigger": False
    }


def _mock_vision_analysis():
    return {
        "diagnosis": "General Health Check",
        "severity": "Low",
        "advice": "The crops appear healthy. Maintain your current organic routine and monitor for early signs of stress such as yellowing leaves, wilting, or unusual spots.",
        "precautions": [
            "Avoid overwatering — check soil moisture before each irrigation",
            "Apply compost or vermicompost every 2 weeks for nutrient balance",
            "Inspect the underside of leaves weekly for early pest detection",
            "Rotate crops each season to prevent soil-borne disease buildup",
            "Use mulching to retain moisture and suppress weeds naturally"
        ],
        "safety_measures": [
            "Wear gloves when weeding or handling soil",
            "Wash all produce thoroughly before consumption",
            "Avoid working in the field during peak heat hours (11am–3pm)",
            "Store organic sprays in cool, labelled containers away from children"
        ],
        "is_organic_friendly": True,
        "confidence": 0,
        "is_valid_plant": True
    }


def _error_analysis(message: str):
    return {
        "diagnosis": "Image Error",
        "severity": "None",
        "advice": message,
        "precautions": [],
        "safety_measures": [],
        "is_organic_friendly": True,
        "confidence": 0,
        "is_valid_plant": False
    }
