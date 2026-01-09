<template>
  <div class="flex flex-col gap-6 p-4 sm:p-3">
    <!-- 標題與登出按鈕 -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold text-gray-800 sm:text-lg">攝影機設定</h1>
      <div class="flex items-center gap-3 sm:gap-4">
        <span class="text-xs text-gray-600 sm:text-sm">{{ authStore.username }}</span>
        <el-button type="danger" size="small" @click="handleLogout">登出</el-button>
      </div>
    </div>

    <!-- 搜尋與操作工具列 -->
    <div class="flex flex-col gap-6 items-start">
      <!-- 搜尋框 -->
      <el-select
        v-model="searchKeywords"
        multiple
        filterable
        clearable
        collapse-tags
        placeholder="搜尋攝影機 (名稱、編號、縣市、預置點)"
        class="!w-80"
      >
        <el-option-group
          v-for="group in groupedSearchOptions"
          :key="group.label"
          :label="group.label"
        >
          <el-option
            v-for="item in group.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-option-group>
      </el-select>

      <!-- 操作按鈕群組 -->
      <div class="flex flex-wrap gap-6">
        <!-- 管理者可以新增/刪除攝影機 -->
        <template v-if="authStore.isAdmin">
          <el-button type="success" @click="handleAddCamera">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增攝影機
          </el-button>
          <el-button type="danger" @click="handleDeleteCamera" :disabled="!hasSelectedCameras">
            <el-icon class="mr-1"><Delete /></el-icon>
            刪除攝影機
          </el-button>
        </template>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="handleSave"
          class="breathing-button w-full sm:w-auto !ml-0 md:!ml-3"
        >
          儲存變更
        </el-button>
      </div>
    </div>

    <!-- 桌面版表格 -->
    <div class="hidden md:block">
      <el-table
        :data="pagedCameras"
        border
        style="width: 100%"
        :default-sort="{ prop: sortState.prop, order: sortState.order }"
        :row-class-name="rowClassName"
        @sort-change="onSortChange"
        @selection-change="handleSelectionChange"
      >
        <!-- 選擇欄（僅管理者可見） -->
        <el-table-column v-if="authStore.isAdmin" type="selection" width="55" />
        <el-table-column
          prop="CameraName"
          label="攝影機"
          sortable="custom"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="WantToBot"
          label="推播"
          sortable="custom"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              :model-value="row.WantToBot"
              :disabled="!authStore.isAuthenticated"
              @update:model-value="(val: boolean) => handlePushEnabledChange(row.CameraId, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="輪巡" sortable="custom" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.IsSpin"
              :disabled="!authStore.isAuthenticated"
              @update:model-value="(val: boolean) => handleIsSpinChange(row.CameraId, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="鎖定視角" width="160" align="center">
          <template #default="{ row }">
            <el-select
              :model-value="row.IsLock ? row.CurrentPointId : null"
              placeholder="未鎖定"
              clearable
              :disabled="!authStore.isAuthenticated"
              @change="(val: number | undefined) => handleLockViewChange(row.CameraId, val)"
              @clear="() => handleLockViewChange(row.CameraId, undefined)"
            >
               <el-option
                v-for="point in row.CameraPoints"
                :key="point.CameraPointId"
                :label="point.CameraPointName"
                :value="point.CameraPointId"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="預置點" min-width="320">
          <template #default="{ row }">
            <PresetCell
              :presets="row.CameraPoints"
              :is-authenticated="authStore.isAuthenticated"
              :is-admin="authStore.isAdmin"
              :is-dirty="isRowDirty(row.CameraId)"
              @preset-change="(presetId, checked) => handlePresetChange(row.CameraId, presetId, checked)"
              @view-preset="(preset) => handleViewPreset(row.CameraId, preset)"
              @edit-presets="() => handleEditPresets(row)"
              @reset-presets="() => resetPresets(row.CameraId)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>


    <!-- 行動版卡片列表 -->
    <div class="block md:hidden">
      <CameraCardList
        :cameras="pagedCameras"
        :is-authenticated="authStore.isAuthenticated"
        :is-admin="authStore.isAdmin"
        :is-dirty="isRowDirty"
        :selected-camera-ids="selectedCameraIds"
        @push-enabled-change="handlePushEnabledChange"
        @preset-change="handlePresetChange"
        @view-preset="(cameraId, preset) => handleViewPreset(cameraId, preset)"
        @edit-presets="handleEditPresets"
        @reset-presets="resetPresets"
        @is-spin-change="handleIsSpinChange"
        @lock-view-change="handleLockViewChange"
        @selection-change="handleMobileSelectionChange"
      />
    </div>

    <!-- 分頁 -->
    <div class="mt-3 flex justify-center">
      <el-pagination
        background
        :layout="'prev, pager, next'"
        :page-size="pageSize"
        :current-page="currentPage"
        :total="filteredCameras.length"
        :small="isMobile"
        @current-change="onPageChange"
      />
    </div>

    <!-- 預置點視角與點位圖對話框 -->
    <PresetViewDialog
      v-model:visible="showPresetViewDialog"
      :preset-view="currentPresetView"
      :is-admin="authStore.isAdmin"
      @image-upload="handleImageUpload"
    />

    <!-- 編輯預置點對話框 -->
    <EditPresetDialog
      v-model:visible="showEditPresetDialog"
      :camera-id="editPresetForm.cameraId"
      :presets="editPresetForm.presets"
      @save="handleSaveEditPresets"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { SortOrder } from '../types/camera'
