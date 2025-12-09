// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

// 1. CSS 类名合并工具
// 作用：允许我们在写 React 组件时合并 Tailwind 样式，防止样式冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 2. ID 生成器
// 作用：生成唯一的 UUID，用于给每条消息发身份证
export function generateId(): string {
  return uuidv4();
}

// 3. 简单的延迟函数 (测试用)
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}