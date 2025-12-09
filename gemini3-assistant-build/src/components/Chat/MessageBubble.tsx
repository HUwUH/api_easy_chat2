import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Trash2, Edit2, RotateCcw, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea';
import type { Message, MessageRole } from '../../types';
import { useChatStore } from '../../store/chatStore'; // 🟢 引入 store

interface MessageBubbleProps {
  message: Message;
  onUpdate: (id: string, content: string) => void;
  onRoleChange: (id: string, role: MessageRole) => void;
  onDelete: (id: string) => void;
}

export function MessageBubble({ message, onUpdate, onRoleChange, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  // 🟢 修复 Bug 2：从 store 获取生成状态
  const isGenerating = useChatStore((state) => state.isGenerating);

  const bubbleStyle = {
    user: "ml-auto bg-blue-50 border-blue-100 text-gray-800 rounded-tr-sm",
    assistant: "mr-auto bg-white border-gray-200 text-gray-800 rounded-tl-sm shadow-sm",
    system: "mx-auto bg-gray-100 border-gray-200 text-gray-500 text-sm w-[90%]",
    note: "mx-auto bg-yellow-50 border-yellow-200 text-gray-600 text-sm italic w-[90%]",
    error: "mx-auto bg-red-50 border-red-200 text-red-600 w-[90%]",
    think: "mx-auto bg-gray-50 border-gray-200 text-gray-400 text-xs w-[90%]"
  };

  const containerAlign = {
    user: "justify-end",
    assistant: "justify-start",
    system: "justify-center",
    note: "justify-center",
    error: "justify-center",
    think: "justify-center"
  };

  // 🟢 修复 Bug 3：点击编辑时，强制同步最新内容
  const startEditing = () => {
    setEditContent(message.content); // 这一步很关键
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editContent.trim() !== message.content) {
      onUpdate(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className={cn("flex w-full group mb-2", containerAlign[message.role])}>
      <div 
        className={cn(
          "relative max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl border transition-all duration-200",
          bubbleStyle[message.role]
        )}
      >
        <div className="flex justify-between items-center mb-1 opacity-50 text-[10px] uppercase tracking-wider font-bold">
          <span>{message.role}</span>
          
          {/* 🟢 修复 Bug 2：生成中隐藏按钮 */}
          <div className={cn("flex gap-2 transition-opacity", 
              isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              isGenerating ? "hidden" : "" // 生成时强制隐藏
          )}>
            {!isEditing && (
              <>
                <button onClick={startEditing} title="Edit"><Edit2 size={12} /></button>
                <button onClick={() => onDelete(message.id)} title="Delete" className="hover:text-red-500"><Trash2 size={12} /></button>
                <button 
                  onClick={() => {
                     const roles: MessageRole[] = ['user', 'assistant', 'system', 'note'];
                     const nextIndex = (roles.indexOf(message.role) + 1) % roles.length;
                     onRoleChange(message.id, roles[nextIndex] as MessageRole);
                  }} 
                  title="Switch Role"
                >
                  <RotateCcw size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="w-full min-w-[200px]">
            {/* 🟢 修复 Bug 4：去掉了 autoFocus，防止浏览器自动滚动定位。
                AutoResizeTextarea 本身只调整 height，如果不 focus 应该不会乱跳 */}
            <AutoResizeTextarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-sm font-mono leading-relaxed min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={handleCancel} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
              <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700"><Check size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="markdown-body text-sm leading-relaxed overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({children}) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                li: ({children}) => <li className="pl-1">{children}</li>,
                h1: ({children}) => <h1 className="text-xl font-bold my-3 pb-1 border-b">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold my-1">{children}</h3>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 my-2 text-gray-500 italic">{children}</blockquote>,
                a: ({children, href}) => <a href={href} className="text-blue-500 hover:underline" target="_blank">{children}</a>,
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneLight}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: '10px 0', borderRadius: '6px', fontSize: '12px', backgroundColor: '#f5f5f5' }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={cn("bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-red-500", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content || "(Empty)"}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}