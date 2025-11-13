// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { Toaster } from "sonner";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query-client";

// ✅ Para staging: use o import de produção
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/production";

const showDevtools =
  import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === 'true' ||
  window.location.hostname.includes("staging");

console.log("🔍 ReactQueryDevtools ativo?", showDevtools);

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
          className: "my-toast",
          duration: 2000,
        }}
      />
    </AuthProvider>

    {/* ✅ DevTools com import de produção */}
    {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);