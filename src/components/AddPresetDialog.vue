<template>
  <el-dialog
    :model-value="visible"
    title="新增預置點"
    :width="dialogWidth"
    class="add-preset-dialog"
    @update:model-value="(val: boolean) => $emit('update:visible', val)"
    @close="handleClose"
  >
    <div v-if="cameraName" class="mb-4 text-sm text-gray-600">
      攝影機：<span class="font-semibold">{{ cameraName }}</span>
    </div>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="預置點名稱" prop="name">
        <el-input v-model="form.name" placeholder="例如：預置點4" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">確定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

/**
 * 新增預置點對話框組件
 * 用於為特定攝影機新增預置點
 */

const props = defineProps<{
  visible: boolean
  cameraId: number
  cameraName: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [cameraId: number, name: string]
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '請輸入預置點名稱', trigger: 'blur' },
    { min: 1, max: 20, message: '名稱長度應為 1 到 20 個字元', trigger: 'blur' },
  ],
}

/**
 * 響應式對話框寬度
 */
const dialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth < 640) {
      return '95%'
    } else if (window.innerWidth < 768) {
      return '90%'
    }
    return '400px'
  }
  return '400px'
})

/**
 * 處理表單提交
 */
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (!valid) return

    emit('submit', props.cameraId, form.name)
    handleClose()
  })
}

/**
 * 處理對話框關閉
 */
function handleClose(): void {
  form.name = ''
  formRef.value?.clearValidate()
  emit('update:visible', false)
}
</script>

<style scoped></style>