import type { CameraItem, CameraPoint } from '../types/camera'
import PresetCell from '../components/PresetCell.vue'
import CameraCardList from '../components/CameraCardList.vue'
import EditPresetDialog from '../components/EditPresetDialog.vue'
import PresetViewDialog, { type PresetViewData } from '../components/PresetViewDialog.vue'
import { saveCameraChanges } from '../api/camera'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useResponsive, useEditableField } from '../composables'

const authStore = useAuthStore()

const cameras = ref<CameraItem[]>([
  {
    CityId: 630000,
    City: '臺北市',
    DocGuid: '000-0000-00000',
    CameraId: 1,
    CameraNo: 'CAM_01',
    CameraName: '大門口一號',
    IsSpin: true,
    WantToBot: true,
    IsLock: false,
    HLSUrl: 'URL',
    CurrentPointId: 1,
    CurrentPointDateTime: '2026/01/08 14:15',
    CameraPoints: [
      {
        CameraPointId: 123,
        DocGuid: '000-0000-00000',
        CameraPointNo: 1,
        CameraPointName: '中油',
        CameraPointAreaPic: '/image/camerapoint/cam_01-1.png',
        CameraPointScenePic: '/api/v1/camerapoint/scene?docguid=000-0000-00000',
        IsSpinToTarget: true,
        ChangePointSec: 10,
        Schedule: [
          {
            StartTime: '09:30:00.000',
            EndTime: '09:35:00.000',
            IsEnabled: true,
          },
          {
            StartTime: '10:30:00.000',
            EndTime: '10:35:00.000',
            IsEnabled: true,
          },
        ],
        Checked: true,
      },
      {
        CameraPointId: 155,
        DocGuid: '000-0000-00000',
        CameraPointNo: 2,
        CameraPointName: '中石化',
        CameraPointAreaPic: '/image/camerapoint/cam_01-1.png',
        CameraPointScenePic: '/api/v1/camerapoint/scene?docguid=000-0000-00000',
        IsSpinToTarget: true,
        ChangePointSec: 30,
        Schedule: [
          {
            StartTime: '09:30:00.000',
            EndTime: '09:35:00.000',
            IsEnabled: true,
          },
          {
            StartTime: '10:30:00.000',
            EndTime: '10:35:00.000',
            IsEnabled: true,
          },
        ],
        Checked: false,
      },
    ],
  },
])

const originalCameras = ref<CameraItem[]>(JSON.parse(JSON.stringify(cameras.value)) as CameraItem[])

const searchKeywords = ref<string[]>([])

const sortState = reactive<{
  prop: keyof CameraItem | null
  order: SortOrder
}>({
  prop: null,
  order: null,
})

const currentPage = ref(1)
const pageSize = ref(10)

// Dialog 狀態
const showEditPresetDialog = ref(false)
const showPresetViewDialog = ref(false)

const editPresetForm = reactive<{
  cameraId: number
  presets: CameraPoint[]
}>({
  cameraId: 0,
  presets: [],
})

const currentPresetView = ref<PresetViewData | null>(null)

// 儲存狀態
const saving = ref(false)

