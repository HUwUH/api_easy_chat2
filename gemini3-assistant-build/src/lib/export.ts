// src/lib/export.ts

/**
 * 将 JSON 数据触发为浏览器下载文件
 * @param data 要导出的对象
 * @param filename 文件名 (不需要后缀)
 */
export function downloadJson(data: any, filename: string) {
  try {
    // 格式化 JSON，缩进 2 格，方便阅读
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed:", e);
    alert("导出失败");
  }
}

/**
 * 获取当前时间字符串，用于文件名
 * 例如: 2023-10-01_12-30
 */
export function getDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}`;
}