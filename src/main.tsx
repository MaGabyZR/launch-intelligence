import { StrictMode, Component, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 40,
            fontFamily: "monospace",
            color: "#f87171",
            background: "#0a0a0a",
            minHeight: "100vh",
          }}
        >
          <h2 style={{ color: "#f87171" }}>Runtime Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
            {(this.state.error as Error).message}
          </pre>
          <pre
            style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#6b7280" }}
          >
            {(this.state.error as Error).stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: "8px 16px",
              background: "#1f1f1f",
              color: "#e5e7eb",
              border: "1px solid #374151",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

ReactDOM.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
  document.getElementById("root"),
);
