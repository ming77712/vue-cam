/**
 * 攝影機預置點介面
 */
export interface CameraPreset {
  id: number
  name: string
  checked: boolean
}

/**
 * 攝影機項目介面
 */
export interface CameraItem {
  id: number
  name: string
  pushEnabled: boolean
  panTime: number
  presets: CameraPreset[]
}

/**
 * 排序順序類型
 */
export type SortOrder = 'ascending' | 'descending' | null

