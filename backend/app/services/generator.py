import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_study_content(text: str, mode: str, preferred_outputs: list[str]) -> dict:
    if not text or not text.strip():
        raise ValueError("Input text is empty.")

    prompt = f"""
You are an educational assistant.

The student selected study mode: {mode}.

Read the study material below and return a JSON object with exactly these keys:
- summary
- simplified_text
- flashcards
- quiz

Rules:
- summary: a concise but useful study summary
- simplified_text: explain the content in simpler language for a student
- flashcards: an array of 3 objects, each with "question" and "answer"
- quiz: an array of 3 objects, each with "question" and "answer"
- Return valid JSON only
- Do not include markdown
- Keep the content faithful to the input text

Study material:
{text[:6000]}
"""

    response = client.responses.create(
        model="gpt-5.4-mini",
        input=prompt
    )

    raw_output = response.output_text
    parsed = json.loads(raw_output)

    return {
        "summary": parsed.get("summary", ""),
        "simplified_text": parsed.get("simplified_text", ""),
        "flashcards": parsed.get("flashcards", []),
        "quiz": parsed.get("quiz", []),
    }