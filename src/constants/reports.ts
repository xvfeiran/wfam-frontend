// BU 列表
/** @deprecated BU 列表已改为从后端动态获取，请通过 optionsApi.getBuOptions() 获取 */
export const BU_LIST = ['WS', 'CA', 'TS', 'IB'] as const
export type BU = string

// B/C/S/O 列表
export const BCSO_LIST = ['B', 'C', 'S', 'O'] as const
export type BCSO = (typeof BCSO_LIST)[number]

// 公里数区间
export const KILOMETER_RANGES = [
  '0-1000',
  '1000-5000',
  '5000-10000',
  '10000-20000',
  '20000-40000',
  '40000-60000',
  '60000-100000',
  '100000-150000',
] as const
export type KilometerRange = (typeof KILOMETER_RANGES)[number]

// MIS 周期（折线命名）
export const MIS_PERIODS = ['MIS1', 'MIS3', 'MIS6', 'MIS12', 'MIS24', 'MIS36', 'MIS48', 'MIS60'] as const
export type MisPeriod = (typeof MIS_PERIODS)[number]
