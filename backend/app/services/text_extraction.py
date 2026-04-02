from pypdf import PdfReader
import tempfile
import os 


def extact_text_from_pdf_bytes(file_bytes: bytes) -> str:
    
    # create a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(file_bytes)
        temp_path = temp_file.name
    
    # read pdf
    try:
        reader = PdfReader(temp_path)
        extracted_text = []

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text: # avoid empty pages
                extracted_text.append(page_text)

        return "\n".join(extracted_text).strip() # combine pages
    finally:
        os.remove(temp_path)