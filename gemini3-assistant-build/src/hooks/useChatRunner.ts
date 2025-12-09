import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { getProvider } from '../models';
import { generateId } from '../lib/utils';
import type { MessageRole } from '../types';

export function useChatRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { 
    sessions, 
    currentSessionId, 
    modelConfigs, 
    addMessage, 
    updateMessage 
  } = useChatStore();

  const run = useCallback(async (modelConfigId: string) => {
    // 1. 基础检查
    const config = modelConfigs.find(c => c.id === modelConfigId);
    if (!config || !currentSessionId) {
      alert("请先选择一个模型配置！");
      return;
    }

    const session = sessions[currentSessionId];
    if (!session || session.messages.length === 0) return;

    // 2. 准备 Provider
    const provider = getProvider(config.providerId);
    if (!provider) {
      alert(`Provider ${config.providerId} not found`);
      return;
    }

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    // 3. 决定目标气泡 (Target Bubble)
    // 逻辑：如果最后一条是 assistant，则视为“续写”；否则新建一个 assistant
    const lastMsg = session.messages[session.messages.length - 1];
    let targetMessageId = "";
    
    // 排除 note/error/think 等非对话内容对 "最后一条" 的判断干扰
    // 这里简单处理：直接看物理上的最后一条。
    // 如果你想更智能（比如忽略最后的 note），可以在这里倒序查找第一个 user/assistant
    
    if (lastMsg.role === 'assistant') {
      targetMessageId = lastMsg.id;
      // 续写模式：不清空内容，API 的新内容会 append 到后面
    } else {
      // 新建模式
      const newMsgId = generateId();
      addMessage({ role: 'assistant', content: '', index: session.messages.length }); // 追加到底部
      targetMessageId = newMsgId;
    }

    // 4. 发起请求
    try {
      await provider.chat(
        session.messages, // 传入当前完整历史
        config,
        {
          onUpdate: (chunk) => {
            // 实时从 Store 获取最新状态，以免闭包问题，但 Zustand 的 updateMessage 是原子操作
            // 这里我们需要 append，Zustand 的 update 最好支持函数式更新，
            // 但我们的 store.updateMessage 目前是替换式。
            // 简单方案：在 onUpdate 里我们无法获取 "当前 Store 里的最新值" 除非用 get()
            // 优化方案：useChatStore.getState()
            
            const currentMsg = useChatStore.getState().sessions[currentSessionId]?.messages.find(m => m.id === targetMessageId);
            if (currentMsg) {
                updateMessage(targetMessageId, { content: currentMsg.content + chunk });
            }
          },
          onFinish: (full) => {
            setIsRunning(false);
          },
          onError: (err) => {
            // 发生错误，添加一个 Error 气泡
            addMessage({ role: 'error', content: `API Error: ${err}` });
            setIsRunning(false);
          }
        },
        { signal: abortControllerRef.current.signal }
      );
    } catch (e) {
      setIsRunning(false);
    }
  }, [sessions, currentSessionId, modelConfigs, addMessage, updateMessage]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsRunning(false);
    }
  }, []);

  return { run, stop, isRunning };
}