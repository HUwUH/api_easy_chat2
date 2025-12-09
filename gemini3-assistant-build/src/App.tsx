// src/App.tsx
import { useEffect } from "react";
import { useChatStore } from "./store/chatStore";
import { MessageBubble } from "./components/Chat/MessageBubble";
import { BubbleInserter } from "./components/Chat/BubbleInserter";

function App() {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    addMessage, 
    updateMessage,
    deleteMessage 
  } = useChatStore();

  useEffect(() => {
    const timer = setTimeout(() => {
        if (!currentSessionId && Object.keys(sessions).length === 0) {
            createSession("New Chat");
            addMessage({ role: 'system', content: 'You are a helpful AI assistant.', index: 0 });
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentSessionId, sessions, createSession, addMessage]);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const messages = currentSession?.messages || [];

  // 🔴 移除了所有 scrollIntoView 相关的 useEffect 和 ref

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white border-b p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="font-bold text-gray-700">Workbench</h1>
        <div className="text-xs text-gray-400">
            {messages.length} messages
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl p-4 overflow-y-auto pb-32">
        <BubbleInserter 
            onInsert={(role) => addMessage({ role, index: 0 })} 
            className="mb-4"
        />

        {messages.map((msg, index) => (
          <div key={msg.id}>
            <MessageBubble 
              message={msg}
              onUpdate={(id, content) => updateMessage(id, { content })}
              onRoleChange={(id, role) => updateMessage(id, { role })}
              onDelete={(id) => deleteMessage(id)}
            />
            <BubbleInserter 
                onInsert={(role) => addMessage({ role, index: index + 1 })} 
            />
          </div>
        ))}
        
        {/* 🔴 移除了底部的 <div ref={bottomRef} /> */}
      </main>

      <footer className="fixed bottom-0 w-full bg-white border-t p-4 text-center text-gray-400 text-sm z-50">
        [Control Bar Coming Soon in Phase 4]
      </footer>
    </div>
  );
}

export default App;