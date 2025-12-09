import { useEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export function AutoResizeTextarea({ className, value, ...props }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度的逻辑
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // 先重置
      textarea.style.height = `${textarea.scrollHeight}px`; // 再设为内容高度
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "w-full resize-none overflow-hidden bg-transparent outline-none",
        className
      )}
      rows={1}
      value={value}
      {...props}
    />
  );
}