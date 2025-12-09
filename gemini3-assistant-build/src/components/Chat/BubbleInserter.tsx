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
      {/* 分割线：桌面端平时隐藏，Hover/手机端显示淡淡的线 */}
      <div className={cn(
        "absolute w-full border-t border-gray-200 transition-opacity duration-200",
        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 sm:opacity-30" 
        // sm:opacity-30 意味着在手机(小屏)上默认有30%透明度的线，提示可以点击
      )} />

      {/* 加号按钮 */}
      <div className="relative z-10">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "p-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shadow-sm transition-all duration-200",
              "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100", // 桌面端 hover 效果
              "sm:opacity-100 sm:scale-100" // 手机端常驻显示
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

// 辅助小组件：角色选择按钮
function RoleButton({ role, onClick, color, label }: { role: string, onClick: () => void, color: string, label?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("px-3 py-1 text-xs font-medium rounded-full hover:brightness-95 transition-all", color)}
      title={`Add ${role}`}
    >
      {label || role.charAt(0).toUpperCase() + role.slice(1)}
    </button>
  );
}