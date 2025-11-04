import React, { useEffect } from "react";
import ChatFeed from "./ChatFeed";
import ChatInput from "./ChatInput";
import SharedPromptsSidebar from "./SharedPromptsSidebar"; // substitua se o nome do seu arquivo for diferente

export default function ChatCommunity() {
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#f7f7f7";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* 🟢 Chat principal */}
      <div className="flex flex-col flex-1 h-full">
        <ChatFeed />
        <ChatInput />
      </div>

      {/* 🟣 Sidebar de prompts compartilhados */}
      <div className="w-[400px] border-l border-gray-200 bg-white overflow-y-auto">
        <SharedPromptsSidebar />
      </div>
    </div>
  );
}
