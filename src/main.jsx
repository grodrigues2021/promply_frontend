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

// 🔍 Debug completo
const hostname = window.location.hostname;
const envVar = import.meta.env.VITE_SHOW_QUERY_DEVTOOLS;
const isStaging = hostname.includes("staging");

console.log("=== REACT QUERY DEVTOOLS DEBUG ===");
console.log("🌐 Hostname atual:", hostname);
console.log("📦 VITE_SHOW_QUERY_DEVTOOLS:", envVar);
console.log("🎯 Inclui 'staging'?", isStaging);
console.log("✅ DevTools ativo?", envVar === 'true' || isStaging);
console.log("==================================");

// Mostra DevTools se NÃO for produção
const isProduction = hostname.includes("meuapp.com"); // substitua pelo seu domínio de produção
const showDevtools = !isProduction;

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

    {/* 🔥 DevTools com mais debug */}
    {showDevtools ? (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: 'green',
          color: 'white',
          padding: '4px 8px',
          fontSize: '12px',
          zIndex: 999999
        }}>
          DevTools ATIVO ✓
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </>
    ) : (
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        background: 'red',
        color: 'white',
        padding: '4px 8px',
        fontSize: '12px',
        zIndex: 999999
      }}>
        DevTools INATIVO ✗
      </div>
    )}
  </QueryClientProvider>
);