// 攝影機選擇狀態
const selectedCameraIds = ref<Set<number>>(new Set())

// 圖片上傳暫存
const imageUploads = ref<
  Array<{
    cameraId: number
    presetId: number
    type: 'view' | 'location'
    file: File
  }>
>([])

// 響應式狀態
const { isMobile } = useResponsive()

/**
 * 搜尋選項分組
 */
const groupedSearchOptions = computed(() => {
  const cities = new Set<string>()
  const cameraNos = new Set<string>()
  const cameraNames = new Set<string>()
  const pointNames = new Set<string>()

  cameras.value.forEach((camera) => {
    if (camera.City) cities.add(camera.City)
    if (camera.CameraNo) cameraNos.add(camera.CameraNo)
    if (camera.CameraName) cameraNames.add(camera.CameraName)
    camera.CameraPoints.forEach((point) => {
      if (point.CameraPointName) pointNames.add(point.CameraPointName)
    })
  })

  return [
    {
      label: '縣市',
      options: Array.from(cities).map((c) => ({ label: c, value: c })),
    },
    {
      label: '攝影機名稱',
      options: Array.from(cameraNames).map((c) => ({ label: c, value: c })),
    },
    {
      label: '攝影機編號',
      options: Array.from(cameraNos).map((c) => ({ label: c, value: c })),
    },
    {
      label: '預置點',
      options: Array.from(pointNames).map((c) => ({ label: c, value: c })),
    },
  ]
})

/**
 * 過濾並排序攝影機列表
 * @returns 過濾和排序後的攝影機陣列
 */
const filteredCameras = computed(() => {
  let result = [...cameras.value]

  if (searchKeywords.value.length > 0) {
    result = result.filter((item) => {
      // 多條件過濾：需滿足所有選中的關鍵字
      return searchKeywords.value.every((keyword) => {
        const k = keyword.toLowerCase()
        const basicMatch =
          item.City?.toLowerCase().includes(k) ||
          item.CameraNo?.toLowerCase().includes(k) ||
          item.CameraName?.toLowerCase().includes(k)

        const pointMatch = item.CameraPoints.some((p) =>
          p.CameraPointName?.toLowerCase().includes(k),
        )

        return basicMatch || pointMatch
      })
    })
  }

  if (sortState.prop && sortState.order) {
    const prop = sortState.prop
    const factor = sortState.order === 'ascending' ? 1 : -1
    result.sort((a, b) => {
      const aVal = a[prop]
      const bVal = b[prop]

      if (aVal === bVal) return 0
      if (aVal > bVal) return factor
      return -factor
    })
  }

  return result
})

/**
 * 分頁後的攝影機列表
 * @returns 當前頁面的攝影機陣列
 */
const pagedCameras = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCameras.value.slice(start, end)
})

/**
 * 檢查是否有選擇的攝影機
 */
const hasSelectedCameras = computed(() => selectedCameraIds.value.size > 0)

/**
 * 檢查是否有變更需要儲存
 * @returns 若有變更則返回 true，否則返回 false
 */
const hasChanges = computed(() => {
  // 檢查是否有任何攝影機的 checkbox, 轉向時間 或推播狀態有變更
  const hasDirtyRows = cameras.value.some((camera) => isRowDirty(camera.CameraId))
  // 檢查是否有圖片上傳
  const hasImageUploads = imageUploads.value.length > 0

  return hasDirtyRows || hasImageUploads
})

/**
 * 檢查指定攝影機的設定是否有變更
 * @param cameraId - 攝影機 ID
 * @returns 若有變更則返回 true，否則返回 false
 */
