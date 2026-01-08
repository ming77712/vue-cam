/**
 * 排程時間介面
 */
/**
 * 攝影機預置點排程介面
 */
export interface CameraPointSchedule {
  StartTime: string
  EndTime: string
  IsEnabled: boolean
}

/**
 * 攝影機預置點介面
 */
export interface CameraPoint {
  CameraPointId: number
  DocGuid: string
  CameraPointNo: number
  CameraPointName: string
  CameraPointAreaPic: string
  CameraPointScenePic: string
  IsSpinToTarget: boolean // 是否為輪巡目標
  ChangePointSec: number | null // 輪巡時間(秒)
  Schedule: CameraPointSchedule[] // 排程
  Checked?: boolean // UI 輔助欄位 (是否勾選)
}

/**
 * 攝影機項目介面
 */
export interface CameraItem {
  CityId: number
  City: string
  DocGuid: string
  CameraId: number
  CameraNo: string
  CameraName: string
  IsSpin: boolean // 是否輪巡
  WantToBot: boolean // 是否推播
  IsLock: boolean // 鎖定視角
  HLSUrl: string // 即時攝影機影像
  CurrentPointId: number | null // 當前攝影機預置點
  CurrentPointDateTime: string | null
  CameraPoints: CameraPoint[]
}

/**
 * 排序順序類型
 */
export type SortOrder = 'ascending' | 'descending' | null

