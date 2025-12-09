// src/models/index.ts
import type { LLMProvider, ProviderId } from "../types";
import { OpenAIProvider } from "./openai/api";

// 注册表：将 ID 映射到具体的实现
export const PROVIDER_REGISTRY: Record<ProviderId, LLMProvider> = {
  "openai-compatible": OpenAIProvider,
  "deepseek-official": OpenAIProvider, // 暂时复用同一个，以后可以拆分
  "test-mock": OpenAIProvider, // 占位
};

// 获取 Provider 的辅助函数
export function getProvider(id: ProviderId): LLMProvider | undefined {
  return PROVIDER_REGISTRY[id];
}