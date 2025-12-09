// src/store/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, Message, MessageRole, ModelConfig } from '../types';
import { generateId, cn } from '../lib/utils'; // 引入我们之前写的工具
import { idbStorage } from './storage';

// 定义 Store 的状态和方法
interface ChatState {
  // 1. 数据状态
  sessions: Record<string, ChatSession>; // 所有会话 Map<ID, Session>
  currentSessionId: string | null;       // 当前选中的会话 ID
  modelConfigs: ModelConfig[];           // 用户保存的模型配置列表
  
  // 2. 会话管理动作
  createSession: (title?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // 3. 消息操作动作 (核心!)
  // 添加消息：支持在指定 index 插入，如果不传 index 则追加到最后
  addMessage: (payload: { role: MessageRole; content?: string; index?: number }) => void;
  
  // 更新消息：支持部分更新 (只改 content 或 只改 role)
  updateMessage: (messageId: string, updates: Partial<Omit<Message, 'id' | 'createdAt'>>) => void;
  
  // 删除消息
  deleteMessage: (messageId: string) => void;
  
  // 清空当前会话的消息
  clearMessages: () => void;

  // 4. 模型配置管理
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (config: ModelConfig) => void;
  removeModelConfig: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // --- 初始状态 ---
      sessions: {},
      currentSessionId: null,
      modelConfigs: [],

      // --- 动作实现 ---

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
          currentSessionId: id, // 自动切换到新会话
        }));
        
        return id;
      },

      switchSession: (sessionId) => set({ currentSessionId: sessionId }),

      deleteSession: (sessionId) => set((state) => {
        const newSessions = { ...state.sessions };
        delete newSessions[sessionId];
        // 如果删除的是当前会话，重置 currentSessionId
        const nextSessionId = state.currentSessionId === sessionId ? null : state.currentSessionId;
        return { sessions: newSessions, currentSessionId: nextSessionId };
      }),

      addMessage: ({ role, content = '', index }) => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId || !state.sessions[sessionId]) return state;

        const session = state.sessions[sessionId];
        const newMessage: Message = {
          id: generateId(),
          role,
          content,
          createdAt: Date.now(),
        };

        const newMessages = [...session.messages];
        
        // 核心逻辑：如果有 index，插在中间；否则追加到末尾
        if (index !== undefined && index >= 0 && index <= newMessages.length) {
          newMessages.splice(index, 0, newMessage);
        } else {
          newMessages.push(newMessage);
        }

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, messages: newMessages, updatedAt: Date.now() },
          },
        };
      }),

      updateMessage: (messageId, updates) => set((state) => {
        const sessionId = state.currentSessionId;
        if (!sessionId) return state;

        const session = state.sessions[sessionId];
        const newMessages = session.messages.map((msg) => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        );

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, messages: newMessages, updatedAt: Date.now() },
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
    }),
    {
      name: 'chat-storage', // IndexedDB 中的 key 名称
      storage: idbStorage,  // 使用我们自定义的 IndexedDB 适配器
      skipHydration: false, // 自动恢复数据
    }
  )
);