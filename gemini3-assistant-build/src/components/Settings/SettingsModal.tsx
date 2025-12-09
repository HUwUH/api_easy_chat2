import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Download, Database, Cpu } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import type { ModelConfig } from '../../types';
import { generateId, cn } from '../../lib/utils';
import { downloadJson, getDateString } from '../../lib/export';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'models' | 'data';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { modelConfigs, addModelConfig, updateModelConfig, removeModelConfig, sessions } = useChatStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('models');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState<ModelConfig | null>(null);

  // 当选中一个配置时，填充表单
  useEffect(() => {
    if (selectedConfigId) {
      const config = modelConfigs.find(c => c.id === selectedConfigId);
      if (config) setFormData({ ...config });
    } else {
      setFormData(null);
    }
  }, [selectedConfigId, modelConfigs]);

  // 处理保存
  const handleSave = () => {
    if (!formData) return;
    if (modelConfigs.find(c => c.id === formData.id)) {
      updateModelConfig(formData);
    } else {
      addModelConfig(formData);
    }
    alert("Saved successfully!");
  };

  // 处理新建
  const handleCreate = () => {
    const newConfig: ModelConfig = {
      id: generateId(),
      name: "New Model",
      providerId: "openai-compatible",
      settings: {
        endpoint: "/api",
        apiKey: "",
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
        contextWindow: 4096
      }
    };
    addModelConfig(newConfig);
    setSelectedConfigId(newConfig.id);
  };

  // 处理全量导出
  const handleExportAll = () => {
    const backupData = {
      version: 1,
      exportedAt: Date.now(),
      modelConfigs,
      sessions
    };
    downloadJson(backupData, `full-backup-${getDateString()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 1. Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <SettingsIcon tab={activeTab} />
            {activeTab === 'models' ? 'Model Management' : 'Data & Backup'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 2. Body (Flex Layout) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-50 border-r flex flex-col p-2 gap-1">
            <button
              onClick={() => setActiveTab('models')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                activeTab === 'models' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-200"
              )}
            >
              <Cpu size={16} /> Models
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                activeTab === 'data' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-200"
              )}
            >
              <Database size={16} /> Backup
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* === Tab: Models === */}
            {activeTab === 'models' && (
              <div className="flex h-full gap-6">
                
                {/* 左侧：列表 */}
                <div className="w-1/3 border-r pr-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">My Models</h3>
                    <button onClick={handleCreate} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {modelConfigs.map(config => (
                      <div
                        key={config.id}
                        onClick={() => setSelectedConfigId(config.id)}
                        className={cn(
                          "p-3 rounded border cursor-pointer text-sm hover:border-blue-300 transition-all",
                          selectedConfigId === config.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="font-medium text-gray-800">{config.name}</div>
                        <div className="text-xs text-gray-400 truncate">{config.settings.modelName}</div>
                      </div>
                    ))}
                    {modelConfigs.length === 0 && <div className="text-gray-400 text-sm">No models yet.</div>}
                  </div>
                </div>

                {/* 右侧：表单 */}
                <div className="flex-1 pl-2">
                  {formData ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h3 className="font-bold text-gray-700">Edit Config</h3>
                        <button 
                          onClick={() => {
                            if(confirm("Delete this model config?")) {
                                removeModelConfig(formData.id);
                                setSelectedConfigId(null);
                            }
                          }}
                          className="text-red-500 hover:bg-red-50 p-2 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Display Name */}
                      <FormItem label="Display Name (Nickname)">
                        <input 
                          className="input-field" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </FormItem>

                      {/* Provider (目前先只支持 OpenAI Compatible) */}
                      <FormItem label="Provider Type">
                        <select 
                          className="input-field bg-gray-100 cursor-not-allowed" 
                          disabled 
                          value={formData.providerId}
                        >
                          <option value="openai-compatible">OpenAI Compatible (Generic)</option>
                        </select>
                      </FormItem>

                      {/* API Endpoint */}
                      <FormItem label="API Endpoint (Base URL)">
                        <input 
                          className="input-field font-mono text-xs" 
                          value={formData.settings.endpoint}
                          placeholder="https://api.openai.com/v1"
                          onChange={e => setFormData({
                            ...formData, 
                            settings: { ...formData.settings, endpoint: e.target.value }
                          })}
                        />
                        <p className="text-xs text-gray-400 mt-1">For DeepSeek use: https://api.deepseek.com or /api (if using proxy)</p>
                      </FormItem>

                      {/* API Key */}
                      <FormItem label="API Key">
                        <input 
                          type="password"
                          className="input-field font-mono" 
                          value={formData.settings.apiKey}
                          placeholder="sk-..."
                          onChange={e => setFormData({
                            ...formData, 
                            settings: { ...formData.settings, apiKey: e.target.value }
                          })}
                        />
                      </FormItem>

                      {/* Model Name */}
                      <FormItem label="Model Name (e.g. gpt-4, deepseek-chat)">
                        <input 
                          className="input-field font-mono" 
                          value={formData.settings.modelName}
                          onChange={e => setFormData({
                            ...formData, 
                            settings: { ...formData.settings, modelName: e.target.value }
                          })}
                        />
                      </FormItem>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Temperature */}
                        <FormItem label={`Temperature: ${formData.settings.temperature}`}>
                          <input 
                            type="range" min="0" max="2" step="0.1"
                            className="w-full"
                            value={formData.settings.temperature}
                            onChange={e => setFormData({
                              ...formData, 
                              settings: { ...formData.settings, temperature: parseFloat(e.target.value) }
                            })}
                          />
                        </FormItem>

                        {/* Context Window */}
                        <FormItem label="Context Window (Max Tokens)">
                          <input 
                            type="number"
                            className="input-field"
                            value={formData.settings.contextWindow}
                            onChange={e => setFormData({
                              ...formData, 
                              settings: { ...formData.settings, contextWindow: parseInt(e.target.value) }
                            })}
                          />
                        </FormItem>
                      </div>

                      <div className="pt-4 border-t">
                        <button 
                          onClick={handleSave}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-sm transition-colors"
                        >
                          <Save size={18} />
                          Save Changes
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed rounded-lg">
                      Select a model to edit or create new
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === Tab: Data === */}
            {activeTab === 'data' && (
              <div className="max-w-xl mx-auto space-y-8">
                <div className="border p-6 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Export All Data</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    This will create a JSON file containing all your chat history, messages, and model configurations (including API keys).
                    Please keep this file safe.
                  </p>
                  <button 
                    onClick={handleExportAll}
                    className="flex items-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-black transition-colors"
                  >
                    <Download size={20} />
                    Download Full Backup (.json)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助组件：图标
function SettingsIcon({ tab }: { tab: Tab }) {
  if (tab === 'models') return <Cpu size={18} />;
  return <Database size={18} />;
}

// 辅助组件：表单项
function FormItem({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}