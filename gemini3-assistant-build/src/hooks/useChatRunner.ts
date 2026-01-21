// src/hooks/useChatRunner.ts
import { useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { getProvider } from '../models';
import { generateId } from '../lib/utils';

export function useChatRunner() {
  const { 
    sessions, 
    currentSessionId, 
    modelConfigs, 
    addMessage, 
    updateMessage,
    isGenerating,
    setGenerating 
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  
  const run = useCallback(async (modelConfigId: string) => {
    const config = modelConfigs.find(c => c.id === modelConfigId);
    if (!config || !currentSessionId) {
      alert("请先选择一个模型配置！");
      return;
    }

    const session = sessions[currentSessionId];
    if (!session || session.messages.length === 0) return;

    const provider = getProvider(config.providerId);
    if (!provider) {
      alert(`Provider ${config.providerId} not found`);
      return;
    }

    setGenerating(true);
    abortControllerRef.current = new AbortController();

    const lastMsg = session.messages[session.messages.length - 1];
    let targetMessageId = "";
    let accumulatedContent = ""; 
    
    // 如果最后一条是 assistant，则续写；否则新建
    if (lastMsg.role === 'assistant') {
      targetMessageId = lastMsg.id;
      accumulatedContent = lastMsg.content;
    } else {
      // 🟢 关键修复：显式生成 ID 并传给 Store
      const newMsgId = generateId();
      addMessage({ 
          id: newMsgId, // 必须传这个！
          role: 'assistant', 
          content: '', 
          index: session.messages.length 
      });
      targetMessageId = newMsgId;
      accumulatedContent = ""; 
    }

    try {
      await provider.chat(
        session.messages,
        config,
        {
          onUpdate: (chunk) => {
            accumulatedContent += chunk;
            // 此时 targetMessageId 与 Store 中的 ID 绝对一致
            updateMessage(targetMessageId, { content: accumulatedContent });
          },
          onFinish: (_full) => {
            setGenerating(false);
          },
          onError: (err) => {
            addMessage({ role: 'error', content: `API Error: ${err}` });
            setGenerating(false);
          }
        },
        { signal: abortControllerRef.current.signal }
      );
    } catch (e) {
      setGenerating(false);
    }
  }, [sessions, currentSessionId, modelConfigs, addMessage, updateMessage, setGenerating]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setGenerating(false);
    }
  }, [setGenerating]);

  return { run, stop, isRunning: isGenerating };
}