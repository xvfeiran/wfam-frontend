/**
 * 复制文本到剪贴板，兼容 wujie 子应用（iframe / 非安全上下文）模式。
 *
 * 背景：navigator.clipboard.writeText 需要安全上下文（HTTPS 或 localhost）。
 * - dev=1 直跑时是 localhost，可用。
 * - 在 AEP/wujie 子应用模式下，应用运行在 iframe 内、走内网 HTTP，
 *   非安全上下文，navigator.clipboard 不可用或被拒绝。
 *
 * 因此优先用 Clipboard API，失败时回退到 document.execCommand('copy')
 * （在允许脚本执行的 iframe 内可用，不依赖安全上下文）。
 * 两者都失败时返回 false，由调用方决定如何提示用户。
 */
export async function copyText(text: string): Promise<boolean> {
  // 1. 优先异步 Clipboard API（安全上下文下可用）
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 安全上下文但仍被拒绝（如 iframe 缺少 clipboard 权限），落到回退
    }
  }

  // 2. 回退：临时 textarea + execCommand
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // 放到视口内但不可见，避免页面跳动
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
