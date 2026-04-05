
// backend server address
const API_BASE_URL = "http://127.0.0.1:8000";


/**
 * 
 * @returns The created study session data.
 *  
 */
export async function createStudySession(payload) {
  const response = await fetch(`${API_BASE_URL}/study-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create study session");
  }

  return response.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}

export async function extractTextFromSession(sessionId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/study-sessions/${sessionId}/extract`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to extract text");
  }

  return response.json();
}

export async function generateStudyContent(sessionId) {
  const response = await fetch(`${API_BASE_URL}/study-sessions/${sessionId}/generate`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to generate study content");
  }

  return response.json();
}

export async function getStudySession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/study-sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch study session");
  }

  return response.json();
}