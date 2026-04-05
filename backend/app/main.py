from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware # to connect frontend with backend
from app.firebase import db, bucket
from app.models.study_session import StudySessionCreate
from app.services.text_extraction import extact_text_from_pdf_bytes
from datetime import datetime, timezone
import uuid
from app.services.generator import generate_study_content

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Adaptive Brain backend is running"}


@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read() #read file contents
    
    # unique filename 
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    blob = bucket.blob(f"uploads/{unique_filename}") # creates location in storage

    blob.upload_from_string(contents, content_type=file.content_type) # uploads file in storage
    
    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "file_path": blob.name
    }



# post: run the function below; send data to server
@app.post("/study-sessions")
def create_study_session(session: StudySessionCreate):

    # check if file_path exists
    if session.file_path:
        blob = bucket.blob(session.file_path) # looks for a file at this path

        if not blob.exists():
            raise HTTPException(
                status_code=400,
                detail=f"File path does not exist in Firebase Storage: {session.file_path}"
            )

    # create a new document with auto id
    doc_ref = db.collection("study_sessions").document()

    doc_ref.set({
        "user_id": session.user_id,
        "original_text": session.original_text,
        "selected_mode": session.selected_mode,
        "preferred_outputs": session.preferred_outputs,
        "file_path": session.file_path,
        "status": "uploaded" if session.file_path else "created",
        "created_at": datetime.now(timezone.utc).isoformat(),

        # generated text fields
        "extracted_text": "",
        "generated_summary": "",
        "generated_flashcards": "",
        "generated_quiz": "",

        "status": "uploaded" if session.file_path else "created",
    })
    
    return {
        "message": "Study session created",
        "session_id": doc_ref.id
    }

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    extracted_text = extact_text_from_pdf_bytes(contents)

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF."
        )
    
    return{
        "filename": file.filename,
        "extracted_text": extracted_text
    }

# to extract text
@app.post("/study-sessions/{session_id}/extract")
async def extract_and_save_text(session_id: str, file: UploadFile = File(...)):

    #  check sessoion exists
    doc_ref = db.collection("study_sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
         raise HTTPException(status_code=404, detail="Study session not found.")
    
    # check uploaded file is a pdf
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # read file and extract text
    contents = await file.read()
    extracted_text = extact_text_from_pdf_bytes(contents)

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF."
        )
    
    # update study session in firestore
    doc_ref.update({
        "extracted_text": extracted_text,
        "status": "text_extracted",
    })

    return{
        "message": "Text extracted and saved successfully",
        "session_id": session_id,
        "extracted_text": extracted_text
    }


@app.post("/study-sessions/{session_id}/generate")
def generate_content(session_id: str):
    doc_ref = db.collection("study_sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Study session not found.")

    session_data = doc.to_dict()
    text = session_data.get("extracted_text") or session_data.get("original_text", "")

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text available. Extract text or provide original_text first."
        )

    mode = session_data.get("selected_mode", "default")
    preferred_outputs = session_data.get("preferred_outputs", [])

    try:
        generated = generate_study_content(text, mode, preferred_outputs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    doc_ref.update({
        "generated_summary": generated.get("summary", ""),
        "generated_flashcards": generated.get("flashcards", []),
        "generated_quiz": generated.get("quiz", []),
        "generated_simplified_text": generated.get("simplified_text", ""),
        "status": "generated",
        "updated_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "message": "Study content generated successfully",
        "session_id": session_id,
        "generated_content": generated
    }

# fetch study session for frontend
@app.get("/study-sessions/{session_id}")
def get_study_session(session_id: str):
    doc = db.collection("study_sessions").document(session_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Study session not found.")

    return {
        "session_id": session_id,
        "data": doc.to_dict()
    }



# @app.get("/test-firestore")
# def test_firestore():
#     doc_ref = db.collection("test").document("connection")
#     doc_ref.set({"status": "connected"})
#     return {"message": "Firestore connected successfully"}