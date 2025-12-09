import { useState, useEffect } from "react";
import { Menu, Download } from 'lucide-react'; // 引入图标
import { useChatStore } from "./store/chatStore";
import { MessageBubble } from "./components/Chat/MessageBubble";
import { BubbleInserter } from "./components/Chat/BubbleInserter";
import { ControlBar } from "./components/Layout/ControlBar";
import { Sidebar } from "./components/Layout/Sidebar";

function App() {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    addMessage, 
    updateMessage,
    deleteMessage 
  } = useChatStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 暂时留个占位状态

  // 初始化检查
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!currentSessionId && Object.keys(sessions).length === 0) {
            createSession("New Chat");
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentSessionId, sessions, createSession]);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const messages = currentSession?.messages || [];

  // 🟢 单个会话导出逻辑 (占位)
  const handleExportSingle = () => {
    if (!currentSession) return;
    const dataStr = JSON.stringify(currentSession, null, 2);
    // 这里简单弹个窗示意，后续实现下载文件
    alert("Export Feature Ready!\nData ready for download."); 
    console.log(dataStr);
  };

  // 🟢 打开设置 (占位)
  const handleOpenSettings = () => {
    // setIsSettingsOpen(true);
    alert("Global Settings & Full Export \n(Coming in Next Step)");
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      
      {/* 1. 左侧 Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={handleOpenSettings}
      />

      {/* 2. 右侧主区域 */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* 手机端汉堡菜单 */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            
            <div className="flex flex-col">
              <h1 className="font-bold text-gray-700 truncate max-w-[200px] sm:max-w-md">
                {currentSession?.title || "Workbench"}
              </h1>
              <span className="text-xs text-gray-400">
                {messages.length} messages
              </span>
            </div>
          </div>

          {/* 右侧工具栏：导出单会话 */}
          <div className="flex gap-2">
            <button 
              onClick={handleExportSingle}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              title="Export this chat (JSON)"
            >
              <Download size={18} />
            </button>
          </div>
        </header>

        {/* 聊天内容区 */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth">
          {/* 只有当有会话时才显示内容 */}
          {currentSession ? (
            <>
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
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select or create a chat to begin
            </div>
          )}
        </main>

        {/* 底部控制栏 */}
        <ControlBar />
        
      </div>

      {/* 3. 设置弹窗 (Settings Modal) 将在这里渲染 */}
      {/* {isSettingsOpen && <SettingsModal ... />} */}
    </div>
  );
}

export default App;