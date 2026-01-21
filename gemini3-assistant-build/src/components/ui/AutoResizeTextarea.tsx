import { type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export function AutoResizeTextarea({ className, value, ...props }: Props) {
  // 这种实现方式被称为 "CSS Grid 堆叠法"
  // 原理：Grid 允许两个元素重叠在同一个格子里。
  // 1. 我们放一个 invisible 的 div (影子)，让它自然撑开高度。
  // 2. 我们放一个 textarea，让它绝对填充这个格子。
  // 结果：textarea 的高度会自动跟随 div，无需任何 JS 计算高度，彻底根治跳动。

  return (
    <div 
      className={cn(
        "grid w-full", // 定义为 Grid 容器
        className // 继承外部传入的 min-h-[60px] 等样式
      )}
    >
      {/* 
        1. 影子层：负责撑开高度
        - invisible: 不可见
        - whitespace-pre-wrap: 保留换行符
        - break-words: 自动换行
        - col-start-1 row-start-1: 放在第一格
      */}
      <div 
        className={cn(
          className, // 继承同样的字体样式以确保高度一致
          "invisible col-start-1 row-start-1 whitespace-pre-wrap break-words overflow-hidden"
        )}
        aria-hidden="true"
      >
        {/* 在末尾加一个空格，确保最后按回车换行时高度能立刻撑开 */}
        {value + ' '}
      </div>

      {/* 
        2. 输入层：负责交互
        - w-full h-full: 填满由影子撑开的空间
        - col-start-1 row-start-1: 同样放在第一格（重叠）
      */}
      <textarea
        className={cn(
          className, // 继承同样的样式
          "col-start-1 row-start-1 w-full h-full resize-none overflow-hidden bg-transparent outline-none"
        )}
        value={value}
        {...props}
      />
    </div>
  );
}