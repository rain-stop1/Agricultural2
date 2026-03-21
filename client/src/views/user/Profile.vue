<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="avatar-section">
            <el-avatar :size="100" :src="avatarUrl">
              <el-icon :size="50"><User /></el-icon>
            </el-avatar>
            <h2>{{ userInfo.real_name || userInfo.username }}</h2>
            <el-tag :type="userInfo.user_type === 'admin' ? 'danger' : 'success'">
              {{ userInfo.user_type === 'admin' ? '管理员' : '农户' }}
            </el-tag>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">真实姓名</span>
              <span class="value">{{ userInfo.real_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号</span>
              <span class="value">{{ userInfo.phone || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">所在地区</span>
              <span class="value">{{ userInfo.region || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间</span>
              <span class="value">{{ formatDate(userInfo.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账号状态</span>
              <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'" size="small">
                {{ userInfo.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </div>
          </div>

          <el-divider />

          <div class="action-section">
            <el-button type="primary" @click="showEditDialog = true" style="width: 100%;">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
            <el-button @click="showPasswordDialog = true" style="width: 100%; margin-top: 10px;">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-button>
          </div>
        </el-card>

        <!-- 统计卡片 -->
        <el-card class="stats-card" v-if="isFarmer">
          <template #header>
            <h3>我的统计</h3>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
                <el-icon :size="24"><MapLocation /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.fieldCount }}</div>
                <div class="stat-label">地块数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon" style="background: #f0f9ff; color: #67c23a;">
                <el-icon :size="24"><Crop /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.cropCount }}</div>
                <div class="stat-label">作物数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
                <el-icon :size="24"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.lossReportCount }}</div>
                <div class="stat-label">损失报告</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
                <el-icon :size="24"><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.emergencyCount }}</div>
                <div class="stat-label">应急方案</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息和活动 -->
      <el-col :span="16">
        <!-- 最近活动 -->
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <h3>最近活动</h3>
              <el-button text @click="loadActivities">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-timeline v-if="activities.length > 0">
            <el-timeline-item
              v-for="activity in activities"
              :key="activity.id"
              :timestamp="formatDateTime(activity.created_at)"
              :type="getActivityType(activity.type)"
              placement="top"
            >
              <el-card>
                <div class="activity-content">
                  <el-icon :size="20" :color="getActivityColor(activity.type)">
                    <component :is="getActivityIcon(activity.type)" />
                  </el-icon>
                  <div class="activity-text">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-desc">{{ activity.description }}</div>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-else description="暂无活动记录" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑资料"
      width="500px"
      @close="handleEditDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="editForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="editForm.region"
            :options="regionOptions"
            placeholder="请选择所在地区"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateProfile" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
      @close="handlePasswordDialogClose"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="submitting">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Edit,
  Lock,
  MapLocation,
  Crop,
  Document,
  List,
  Refresh,
  DocumentAdd,
  Warning,
  CircleCheck
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { regions } from '@/utils/regions'
import dayjs from 'dayjs'

const userStore = useUserStore()
const isFarmer = computed(() => userStore.user?.user_type === 'farmer')

// 地区选项
const regionOptions = computed(() => {
  return regions.map(r => ({
    value: r.province,
    label: r.province,
    children: r.cities.map(c => ({
      value: c,
      label: c
    }))
  }))
})

// 用户信息
const userInfo = ref({})
const avatarUrl = ref('')

// 统计数据
const stats = ref({
  fieldCount: 0,
  cropCount: 0,
  lossReportCount: 0,
  emergencyCount: 0
})

// 活动记录
const activities = ref([])

// 对话框控制
const showEditDialog = ref(false)
const showPasswordDialog = ref(false)
const submitting = ref(false)

// 编辑表单
const editFormRef = ref(null)
const editForm = reactive({
  real_name: '',
  phone: '',
  region: []
})

const editRules = {
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ]
}

// 密码表单
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户信息
const loadUserInfo = async () => {
  console.log('=== 开始加载用户信息 ===')
  console.log('userStore.user:', userStore.user)
  
  try {
    if (!userStore.user) {
      console.warn('userStore.user 为空，尝试重新获取')
      await userStore.fetchUserInfo()
    }
    
    userInfo.value = { ...userStore.user }
    console.log('userInfo.value:', userInfo.value)
    
    // 初始化编辑表单
    editForm.real_name = userStore.user?.real_name || ''
    editForm.phone = userStore.user?.phone || ''
    
    console.log('editForm 初始化:', {
      real_name: editForm.real_name,
      phone: editForm.phone
    })
    
    // 解析地区
    if (userStore.user?.region) {
      const region = userStore.user.region
      console.log('用户地区:', region)
      console.log('地区类型:', typeof region)
      console.log('地区长度:', region?.length)
      
      // 尝试解析省市
      const provinceMatch = region.match(/([\u4e00-\u9fa5]+省|北京市|天津市|上海市|重庆市)/)
      const cityMatch = region.match(/([\u4e00-\u9fa5]+市)/)
      
      console.log('省份匹配:', provinceMatch)
      console.log('城市匹配:', cityMatch)
      
      if (provinceMatch && cityMatch) {
        // 如果是直辖市，需要特殊处理
        if (['北京市', '天津市', '上海市', '重庆市'].includes(provinceMatch[0])) {
          editForm.region = [provinceMatch[0], cityMatch[0]]
        } else {
          editForm.region = [provinceMatch[0], cityMatch[0]]
        }
        console.log('解析后的地区数组:', editForm.region)
      } else {
        console.warn('地区解析失败，无法匹配省市')
      }
    } else {
      console.warn('用户没有地区信息')
    }
    
    console.log('=== 用户信息加载完成 ===')
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载统计数据
const loadStats = async () => {
  if (!isFarmer.value) return

  try {
    const response = await fetch('/api/farmer/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    const data = await response.json()
    
    if (data.code === 200) {
      stats.value = data.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载活动记录
const loadActivities = async () => {
  // 模拟活动数据
  activities.value = [
    {
      id: 1,
      type: 'field',
      title: '添加了新地块',
      description: '在浙江省杭州市添加了"西湖农场A区"地块',
      created_at: new Date()
    },
    {
      id: 2,
      type: 'loss',
      title: '提交了损失报告',
      description: '上报了台风造成的作物损失',
      created_at: new Date(Date.now() - 86400000)
    },
    {
      id: 3,
      type: 'warning',
      title: '收到灾害预警',
      description: '您的地块所在区域发布了暴雨预警',
      created_at: new Date(Date.now() - 172800000)
    }
  ]
}

// 更新个人资料
const handleUpdateProfile = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const regionStr = editForm.region.length === 2 
        ? `${editForm.region[0]}${editForm.region[1]}` 
        : null

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify({
          real_name: editForm.real_name,
          phone: editForm.phone,
          region: regionStr
        })
      })

      const data = await response.json()

      if (data.code === 200) {
        ElMessage.success('资料更新成功')
        showEditDialog.value = false
        
        // 更新本地用户信息
        userStore.user.real_name = editForm.real_name
        userStore.user.phone = editForm.phone
        userStore.user.region = regionStr
        
        // 同步更新 sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userStore.user))
        
        await loadUserInfo()
      } else {
        ElMessage.error(data.message || '更新失败')
      }
    } catch (error) {
      console.error('更新资料失败:', error)
      ElMessage.error('更新失败')
    } finally {
      submitting.value = false
    }
  })
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(passwordForm)
      })

      const data = await response.json()

      if (data.code === 200) {
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false
        
        // 退出登录
        setTimeout(() => {
          userStore.logout()
        }, 1500)
      } else {
        ElMessage.error(data.message || '修改失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      ElMessage.error('修改失败')
    } finally {
      submitting.value = false
    }
  })
}

