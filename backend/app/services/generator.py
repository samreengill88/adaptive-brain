def generate_study_content(text: str, mode: str, preferred_outputs: list[str]) -> dict:
    short_text = text[:300] if text else ""

    return {
        "summary": f"This is a summary of the content: {short_text}",
        "flashcards": [
            {
                "question": "What is the main topic of the text?",
                "answer": short_text[:100] if short_text else "No content available"
            },
            {
                "question": "Why is this topic important?",
                "answer": "It helps the student understand the key concept."
            }
        ],
        "quiz": [
            {
                "question": "What is the main idea discussed in the material?",
                "answer": "The main concept from the extracted text."
            },
            {
                "question": "Which study mode was selected?",
                "answer": mode
            }
        ],
        "simplified_text": f"This is a simpler version: {short_text}"
    }