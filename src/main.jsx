// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { Toaster } from "sonner";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/react-query-client";

const hostname = window.location.hostname;
const envVar = import.meta.env.VITE_SHOW_QUERY_DEVTOOLS;
const isStaging = hostname.includes("staging");

console.log("=== REACT QUERY DEVTOOLS DEBUG ===");
console.log("🌐 Hostname atual:", hostname);
console.log("📦 VITE_SHOW_QUERY_DEVTOOLS:", envVar);
console.log("🎯 Inclui 'staging'?", isStaging);
console.log("✅ DevTools ativo?", envVar === 'true' || isStaging);
console.log("==================================");

const showDevtools = envVar === 'true' || isStaging;

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

    {/* ✅ SOLUÇÃO: Sempre renderize o DevTools fora de condicionais */}
    {showDevtools && (
      <div 
        style={{ 
          position: 'fixed',
          bottom: 0,
          right: 0,
          zIndex: 999999,
        }}
      >
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="bottom"
          styleNonce={undefined}
          toggleButtonProps={{
            style: {
              position: 'fixed',
              bottom: '10px',
              right: '10px',
              zIndex: 999999,
              opacity: 1,
            }
          }}
        />
      </div>
    )}
  </QueryClientProvider>
);