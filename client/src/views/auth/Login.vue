<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>农业灾害预警与应急响应系统</h2>
        <p> Agricultural Disaster Warning and Emergency Response System</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username" :error="loginErrors.username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
            @input="loginErrors.username = ''"
            @focus="loginErrors.username = ''"
          />
        </el-form-item>
        
        <el-form-item prop="password" :error="loginErrors.password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
            @input="loginErrors.password = ''"
            @focus="loginErrors.password = ''"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="userStore.loading"
            @click="handleLogin"
          >
            {{ userStore.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref()

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 记住密码
const rememberMe = ref(false)

// 登录错误信息
const loginErrors = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    // 清空之前的错误
    loginErrors.username = ''
    loginErrors.password = ''
    
    const result = await userStore.login(loginForm)
    if (result.success) {
      // 如果记住密码，保存到localStorage
      if (rememberMe.value) {
        localStorage.setItem('rememberedUsername', loginForm.username)
      } else {
        localStorage.removeItem('rememberedUsername')
      }
      
      router.push('/')
    } else {
      // 根据错误信息设置对应的错误提示
      const errorMsg = result.error
      if (errorMsg.includes('用户名或密码错误') || errorMsg.includes('用户不存在')) {
        loginErrors.username = '用户名或密码错误'
        loginErrors.password = '用户名或密码错误'
      } else if (errorMsg.includes('账号已被禁用')) {
        loginErrors.username = '账号已被禁用，请联系管理员'
      } else {
        // 其他错误仍然使用弹窗提示
        ElMessage.error(errorMsg)
      }
    }
  } catch (error) {
    console.error('登录验证错误:', error)
  }
}

// 初始化时检查是否有记住的用户名或从注册页面传递的参数
const initLoginForm = () => {
  // 优先检查从注册页面传递的参数
  const { username, password } = route.query
  if (username) {
    loginForm.username = username
    loginForm.password = password || ''
    return
  }
  
  // 检查是否有记住的用户名
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  if (rememberedUsername) {
    loginForm.username = rememberedUsername
    rememberMe.value = true
  }
}

onMounted(() => {
  initLoginForm()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: url('/background.jpg') no-repeat center center fixed;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 8px;
}

.login-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #7f8c8d;
}

.login-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>