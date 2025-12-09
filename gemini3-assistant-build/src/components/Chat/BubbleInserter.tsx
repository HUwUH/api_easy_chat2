import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MessageRole } from '../../types';

interface BubbleInserterProps {
  onInsert: (role: MessageRole) => void;
  className?: string;
}

export function BubbleInserter({ onInsert, className }: BubbleInserterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (role: MessageRole) => {
    onInsert(role);
    setIsOpen(false);
  };

  return (
    <div className={cn("group relative py-2 flex justify-center items-center", className)}>
      {/* 分割线 */}
      <div className={cn(
        "absolute w-full border-t border-gray-200 transition-opacity duration-200",
        // 逻辑修正：
        // 默认(手机)：opacity-30 (淡淡的线)
        // md(桌面)：默认 0，hover 时 100
        isOpen ? "opacity-100" : "opacity-30 md:opacity-0 md:group-hover:opacity-100"
      )} />

      {/* 加号按钮 */}
      <div className="relative z-10">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "p-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shadow-sm transition-all duration-200",
              // 逻辑修正：
              // 默认(手机)：opacity-100 scale-100 (常显)
              "opacity-100 scale-100",
              // md(桌面)：默认 hidden，hover 时显示
              "md:opacity-0 md:group-hover:opacity-100 md:scale-90 md:group-hover:scale-100"
            )}
          >
            <Plus size={14} />
          </button>
        ) : (
          // 展开后的菜单
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200 shadow-lg animate-in fade-in zoom-in duration-200">
            <RoleButton role="user" onClick={() => handleSelect('user')} color="bg-blue-100 text-blue-700" />
            <RoleButton role="assistant" onClick={() => handleSelect('assistant')} color="bg-purple-100 text-purple-700" />
            <RoleButton role="system" onClick={() => handleSelect('system')} color="bg-gray-100 text-gray-700" label="Sys" />
            <RoleButton role="note" onClick={() => handleSelect('note')} color="bg-yellow-100 text-yellow-700" label="Note" />
            <div className="w-[1px] h-4 bg-gray-200 mx-1" />
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleButton({ role, onClick, color, label }: { role: string, onClick: () => void, color: string, label?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("px-3 py-1 text-xs font-medium rounded-full hover:brightness-95 transition-all", color)}
    >
      {label || role.charAt(0).toUpperCase() + role.slice(1)}
    </button>
  );
}