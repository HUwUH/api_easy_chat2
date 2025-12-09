// src/models/openai/api.ts
import type { LLMProvider, Message, ModelConfig } from "../../types";

// 定义 OpenAI 响应的数据结构 (用于类型安全)
interface OpenAIStreamChunk {
  choices: {
    delta: {
      content?: string;
      reasoning_content?: string; // DeepSeek R1 等推理模型可能会返回这个字段
    };
    finish_reason: string | null;
  }[];
}

export const OpenAIProvider: LLMProvider = {
  id: "openai-compatible",
  name: "OpenAI Compatible",

  // 获取默认配置
  getDefaultSettings: () => ({
    endpoint: "https://api.deepseek.com", // 默认用 DeepSeek 地址，方便你测试
    apiKey: "",
    modelName: "deepseek-chat",
    temperature: 1.0,
    contextWindow: 4096,
  }),

  // 核心对话方法
  chat: async (
    messages: Message[],
    config: ModelConfig,
    callbacks
  ) => {
    const { onUpdate, onFinish, onError } = callbacks;
    const settings = config.settings;

    try {
      // 1. 准备请求头
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      };

      // 2. 准备消息列表 (过滤掉不需要发送给 API 的类型)
      // 注意：DeepSeek 支持 Assistant Prefill (最后一条是 assistant)，所以我们不需要过滤最后的 assistant
      const apiMessages = messages
        .filter((m) => ["system", "user", "assistant"].includes(m.role))
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // 3. 发起请求
      const response = await fetch(`${settings.endpoint}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: settings.modelName,
          messages: apiMessages,
          temperature: settings.temperature,
          stream: true, // 强制开启流式
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is empty");
      }

      // 4. 处理流式响应 (重点！)
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let buffer = ""; // 缓冲区，处理被切断的 JSON

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码当前的数据块
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // OpenAI 的流式数据是以 "data: " 开头的多行数据
        const lines = buffer.split("\n");
        
        // 保留最后一行（因为它可能是不完整的）放回缓冲区
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data: ")) continue;
          
          const jsonStr = trimmedLine.replace("data: ", "");
          
          if (jsonStr === "[DONE]") continue; // 流结束标志

          try {
            const json: OpenAIStreamChunk = JSON.parse(jsonStr);
            const delta = json.choices[0]?.delta;
            
            // 获取内容（同时兼容普通内容和 deepseek 的推理内容）
            // 暂时我们将推理内容也直接拼接到正文里，后续可以区分处理
            const content = delta?.content || delta?.reasoning_content || "";

            if (content) {
              fullContent += content;
              onUpdate(content); // 调用回调，通知 UI 更新
            }
          } catch (e) {
            console.warn("Parse error for chunk:", jsonStr, e);
          }
        }
      }

      // 5. 完成
      onFinish(fullContent);

    } catch (err: any) {
      console.error("Chat Request Failed:", err);
      onError(err.message || "Unknown error");
    }
  },
};