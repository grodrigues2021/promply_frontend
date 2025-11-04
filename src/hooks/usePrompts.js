import { useEffect, useState } from "react";
import api from "../lib/api";




export default function usePrompts() {
  const [sharedPrompts, setSharedPrompts] = useState([]);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await api.get("/prompts/shared");
        setSharedPrompts(res.data.prompts || []);
      } catch (err) {
        console.error("❌ Erro ao carregar prompts compartilhados:", err);
      }
    };
    fetchPrompts();
  }, []);

  return { sharedPrompts };
}
