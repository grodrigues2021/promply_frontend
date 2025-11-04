import React from "react";
import PromptCard from "./PromptCard";
import usePrompts from "../hooks/usePrompts";

export default function SharedPromptsSidebar() {
  const { sharedPrompts } = usePrompts();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3 text-purple-600">
        Prompts Compartilhados
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Prompts públicos da comunidade
      </p>

      <div className="space-y-3">
        {sharedPrompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} compact />
        ))}
      </div>
    </div>
  );
}