function isRowDirty(cameraId: number): boolean {
  const current = cameras.value.find((c) => c.CameraId === cameraId)
  const original = originalCameras.value.find((c) => c.CameraId === cameraId)
  if (!current || !original) return false

  // 檢查推播狀態
  if (current.WantToBot !== original.WantToBot) return true

  // 檢查是否輪巡
  if (current.IsSpin !== original.IsSpin) return true

  // 檢查鎖定視角
  if (current.IsLock !== original.IsLock) return true
  if (current.CurrentPointId !== original.CurrentPointId) return true

  // 檢查預置點數量是否改變（新增或刪除）
  if (current.CameraPoints.length !== original.CameraPoints.length) return true

  // 檢查預置點的 checkbox 狀態、名稱和轉向時間
  const originalPresetMap = new Map(original.CameraPoints.map((p) => [p.CameraPointId, p]))

  for (const preset of current.CameraPoints) {
    const originalPreset = originalPresetMap.get(preset.CameraPointId)

    // 新增的預置點（原始資料中沒有此 ID）
    if (!originalPreset) return true

    // 檢查 checkbox 狀態
    if (originalPreset.Checked !== preset.Checked) return true

    // 檢查名稱是否改變
    if (originalPreset.CameraPointName !== preset.CameraPointName) return true

    // 檢查轉向時間是否改變
    if (originalPreset.ChangePointSec !== preset.ChangePointSec) return true

    // 檢查排程是否改變
    const originalSchedule = originalPreset.Schedule || []
    const currentSchedule = preset.Schedule || []

    if (originalSchedule.length !== currentSchedule.length) return true

    for (let i = 0; i < originalSchedule.length; i++) {
      const oSched = originalSchedule[i]
      const cSched = currentSchedule[i]
      if (
        oSched.StartTime !== cSched.StartTime ||
        oSched.EndTime !== cSched.EndTime ||
        oSched.IsEnabled !== cSched.IsEnabled
      ) {
        return true
      }
    }
  }

  return false
}

/**
 * 設定表格列的 class name（用於標示已修改的列）
 * @param param0 - 包含 row 物件的參數
 * @returns 若該列有變更則返回 'camera-row--dirty'，否則返回空字串
 */
function rowClassName({ row }: { row: CameraItem }): string {
  return isRowDirty(row.CameraId) ? 'camera-row--dirty' : ''
}

/**
 * 處理表格排序變更
 * @param param0 - 包含 prop 和 order 的參數
 */
function onSortChange({
  prop,
  order,
}: {
  prop: keyof CameraItem | undefined
  order: SortOrder
}): void {
  sortState.prop = prop ?? null
  sortState.order = order
}

/**
 * 處理分頁變更
 * @param page - 新的頁碼
 */
function onPageChange(page: number): void {
  currentPage.value = page
}

/**
 * 處理表格選擇變更
 * @param selection - 選中的攝影機列表
 */
function handleSelectionChange(selection: CameraItem[]): void {
  selectedCameraIds.value = new Set(selection.map((camera) => camera.CameraId))
}

/**
 * 處理行動版選擇變更
 * @param cameraId - 攝影機 ID
 * @param selected - 是否選中
 */
function handleMobileSelectionChange(cameraId: number, selected: boolean): void {
  if (selected) {
    selectedCameraIds.value.add(cameraId)
  } else {
    selectedCameraIds.value.delete(cameraId)
  }
  // 觸發響應式更新
  selectedCameraIds.value = new Set(selectedCameraIds.value)
}

/**
 * 處理登出
 */
function handleLogout(): void {
  authStore.logout()
}

/**
 * 處理推播狀態變更
 * @param cameraId - 攝影機 ID
 * @param enabled - 是否推播
 */
function handlePushEnabledChange(cameraId: number, enabled: boolean): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (camera) {
    camera.WantToBot = enabled
    // 觸發響應式更新
    cameras.value = [...cameras.value]
  }
}

/**
 * 處理是否輪巡狀態變更
 * @param cameraId - 攝影機 ID
 * @param isSpin - 是否輪巡
 */
function handleIsSpinChange(cameraId: number, isSpin: boolean): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (camera) {
    camera.IsSpin = isSpin
    // 觸發響應式更新
    cameras.value = [...cameras.value]
  }
}

/**
 * 處理鎖定視角變更
 * @param cameraId - 攝影機 ID
 * @param presetId - 預置點 ID (若為 undefined 代表解鎖)
 */
function handleLockViewChange(cameraId: number, presetId: number | undefined): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (camera) {
    if (presetId) {
      // 鎖定指定預置點
      camera.IsLock = true
      camera.CurrentPointId = presetId
      // 當攝影機視角有選擇預置點時, 該攝影機的輪巡開關要切換成關閉
      camera.IsSpin = false
    } else {
      // 解鎖
      camera.IsLock = false
      // 保持 CurrentPointId 不變或清空都可，這裡選擇保持以便之後若是切換回鎖定能有預設值，
      // 但根據需求描述 "鎖定視角是可以選擇當前該攝影機有的預置點作為選項"，
      // 這裡選擇: 如果解鎖，CurrentPointId 不變，只是 IsLock 變 false
    }
    // 觸發響應式更新
    cameras.value = [...cameras.value]
  }
}

