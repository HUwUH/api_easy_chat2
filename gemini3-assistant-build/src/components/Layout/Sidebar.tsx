import { MessageSquare, Plus, Trash2, Settings, X, Edit2, Copy } from 'lucide-react'; // 🟢 引入 Copy 图标
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    switchSession, 
    deleteSession,
    renameSession,
    duplicateSession // 🟢 引入
  } = useChatStore();

  const sortedSessions = Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreate = () => {
    createSession();
    if (window.innerWidth < 768) onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${title}"?`)) {
      deleteSession(id);
    }
  };

  const handleRename = (e: React.MouseEvent, id: string, oldTitle: string) => {
    e.stopPropagation();
    const newTitle = prompt("Enter new chat title:", oldTitle);
    if (newTitle && newTitle.trim()) {
      renameSession(id, newTitle.trim());
    }
  };

  // 🟢 处理复制
  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateSession(id);
    if (window.innerWidth < 768) onClose(); // 手机端复制后自动关闭侧边栏回到主界面
  };

  return (
    <>
      <div 
        className={cn("fixed inset-0 bg-black/50 z-[60] md:hidden", isOpen ? "block" : "hidden")}
        onClick={onClose}
      />

      <aside className={cn(
        "fixed md:relative z-[60] w-64 h-full bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <button 
            onClick={handleCreate}
            className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={18} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
          <button onClick={onClose} className="md:hidden ml-2 p-2 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                switchSession(session.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm",
                currentSessionId === session.id 
                  ? "bg-gray-800 text-white" 
                  : "hover:bg-gray-800/50"
              )}
            >
              <MessageSquare size={16} className="shrink-0" />
              
              <div className="flex-1 truncate">
                {session.title || "Untitled Chat"}
              </div>

              <div className={cn(
                  "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                  currentSessionId === session.id && "opacity-100"
              )}>
                <button
                  onClick={(e) => handleRename(e, session.id, session.title)}
                  className="p-1 hover:text-blue-400"
                  title="Rename"
                >
                  <Edit2 size={12} />
                </button>
                
                {/* 🟢 复制按钮 */}
                <button
                  onClick={(e) => handleDuplicate(e, session.id)}
                  className="p-1 hover:text-green-400"
                  title="Duplicate Chat"
                >
                  <Copy size={12} />
                </button>

                <button
                  onClick={(e) => handleDelete(e, session.id, session.title)}
                  className="p-1 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Settings size={16} />
            <span>Settings & Export</span>
          </button>
        </div>

      </aside>
    </>
  );
}