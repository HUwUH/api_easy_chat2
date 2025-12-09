import { useEffect, useState } from "react";
import { useChatStore } from "./store/chatStore";

function App() {
  // 从 Store 中提取状态和方法
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    addMessage, 
    updateMessage,
    deleteMessage 
  } = useChatStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  // 初始化：如果没有会话，创建一个
  useEffect(() => {
    // 稍微延迟一下等待 IndexedDB 读取
    const timer = setTimeout(() => {
        setHasInitialized(true);
        if (!currentSessionId && Object.keys(sessions).length === 0) {
            createSession("默认会话");
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentSessionId, sessions, createSession]);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  if (!hasInitialized) return <div className="p-10">Loading Storage...</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto font-mono">
      <h1 className="text-2xl font-bold mb-4 border-b pb-2">Phase 2: Memory Test</h1>
      
      {/* 状态展示区 */}
      <div className="mb-6 bg-gray-100 p-4 rounded text-sm">
        <p>Current Session ID: {currentSessionId || "None"}</p>
        <p>Total Messages: {currentSession?.messages.length || 0}</p>
      </div>

      {/* 1. 操作区 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button 
          onClick={() => createSession(`Session ${Date.now()}`)}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          New Session
        </button>
        
        <button 
          onClick={() => addMessage({ role: 'user', content: 'User Hello' })}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add User
        </button>

        <button 
          onClick={() => addMessage({ role: 'assistant', content: 'AI Reply' })}
          className="px-3 py-1 bg-purple-600 text-white rounded"
        >
          + Add AI
        </button>

        <button 
          onClick={() => addMessage({ role: 'system', content: 'System Note', index: 0 })}
          className="px-3 py-1 bg-gray-600 text-white rounded"
        >
          + Insert System at Top
        </button>
      </div>

      {/* 2. 数据可视化区 (模拟气泡列表) */}
      <div className="space-y-4">
        {currentSession?.messages.map((msg, index) => (
          <div key={msg.id} className="border p-3 rounded shadow-sm flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-500 uppercase font-bold">
              <span>{index}. {msg.role}</span>
              <span>ID: {msg.id.slice(0, 8)}...</span>
            </div>
            
            {/* 内容编辑测试 */}
            <textarea 
              className="w-full border p-2 rounded"
              value={msg.content}
              onChange={(e) => updateMessage(msg.id, { content: e.target.value })}
            />

            {/* 角色切换测试 */}
            <div className="flex gap-2 text-xs">
              <button onClick={() => updateMessage(msg.id, { role: 'user' })} className="text-blue-500">[To User]</button>
              <button onClick={() => updateMessage(msg.id, { role: 'assistant' })} className="text-purple-500">[To AI]</button>
              <button onClick={() => updateMessage(msg.id, { role: 'note' })} className="text-yellow-600">[To Note]</button>
              <button onClick={() => deleteMessage(msg.id)} className="text-red-500 ml-auto">[Delete]</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;