/**
 * 處理預置點勾選狀態變更
 * @param cameraId - 攝影機 ID
 * @param presetId - 預置點 ID
 * @param checked - 是否勾選
 */
function handlePresetChange(cameraId: number, presetId: number, checked: boolean): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (camera) {
    const preset = camera.CameraPoints.find((p) => p.CameraPointId === presetId)
    if (preset) {
      preset.Checked = checked
      // 觸發響應式更新
      cameras.value = [...cameras.value]
    }
  }
}

/**
 * 處理新增攝影機
 */
function handleAddCamera(): void {
  ElMessageBox.prompt('請輸入攝影機名稱', '新增攝影機', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '請輸入攝影機名稱',
  })
    .then(({ value }) => {
      const newCameraId = Math.max(...cameras.value.map((c) => c.CameraId), 0) + 1
      const newCamera: CameraItem = {
        CityId: 630000,
        City: '臺北市',
        DocGuid: '000-0000-00000',
        CameraId: newCameraId,
        CameraNo: `CAM_${newCameraId}`,
        CameraName: value,
        IsSpin: false,
        WantToBot: false,
        IsLock: false,
        HLSUrl: '',
        CurrentPointId: null,
        CurrentPointDateTime: null,
        CameraPoints: [],
      }
      cameras.value.push(newCamera)
      originalCameras.value.push(JSON.parse(JSON.stringify(newCamera)) as CameraItem)
      ElMessage.success(`已新增攝影機：${value}`)
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 處理刪除攝影機
 */
function handleDeleteCamera(): void {
  if (selectedCameraIds.value.size === 0) {
    ElMessage.warning('請先選擇要刪除的攝影機')
    return
  }

  const cameraNames = cameras.value
    .filter((c) => selectedCameraIds.value.has(c.CameraId))
    .map((c) => c.CameraName)
    .join('、')

  ElMessageBox.confirm(`確定要刪除以下攝影機嗎？\n${cameraNames}`, '刪除攝影機', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      cameras.value = cameras.value.filter((c) => !selectedCameraIds.value.has(c.CameraId))
      originalCameras.value = originalCameras.value.filter(
        (c) => !selectedCameraIds.value.has(c.CameraId),
      )
      selectedCameraIds.value.clear()
      ElMessage.success('刪除成功')
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 處理編輯預置點（針對特定攝影機）
 * @param row - 攝影機資料
 */
function handleEditPresets(row: CameraItem): void {
  editPresetForm.cameraId = row.CameraId
  editPresetForm.presets = JSON.parse(JSON.stringify(row.CameraPoints)) as CameraPoint[]
  showEditPresetDialog.value = true
}

/**
 * 處理儲存編輯的預置點
 * @param cameraId - 攝影機 ID
 * @param presets - 預置點列表
 */
function handleSaveEditPresets(cameraId: number, presets: CameraPoint[]): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (camera) {
    camera.CameraPoints = JSON.parse(JSON.stringify(presets)) as CameraPoint[]
    // 不更新 originalCameras，讓預置點的新增/刪除/修改被視為變更
    // 這樣 isDirty 會檢測到變更，使用者需要點擊「儲存變更」才會真正保存
  }
}

/**
 * 復原指定攝影機的預置點設定到原始狀態
 * @param cameraId - 攝影機 ID
 */
function resetPresets(cameraId: number): void {
  const current = cameras.value.find((c) => c.CameraId === cameraId)
  const original = originalCameras.value.find((c) => c.CameraId === cameraId)
  if (!current || !original) return

  current.WantToBot = original.WantToBot
  current.IsSpin = original.IsSpin
  current.IsLock = original.IsLock
  current.CurrentPointId = original.CurrentPointId
  current.CameraPoints = original.CameraPoints.map((p) => ({ ...p }))
}

/**
 * 處理查看預置點視角與點位圖
 * @param cameraId - 攝影機 ID
 * @param preset - 預置點資料
 */
function handleViewPreset(cameraId: number, preset: CameraPoint): void {
  const camera = cameras.value.find((c) => c.CameraId === cameraId)
  if (!camera) return

  currentPresetView.value = {
    cameraId,
    cameraName: camera.CameraName,
    presetId: preset.CameraPointId,
    presetName: preset.CameraPointName,
    hlsUrl: camera.HLSUrl,
    viewImage: preset.CameraPointScenePic, // 假設視角圖
    locationImage: preset.CameraPointAreaPic, // 假設可視圖
    // 實際應用中可以從 API 取得：
    // viewImage: `/api/cameras/${cameraId}/presets/${preset.id}/view`,
    // locationImage: `/api/cameras/${cameraId}/presets/${preset.id}/location`,
  }

  showPresetViewDialog.value = true
}

/**
 * 處理圖片上傳
 * @param cameraId - 攝影機 ID
 * @param presetId - 預置點 ID
 * @param type - 圖片類型
 * @param file - 上傳的檔案
 */
function handleImageUpload(
  cameraId: number,
  presetId: number,
  type: 'view' | 'location',
  file: File,
): void {
  // 移除舊的上傳記錄（如果有的話）
  const index = imageUploads.value.findIndex(
    (upload) =>
      upload.cameraId === cameraId && upload.presetId === presetId && upload.type === type,
  )
  if (index > -1) {
    imageUploads.value.splice(index, 1)
  }

  // 加入新的上傳記錄
  imageUploads.value.push({
    cameraId,
    presetId,
    type,
    file,
  })
}

/**
 * 處理儲存所有變更
 */
async function handleSave(): Promise<void> {
  if (!hasChanges.value) return

  saving.value = true

  try {
    // 收集所有變更的資料
    const changes: Array<any> = []

    // 找出所有有變更的攝影機
    cameras.value.forEach((camera) => {
      if (isRowDirty(camera.CameraId)) {
        // 為了確保資料完整性，送出該攝影機的所有主要設定
        // 實際專案中可能只需要送出變更欄位，這裡簡化為送出完整狀態或特定結構

        // 收集所有預置點資料 (包含排程)
        const presetsData = camera.CameraPoints.map(p => ({
          CameraPointId: p.CameraPointId,
          CameraPointName: p.CameraPointName,
          Checked: !!p.Checked,
          ChangePointSec: p.ChangePointSec,
          IsSpinToTarget: p.IsSpinToTarget,
          Schedule: p.Schedule
        }))

        changes.push({
          cameraId: camera.CameraId,
          pushEnabled: camera.WantToBot,
          isSpin: camera.IsSpin,
          isLock: camera.IsLock,
          currentPointId: camera.CurrentPointId,
          presets: presetsData
        })
      }
    })

    // 準備 FormData 來上傳圖片
    const formData = new FormData()

    // 加入變更資料
    formData.append('changes', JSON.stringify(changes))

    // 加入圖片上傳
    imageUploads.value.forEach(
      (
        upload: { cameraId: number; presetId: number; type: 'view' | 'location'; file: File },
        index: number,
      ) => {
        formData.append(`images[${index}][cameraId]`, upload.cameraId.toString())
        formData.append(`images[${index}][presetId]`, upload.presetId.toString())
        formData.append(`images[${index}][type]`, upload.type)
        formData.append(`images[${index}][file]`, upload.file)
      },
    )

    // 呼叫 API 儲存
    await saveCameraChanges(formData)

    // 更新原始資料
    originalCameras.value = JSON.parse(JSON.stringify(cameras.value)) as CameraItem[]

    // 清空圖片上傳記錄
    imageUploads.value = []

    // 顯示成功訊息
    ElMessage.success('儲存成功')
  } catch (error) {
    // 顯示錯誤訊息
    ElMessage.error('儲存失敗，請稍後再試')
    console.error('Save failed:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* 已修改的列背景色 */
:deep(.camera-row--dirty) > td {
  background-color: #fff7d6;
}

@keyframes breathing {
  0%,
  100% {
    background: linear-gradient(135deg, #2b7acc 0%, #409eff 100%);
  }
  50% {
    background: linear-gradient(135deg, #66b1ff 0%, #b3d8ff 100%);
  }
}

.breathing-button:not(.is-disabled):not(.is-loading) {
  animation: breathing 2s ease-in-out infinite;
  border: none;
}
</style>
