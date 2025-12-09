// src/types/index.ts

/**
 * 1. 消息相关定义
 */

// 消息的角色类型
export type MessageRole = 'system' | 'user' | 'assistant' | 'think' | 'note' | 'error';

export interface Message {
  id: string;             // UUID
  role: MessageRole;
  content: string;        // 消息正文
  
  // 元数据：用于存储额外状态
  meta?: {
    isExpanded?: boolean;  // 是否展开 (用于 System/Think)
    errorDetails?: string; // 报错详情
    [key: string]: any;
  };
  
  createdAt: number;      // 时间戳
}

export interface ChatSession {
  id: string;             // 会话 ID
  title: string;          // 标题
  messages: Message[];    // 消息列表
  updatedAt: number;      // 最后更新时间
}

/**
 * 2. 模型配置与模板相关定义
 */

// 模板类型 ID (对应代码里的实现)
export type ProviderId = 'openai-compatible' | 'deepseek-official' | 'test-mock';

// 模型配置 (用户保存的实例)
export interface ModelConfig {
  id: string;             // UUID
  name: string;           // 用户起的昵称，如 "我的 DeepSeek"
  providerId: ProviderId; // 属于哪个模板
  
  // 具体参数
  settings: {
    endpoint?: string;    
    apiKey?: string;      
    modelName?: string;   
    temperature?: number; 
    contextWindow?: number;
    [key: string]: any;   
  };
}

/**
 * 3. 模板接口 (Provider Interface)
 * 所有的 API 适配器都要实现这个接口
 */
export interface LLMProvider {
  id: ProviderId;
  name: string; 
  getDefaultSettings: () => ModelConfig['settings'];
  
  chat: (
    messages: Message[], 
    config: ModelConfig,
    callbacks: {
      onUpdate: (content: string) => void; 
      onFinish: (fullContent: string) => void;
      onError: (error: string) => void;
    },
    // 🟢 新增这个参数
    options?: {
      signal?: AbortSignal;
    }
  ) => Promise<void>;
}