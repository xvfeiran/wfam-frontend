import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 统一时区：上海时间（Asia/Shanghai, UTC+8）
// 后端返回的时间字符串为无偏移的上海本地时间，前端统一按上海时区解析与格式化。
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

export const SHANGHAI_TZ = 'Asia/Shanghai'

/** 将后端返回的无偏移时间字符串按上海时区解析并格式化 */
export function formatShanghai(raw: string | undefined | null, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!raw) return '—'
  const d = dayjs.tz(raw, SHANGHAI_TZ)
  return d.isValid() ? d.format(pattern) : String(raw)
}

/** 取上海时区当前时间 */
export function nowShanghai(): dayjs.Dayjs {
  return dayjs.tz()
}

export default dayjs
