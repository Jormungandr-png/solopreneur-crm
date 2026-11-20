import json
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

URGENT_KEYWORDS = [
    "cancel", "refund", "stop", "quit", "pause", "expensive", "not working",
    "frustrated", "overwhelmed", "billing", "charged", "leaving", "disappointed",
]
POSITIVE_KEYWORDS = [
    "thanks", "thank you", "awesome", "great", "loving", "progress", "pr",
    "ranked up", "hit my goal", "excited", "helpful",
]
QUESTION_KEYWORDS = ["?", "how do", "when is", "can we", "reschedule", "link"]


def _fallback_score(msg: Dict[str, Any]) -> Dict[str, Any]:
    text = msg["body"].lower()
    urgent_hits = sum(1 for kw in URGENT_KEYWORDS if kw in text)
    pos_hits = sum(1 for kw in POSITIVE_KEYWORDS if kw in text)
    q_hits = sum(1 for kw in QUESTION_KEYWORDS if kw in text)
    first_name = msg["sender_name"].split()[0]

    if urgent_hits > 0:
        return {
            "urgency": "urgent",
            "urgency_score": min(100, 75 + urgent_hits * 10),
            "sentiment": "negative",
            "suggested_reply": (
                f"Hey {first_name}, thanks for being upfront with me. "
                "Let's hop on a quick 10-minute reset call this week to adjust your plan "
                "so it fits your schedule—I'll also add 150 bonus reward points to your account."
            ),
        }
    if q_hits > 0 and pos_hits == 0:
        return {
            "urgency": "medium",
            "urgency_score": 55,
            "sentiment": "neutral",
            "suggested_reply": (
                f"Hey {first_name}, great question! "
                "I'm checking your latest log now and will send over the updated details shortly."
            ),
        }
    return {
        "urgency": "low",
        "urgency_score": 20,
        "sentiment": "positive" if pos_hits > 0 else "neutral",
        "suggested_reply": (
            f"Awesome work {first_name}! "
            "Love seeing this momentum—I just logged +50 streak points for your consistency."
        ),
    }


def _score_with_groq(msg: Dict[str, Any]) -> Dict[str, Any]:
    if not groq_client:
        return _fallback_score(msg)

    prompt = f"""You are an AI retention assistant for a solo online coach (fitness, gaming, or creator coaching).
Analyze the client message below and return ONLY valid JSON with these exact keys:
- "urgency": one of "urgent", "medium", "low"
- "urgency_score": integer from 1 to 100 (higher = more urgent/churn risk)
- "sentiment": one of "negative", "neutral", "positive"
- "suggested_reply": a warm, concise 2-sentence reply from the coach directly addressing the client's message (if urgent/churn-risk, offer a quick reset call or bonus reward points; if positive, celebrate and reinforce momentum).

Client Name: {msg["sender_name"]}
Channel: {msg.get("channel", "instagram_dm")}
Message: {msg["body"]}"""

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Return strictly valid JSON matching the requested schema."},
                {"role": "user", "content": prompt},
            ],
        )
        parsed = json.loads(completion.choices[0].message.content or "{}")

        urgency = parsed.get("urgency", "medium")
        if urgency not in ("urgent", "medium", "low"):
            urgency = "medium"

        sentiment = parsed.get("sentiment", "neutral")
        if sentiment not in ("negative", "neutral", "positive"):
            sentiment = "neutral"

        score = int(parsed.get("urgency_score", 50))
        score = max(1, min(100, score))

        reply = str(parsed.get("suggested_reply", "")).strip()
        if not reply:
            return _fallback_score(msg)

        return {
            "urgency": urgency,
            "urgency_score": score,
            "sentiment": sentiment,
            "suggested_reply": reply,
        }
    except Exception as exc:
        print(f"[Groq fallback triggered] {exc}")
        return _fallback_score(msg)


def prioritize_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    scored = []
    for msg in messages:
        analysis = _score_with_groq(msg)
        scored.append(
            {
                "sender_name": msg["sender_name"],
                "channel": msg.get("channel", "instagram_dm"),
                "body": msg["body"],
                **analysis,
            }
        )

    scored.sort(key=lambda item: item["urgency_score"], reverse=True)
    return scored