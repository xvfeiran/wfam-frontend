/**
 * Aftermarket complaint types: BA40 and BA41.
 * All other types are treated as 0KM (no sampling/analysis, direct scrap only).
 */
export const AFTERMARKET_TYPES = ['BA40', 'BA41'] as const

export function isAftermarket(complaintType: string | undefined | null): boolean {
  return !!complaintType && (AFTERMARKET_TYPES as readonly string[]).includes(complaintType)
}

/**
 * Complaint types (BA codes) for warranty part returns.
 * BA codes are standardized return reason categories.
 */
export const COMPLAINT_TYPES = [
  { value: 'BA10', label: 'BA10 - 0-mlg, provisional rework/accept. back' },
  { value: 'BA20', label: 'BA20 - 0-km, uninstalled' },
  { value: 'BA21', label: 'BA21 - QM01' },
  { value: 'BA30', label: 'BA30 - stock product of AA volume (0-km)' },
  { value: 'BA31', label: 'BA31 - Stock product of IAM Vol.(0-km, uninst)' },
  { value: 'BA35', label: 'BA35 - Logistics complaint original equipment' },
  { value: 'BA40', label: 'BA40 - field product' },
  { value: 'BA41', label: 'BA41 - Field campaign' },
  { value: 'BA42', label: 'BA42 - goodwill' },
  { value: 'BA43', label: 'BA43 - Field product outside partial market' },
  { value: 'BA50', label: 'BA50 - Internal Complaint' },
  { value: 'BA60', label: 'BA60 - commercial processing, 0-km' },
  { value: 'BA61', label: 'BA61 - commercial processing, field' },
  { value: 'BA70', label: 'BA70 - product for exam. w/o warranty claim' },
  { value: 'BA76', label: 'BA76 - Technical sample complaint' },
  { value: 'BA77', label: 'BA77 - Sample product analysis due to contract' },
  { value: 'BA78', label: 'BA78 - Sample product analysis customer request' },
  { value: 'BA79', label: 'BA79 - Logistics sample complaint' },
] as const

export type ComplaintTypeCode = typeof COMPLAINT_TYPES[number]['value']
