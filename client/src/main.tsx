import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Failed to render app:", error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; text-align: center;">
        <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #a1a1aa; max-width: 500px;">Failed to load the application. Please try restarting.</p>
        <pre style="background: #1f1f23; padding: 16px; border-radius: 8px; margin-top: 16px; max-width: 90%; overflow: auto; font-size: 12px; color: #fafafa;">${error}</pre>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}
