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

// CORREÇÃO: Lê a variável de ambiente do Vite.
// Variáveis de ambiente são sempre strings, por isso comparamos com 'true'.
const showDevtools = import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === 'true';

console.log("🔍 ReactQueryDevtools deve estar ativo?", showDevtools);


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

    {/* DevTools serão exibidos se a variável de ambiente for 'true' */}
    {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
