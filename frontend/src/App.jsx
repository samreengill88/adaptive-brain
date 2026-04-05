import { useState } from "react";
import {
  createStudySession,
  uploadFile,
  extractTextFromSession,
  generateStudyContent,
  getStudySession,
} from "./services/api";

function App() {
  const [text, setText] = useState("");
  const [selectedMode, setSelectedMode] = useState("simplified");
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      let filePath = null;

      // Step 1: upload file if there is one
      if (file) {
        const uploadResponse = await uploadFile(file);
        filePath = uploadResponse.file_path;
      }

      // Step 2: create study session
      const sessionResponse = await createStudySession({
        user_id: "user_123",
        original_text: text,
        selected_mode: selectedMode,
        preferred_outputs: ["summary", "flashcards", "quiz"],
        file_path: filePath,
      });

      const newSessionId = sessionResponse.session_id;
      setSessionId(newSessionId);

      // Step 3: if PDF uploaded, extract text into that session
      if (file) {
        await extractTextFromSession(newSessionId, file);
      }

      // Step 4: generate content
      await generateStudyContent(newSessionId);

      // Step 5: fetch full session data
      const fullSession = await getStudySession(newSessionId);
      setResult(fullSession.data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Adaptive Brain</h1>
      <p>Upload notes or paste text to generate personalized study material.</p>

      <div style={{ marginBottom: "16px" }}>
        <label>Paste Notes</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: "10px", marginTop: "8px" }}
          placeholder="Paste your notes here..."
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Select Mode</label>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          style={{ display: "block", marginTop: "8px", padding: "8px" }}
        >
          <option value="simplified">Simplified</option>
          <option value="focus">Focus</option>
          <option value="memory">Memory</option>
          <option value="exam_cram">Exam Cram</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Upload PDF</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: "block", marginTop: "8px" }}
        />
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Generating..." : "Generate Study Content"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "16px" }}>
          {error}
        </p>
      )}

      {sessionId && (
        <p style={{ marginTop: "16px" }}>
          Session ID: {sessionId}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "32px" }}>
          <h2>Summary</h2>
          <p>{result.generated_summary}</p>

          <h2>Simplified Text</h2>
          <p>{result.generated_simplified_text}</p>

          <h2>Flashcards</h2>
          <ul>
            {result.generated_flashcards?.map((card, index) => (
              <li key={index}>
                <strong>Q:</strong> {card.question} <br />
                <strong>A:</strong> {card.answer}
              </li>
            ))}
          </ul>

          <h2>Quiz</h2>
          <ul>
            {result.generated_quiz?.map((q, index) => (
              <li key={index}>
                <strong>Q:</strong> {q.question} <br />
                <strong>A:</strong> {q.answer}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;