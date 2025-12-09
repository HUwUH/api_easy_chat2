import { useState, useEffect } from 'react';
import { Play, Square, Settings, Plus } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useChatRunner } from '../../hooks/useChatRunner';
import { generateId, cn } from '../../lib/utils';
import type { ModelConfig } from '../../types';

export function ControlBar() {
  const { modelConfigs, addModelConfig } = useChatStore();
  const { run, stop, isRunning } = useChatRunner();
  
  // 本地状态：当前选中的模型 ID
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  // 当模型列表加载后，自动选中第一个
  useEffect(() => {
    if (!selectedModelId && modelConfigs.length > 0) {
      setSelectedModelId(modelConfigs[0].id);
    }
  }, [modelConfigs, selectedModelId]);

  // 快速添加一个测试用的 DeepSeek 配置
  const handleAddDefaultModel = () => {
    const key = prompt("请输入你的 DeepSeek API Key (存储在本地浏览器):");
    if (!key) return;

    const newConfig: ModelConfig = {
      id: generateId(),
      name: "DeepSeek V3",
      providerId: "openai-compatible",
      settings: {
        endpoint: "/api", // 使用我们配置的 Vite 代理
        apiKey: key,
        modelName: "deepseek-chat",
        temperature: 1.0,
      }
    };
    addModelConfig(newConfig);
    setSelectedModelId(newConfig.id);
  };

  const handleRun = () => {
    if (!selectedModelId) return;
    run(selectedModelId);
  };

  return (
    <div className="fixed bottom-0 w-full bg-white border-t p-4 z-50 shadow-lg">
      <div className="max-w-3xl mx-auto flex gap-4 items-center">
        
        {/* 左侧：模型选择器 */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
            {modelConfigs.length === 0 ? (
                <button 
                    onClick={handleAddDefaultModel}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                    <Plus size={16} />
                    添加 DeepSeek 配置
                </button>
            ) : (
                <div className="relative w-full max-w-xs">
                    <select 
                        className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8"
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        disabled={isRunning}
                    >
                        {modelConfigs.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <Settings className="absolute right-2 top-3 text-gray-400 pointer-events-none" size={16} />
                </div>
            )}
        </div>

        {/* 右侧：运行按钮 */}
        <button
          onClick={isRunning ? stop : handleRun}
          disabled={modelConfigs.length === 0}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-md transition-all active:scale-95",
            isRunning 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          )}
        >
          {isRunning ? (
            <>
              <Square size={18} fill="currentColor" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              <span>Run</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}