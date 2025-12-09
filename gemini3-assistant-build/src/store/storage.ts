// src/store/storage.ts
import { get, set, del } from 'idb-keyval';
import { type StateStorage, createJSONStorage } from 'zustand/middleware';

// 创建一个自定义的存储适配器，连接 Zustand 和 IndexedDB
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // 从 IndexedDB 读取数据
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // 写入 IndexedDB
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    // 删除数据
    await del(name);
  },
};

// 导出给 Zustand 使用的配置对象
export const idbStorage = createJSONStorage(() => storage);