// 关闭编辑对话框
const handleEditDialogClose = () => {
  editFormRef.value?.resetFields()
}

// 关闭密码对话框
const handlePasswordDialogClose = () => {
  passwordFormRef.value?.resetFields()
}

// 格式化日期
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const formatDateTime = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

// 获取活动类型
const getActivityType = (type) => {
  const typeMap = {
    field: 'primary',
    loss: 'danger',
    warning: 'warning',
    emergency: 'info'
  }
  return typeMap[type] || 'info'
}

const getActivityColor = (type) => {
  const colorMap = {
    field: '#409eff',
    loss: '#f56c6c',
    warning: '#e6a23c',
    emergency: '#909399'
  }
  return colorMap[type] || '#909399'
}

const getActivityIcon = (type) => {
  const iconMap = {
    field: 'MapLocation',
    loss: 'Document',
    warning: 'Warning',
    emergency: 'List'
  }
  return iconMap[type] || 'Document'
}

// 初始化
onMounted(async () => {
  console.log('=== Profile 页面 onMounted ===')
  console.log('初始 userStore.user:', userStore.user)
  console.log('初始 userStore.token:', userStore.token)
  console.log('初始 userStore.initialized:', userStore.initialized)
  
  // 确保用户信息已加载
  if (!userStore.user) {
    console.log('用户信息为空，调用 checkToken')
    await userStore.checkToken()
    console.log('checkToken 后 userStore.user:', userStore.user)
  }
  
  await loadUserInfo()
  loadStats()
  loadActivities()
  
  console.log('=== Profile 页面初始化完成 ===')
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

/* 个人信息卡片 */
.profile-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.avatar-section {
  text-align: center;
  padding: 20px 0;
}

.avatar-section h2 {
  margin: 15px 0 10px;
  font-size: 24px;
  color: #303133;
}

.info-section {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.action-section {
  padding: 10px 0 0;
}

/* 统计卡片 */
.stats-card {
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 活动卡片 */
.activity-card {
  border-radius: 12px;
  min-height: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.activity-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-text {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 13px;
  color: #909399;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
