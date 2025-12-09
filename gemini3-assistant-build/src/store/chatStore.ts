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