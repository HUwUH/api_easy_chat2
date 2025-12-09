// src/store/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, Message, MessageRole, ModelConfig } from '../types';
import { generateId } from '../lib/utils';
import { idbStorage } from './storage';

interface ChatState {
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;
  modelConfigs: ModelConfig[];
  isGenerating: boolean; 

  createSession: (title?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // 🟢 改动1：接口定义增加 id?
  addMessage: (payload: { role: MessageRole; content?: string; index?: number; id?: string }) => void;
  updateMessage: (messageId: string, updates: Partial<Omit<Message, 'id' | 'createdAt'>>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (config: ModelConfig) => void;
  removeModelConfig: (id: string) => void;
  setGenerating: (isGenerating: boolean) => void;
  // 🟢 新增：重命名会话
  renameSession: (sessionId: string, newTitle: string) => void;
  // 🟢 新增：复制会话
  duplicateSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,
      modelConfigs: [],
      isGenerating: false, 

      createSession: (title = 'New Chat') => {
        const id = generateId();
        const newSession: ChatSession = {
          id,
          title,
          messages: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          currentSessionId: id,
        }));
        return id;
      },

      switchSession: (sessionId) => set({ currentSessionId: sessionId }),

      deleteSession: (sessionId) => set((state) => {
        const newSessions = { ...state.sessions };
        delete newSessions[sessionId];
        const nextSessionId = state.currentSessionId === sessionId ? null : state.currentSessionId;
        return { sessions: newSessions, currentSessionId: nextSessionId };
      }),

      // 🟢 新增：实现重命名
      renameSession: (sessionId, newTitle) => set((state) => {
        const session = state.sessions[sessionId];
        if (!session) return state;
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, title: newTitle, updatedAt: Date.now() }
          }
        };
      }),

       // 🟢 实现复制逻辑
      duplicateSession: (sessionId) => set((state) => {
        const session = state.sessions[sessionId];
        if (!session) return state;

        const newId = generateId();
        
        // 深拷贝会话，并为每条消息生成新 ID
        const newSession: ChatSession = {
          ...session,
          id: newId,
          title: `${session.title} (Copy)`, // 自动加后缀
          updatedAt: Date.now(),
          messages: session.messages.map(msg => ({
            ...msg,
            id: generateId(), // 🔴 重要：必须重新生成消息 ID
          }))
        };

        return {
          sessions: { ...state.sessions, [newId]: newSession },
          currentSessionId: newId, // 复制后自动跳转到新会话
        };
      }),

      // 🟢 改动2：这里的参数必须解构出 id，否则函数内部拿不到
      addMessage: ({ role, content = '', index, id }) => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId || !state.sessions[sessionId]) return state;

        const session = state.sessions[sessionId];
        
        // 🟢 改动3：优先使用传入的 id，没有才自动生成
        const finalId = id || generateId();

        const newMessage: Message = {
          id: finalId,
          role,
          content,
          createdAt: Date.now(),
        };

        const newMessages = [...session.messages];
        if (index !== undefined && index >= 0 && index <= newMessages.length) {
          newMessages.splice(index, 0, newMessage);
        } else {
          newMessages.push(newMessage);
        }

        // 🟢 新增：自动重命名逻辑
        // 如果是 User 发的消息，且当前标题还是初始值 "New Chat"，则截取前20个字
        let newTitle = session.title;
        if (role === 'user' && session.title === 'New Chat') {
            const cleanContent = content.trim();
            if (cleanContent.length > 0) {
                newTitle = cleanContent.slice(0, 20) + (cleanContent.length > 20 ? '...' : '');
            }
        }

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { 
                ...session, 
                messages: newMessages, 
                title: newTitle, // 更新标题
                updatedAt: Date.now() 
            },
          },
        };
      }),

 // 🟢 修改：updateMessage (加入自动标题逻辑)
      updateMessage: (messageId, updates) => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId) return state;

        const session = state.sessions[sessionId];
        
        // 1. 更新消息内容
        const newMessages = session.messages.map((msg) => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        );

        // 2. 自动标题逻辑
        let newTitle = session.title;
        // 只有当标题还是默认值 "New Chat" 时，才尝试自动命名
        if (session.title === 'New Chat') {
            // 找到刚才更新的那条消息
            const updatedMsg = newMessages.find(m => m.id === messageId);
            // 如果是 User 发的，且有内容
            if (updatedMsg && updatedMsg.role === 'user' && updatedMsg.content.trim().length > 0) {
                 const cleanContent = updatedMsg.content.trim();
                 newTitle = cleanContent.slice(0, 20) + (cleanContent.length > 20 ? '...' : '');
            }
        }

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { 
                ...session, 
                messages: newMessages, 
                title: newTitle, // 更新标题
                updatedAt: Date.now() 
            },
          },
        };
      }),

      deleteMessage: (messageId) => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId) return state;

        const session = state.sessions[sessionId];
        const newMessages = session.messages.filter((msg) => msg.id !== messageId);

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, messages: newMessages, updatedAt: Date.now() },
          },
        };
      }),

      clearMessages: () => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId) return state;
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...state.sessions[sessionId], messages: [], updatedAt: Date.now() }
          }
        };
      }),

      addModelConfig: (config) => set((state) => ({
        modelConfigs: [...state.modelConfigs, config]
      })),

      updateModelConfig: (config) => set((state) => ({
        modelConfigs: state.modelConfigs.map(c => c.id === config.id ? config : c)
      })),

      removeModelConfig: (id) => set((state) => ({
        modelConfigs: state.modelConfigs.filter(c => c.id !== id)
      })),

      setGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: 'chat-storage',
      storage: idbStorage,
      skipHydration: false,
      partialize: (state) => ({ 
        sessions: state.sessions, 
        currentSessionId: state.currentSessionId,
        modelConfigs: state.modelConfigs 
      }),
    }
  )
);