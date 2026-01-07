import { ref, nextTick } from 'vue'

/**
 * 可編輯欄位狀態管理 Composable
 * 提供欄位編輯狀態管理，包括開始編輯、儲存、取消等功能
 *
 * @template T - 欄位值的型別
 * @param onSave - 儲存時的回調函數，接收新值作為參數
 * @returns 編輯狀態管理物件
 *
 * @example
 * ```ts
 * // 在元件中使用
 * const {
 *   isEditing,
 *   editingValue,
 *   startEdit,
 *   save,
 *   cancel
 * } = useEditableField<number>((newValue) => {
 *   // 處理儲存邏輯
 *   row.panTime = newValue
 * })
 *
 * // 在模板中
 * <template v-if="isEditing">
 *   <el-input
 *     v-model="editingValue"
 *     @blur="save"
 *     @keyup.enter="save"
 *     @keyup.esc="cancel"
 *   />
 * </template>
 * <template v-else>
 *   <span @click="startEdit(currentValue)">{{ currentValue }}</span>
 * </template>
 * ```
 */
export function useEditableField<T>(onSave?: (value: T) => void) {
  /** 是否正在編輯 */
  const isEditing = ref(false)

  /** 編輯中的值 */
  const editingValue = ref<T | null>(null)

  /** 原始值（用於取消時恢復） */
  const originalValue = ref<T | null>(null)

  /**
   * 開始編輯
   * @param currentValue - 當前值
   */
  function startEdit(currentValue: T): void {
    isEditing.value = true
    editingValue.value = currentValue
    originalValue.value = currentValue

    nextTick(() => {
      // 可以在這裡添加自動聚焦邏輯
    })
  }

  /**
   * 儲存編輯
   * 如果值有變更且提供了 onSave 回調，則呼叫回調函數
   */
  function save(): void {
    if (editingValue.value !== null && editingValue.value !== originalValue.value) {
      onSave?.(editingValue.value)
    }
    reset()
  }

  /**
   * 取消編輯
   * 恢復到原始值
   */
  function cancel(): void {
    reset()
  }

  /**
   * 重置編輯狀態
   */
  function reset(): void {
    isEditing.value = false
    editingValue.value = null
    originalValue.value = null
  }

  return {
    isEditing,
    editingValue,
    startEdit,
    save,
    cancel,
  }
}
