import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./app/providers/AuthProvider.jsx";
import { QuizProvider } from "./app/providers/QuizProvider.jsx";

// Fire a silent keep-alive ping to the backend the moment the app loads.
// Render.com free tier sleeps after 15 min of inactivity — this pre-warms
// the server so it's ready by the time the user navigates to the dashboard.
// Errors are silently swallowed — a sleeping server must never block the UI.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:5000/api"
    : "https://subbhiquiz.onrender.com/api");

fetch(`${API_URL}/health`, { method: "GET" }).catch(() => {
  // Server is starting up — user will benefit from it being warm when they
  // hit the dashboard. We intentionally ignore any error here.
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <QuizProvider>
        <App />
      </QuizProvider>
    </AuthProvider>
  </StrictMode>,
);

