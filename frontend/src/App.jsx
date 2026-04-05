import { useState } from "react";
import "./App.css";
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
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      setError("Please paste notes or upload a PDF.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setSessionId("");
      setStatusMessage("Starting...");

      let filePath = null;

      if (file) {
        setStatusMessage("Uploading file...");
        const uploadResponse = await uploadFile(file);
        filePath = uploadResponse.file_path;
      }

      setStatusMessage("Creating study session...");
      const sessionResponse = await createStudySession({
        user_id: "user_123",
        original_text: text,
        selected_mode: selectedMode,
        preferred_outputs: ["summary", "flashcards", "quiz"],
        file_path: filePath,
      });

      const newSessionId = sessionResponse.session_id;
      setSessionId(newSessionId);

      if (file) {
        setStatusMessage("Extracting text from PDF...");
        await extractTextFromSession(newSessionId, file);
      }

      setStatusMessage("Generating study content...");
      await generateStudyContent(newSessionId);

      setStatusMessage("Fetching results...");
      const fullSession = await getStudySession(newSessionId);
      setResult(fullSession.data);

      setStatusMessage("Done!");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Adaptive Brain</h1>
      <p className="app-subtitle">
        Upload notes or paste text to generate personalized study material.
      </p>

      <div className="form-card">
        <div className="form-group">
          <label className="form-label">Paste Notes</label>
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your notes here..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Select Study Mode</label>
          <select
            className="select"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            disabled={loading}
          >
            <option value="simplified">Simplified</option>
            <option value="focus">Focus</option>
            <option value="memory">Memory</option>
            <option value="exam_cram">Exam Cram</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Upload PDF</label>
          <input
            className="file-input"
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading}
          />
        </div>

        <button
          className="generate-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Study Content"}
        </button>

        {statusMessage && <p className="status-text">{statusMessage}</p>}
        {/* {sessionId && (
          // <div className="success-message">Session ID: {sessionId}</div>
        )} */}
        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="results-grid">
          <div className="result-card">
            <h2 className="result-title">Summary</h2>
            <p className="result-text">{result.generated_summary}</p>
          </div>

          <div className="result-card">
            <h2 className="result-title">Simplified Text</h2>
            <p className="result-text">{result.generated_simplified_text}</p>
          </div>

          <div className="result-card">
            <h2 className="result-title">Flashcards</h2>
            {result.generated_flashcards?.length ? (
              result.generated_flashcards.map((card, index) => (
                <div className="list-item" key={index}>
                  <div className="list-question">Q: {card.question}</div>
                  <div>A: {card.answer}</div>
                </div>
              ))
            ) : (
              <p>No flashcards available.</p>
            )}
          </div>

          <div className="result-card">
            <h2 className="result-title">Quiz</h2>
            {result.generated_quiz?.length ? (
              result.generated_quiz.map((item, index) => (
                <div className="list-item" key={index}>
                  <div className="list-question">Q: {item.question}</div>
                  <div>A: {item.answer}</div>
                </div>
              ))
            ) : (
              <p>No quiz available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;