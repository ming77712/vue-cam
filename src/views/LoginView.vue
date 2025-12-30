<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md">
      <div class="rounded-lg bg-white p-8 shadow-md">
        <h1 class="mb-6 text-center text-2xl font-semibold text-gray-800">
          攝影機管理系統
        </h1>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-width="80px"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="帳號" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="請輸入帳號"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item label="密碼" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="請輸入密碼"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="w-full"
              :loading="loading"
              @click="handleLogin"
            >
              登入
            </el-button>
          </el-form-item>
        </el-form>

        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="mt-4"
        />

        <!-- 測試帳號資訊 -->
        <el-card class="mt-4" shadow="never">
          <template #header>
            <div class="text-sm font-semibold text-gray-700">測試帳號</div>
          </template>
          <div class="space-y-2 text-sm text-gray-600">
            <div>
              <span class="font-medium">管理者：</span>
              <span class="font-mono">admin</span> /
              <span class="font-mono">admin123</span>
            </div>
            <div>
              <span class="font-medium">操作者：</span>
              <span class="font-mono">operator</span> /
              <span class="font-mono">operator123</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const errorMessage = ref('')

const loginForm = reactive({
  username: '',
  password: '',
})

/**
 * 表單驗證規則
 */
const loginRules: FormRules = {
  username: [
    { required: true, message: '請輸入帳號', trigger: 'blur' },
    { min: 3, max: 20, message: '帳號長度應為 3 到 20 個字元', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度至少 6 個字元', trigger: 'blur' },
  ],
}

/**
 * 處理登入邏輯
 */
async function handleLogin(): Promise<void> {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    errorMessage.value = ''

    try {
      await authStore.login(loginForm.username, loginForm.password)
      // 登入成功後會自動導向到 /cameras
    } catch (error: any) {
      errorMessage.value =
        error.response?.data?.message || '登入失敗，請檢查帳號密碼是否正確'
    } finally {
      loading.value = false
    }
  })
}

// 如果已經登入，直接導向到攝影機頁面
if (authStore.isAuthenticated) {
  router.push('/cameras')
}
</script>

<style scoped></style>

