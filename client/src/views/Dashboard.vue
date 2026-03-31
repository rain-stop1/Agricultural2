<template>
  <div class="farmer-dashboard">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>欢迎回来，{{ userName }}</h2>
          <p class="time">{{ currentTime }}</p>
        </div>
        <div class="weather-info" v-if="weatherData">
          <el-icon :size="40"><Sunny /></el-icon>
          <div class="weather-text">
            <div class="temp">{{ weatherData.temperature }}°C</div>
            <div class="desc">{{ weatherData.weather_text }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#67C23A"><MapLocation /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.fieldCount }}</div>
              <div class="stat-label">我的地块</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#409EFF"><Grape /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.cropCount }}</div>
              <div class="stat-label">我的作物</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card" @click="handleWarningClick">
          <div class="stat-content" style="cursor: pointer;">
            <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.warningCount || 0 }}</div>
              <div class="stat-label">我的地区预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#E6A23C"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.lossReportCount }}</div>
              <div class="stat-label">损失报告</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#909399"><Box /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.resourceCount }}</div>
              <div class="stat-label">资源需求</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#95D475"><List /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.emergencyCount }}</div>
              <div class="stat-label">应急预案</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 左侧 -->
      <el-col :xs="24" :lg="16">
        <!-- 数据趋势 - 仅管理员可见 -->
        <el-card v-if="userStore.isAdmin" class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 数据趋势</span>
              <el-segmented v-model="trendPeriod" :options="periodOptions" size="small" />
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="trendChartOption" autoresize />
          </div>
        </el-card>

        <!-- 我的地块概况 -->
        <el-card class="fields-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><MapLocation /></el-icon> 我的地块概况</span>
              <el-button text @click="$router.push('/fields')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-empty v-if="fields.length === 0" description="暂无地块数据" />
          <div v-else class="fields-list">
            <div v-for="field in fields" :key="field.id" class="field-item">
              <div class="field-status" :class="field.hasWarning ? 'warning' : 'healthy'">
                <el-icon v-if="field.hasWarning"><Warning /></el-icon>
                <el-icon v-else><CircleCheck /></el-icon>
              </div>
              <div class="field-info">
                <div class="field-name">{{ field.field_name }}</div>
                <div class="field-detail">
                  {{ field.location }} · {{ field.area }}亩 · {{ field.cropName || '未种植' }}
                </div>
              </div>
              <el-tag v-if="field.hasWarning" type="danger" size="small">预警中</el-tag>
              <el-tag v-else type="success" size="small">健康</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧 -->
      <el-col :xs="24" :lg="8">
        <!-- 最新预警 -->
        <el-card class="warnings-card" shadow="hover" :class="{ 'has-warnings': warnings.length > 0 }">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <el-icon><Bell /></el-icon> 
                最新预警
                <el-tag v-if="warnings.length > 0" type="danger" size="small" effect="dark" class="warning-count">
                  {{ warnings.length }}条
                </el-tag>
              </span>
              <el-button text @click="$router.push('/warning')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-empty v-if="warnings.length === 0" description="暂无预警信息" />
          <div v-else class="warnings-list">
            <div v-for="warning in warnings" :key="warning.id" class="warning-item" :class="'level-' + (warning.warning_level || warning.level)" @click="showWarningDetail(warning)">
              <div class="warning-header">
                <div class="warning-level-badge" :class="'badge-' + (warning.warning_level || warning.level)">
                  {{ getWarningLevelText(warning.warning_level || warning.level) }}
                </div>
                <div class="warning-disaster-type">{{ warning.disaster_type || '气象灾害' }}</div>
                <div class="warning-time">{{ formatTime(warning.created_at || warning.start_time) }}</div>
              </div>
              <div class="warning-content">
                <div class="warning-region">
                  <el-icon><Location /></el-icon>
                  {{ warning.region }}
                </div>
                <div class="warning-desc" v-if="warning.warning_content">
                  {{ warning.warning_content }}
                </div>
              </div>
              <div class="warning-footer">
                <el-tag :type="getWarningType(warning.warning_level || warning.level)" size="small" effect="light">
                  {{ getWarningLevelText(warning.warning_level || warning.level) }}预警
                </el-tag>
                <span class="view-detail">查看详情 <el-icon><ArrowRight /></el-icon></span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 待办事项 - 仅管理员可见 -->
        <el-card v-if="userStore.isAdmin" class="todos-card" shadow="hover">
          <template #header>
            <span><el-icon><List /></el-icon> 待办事项</span>
          </template>
          <el-empty v-if="todos.length === 0" description="暂无待办事项" />
          <div v-else class="todos-list">
            <div v-for="todo in todos" :key="todo.id" class="todo-item" @click="handleTodoClick(todo)">
              <el-icon class="todo-icon" :color="todo.color"><component :is="todo.icon" /></el-icon>
              <div class="todo-text">{{ todo.text }}</div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="warningDialogVisible"
      :title="warningDialogTitle"
      width="900px"
      top="5vh"
    >
      <div class="warning-details">
        <el-empty v-if="regionWarnings.length === 0" description="暂无预警信息" />
        <el-table v-else :data="regionWarnings" height="500" stripe>
          <el-table-column prop="region" label="预警区域" width="150" />
          <el-table-column prop="disaster_type" label="灾害类型" width="120">
            <template #default="{ row }">
              {{ row.disaster_type || '气象灾害' }}
            </template>
          </el-table-column>
          <el-table-column prop="warning_content" label="预警内容">
            <template #default="{ row }">
              {{ row.warning_content || row.description || '无详细信息' }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="预警等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getWarningType(row.level || row.warning_level)">
                {{ getWarningLevelText(row.level || row.warning_level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发布时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.created_at || row.start_time) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import {
  Sunny, MapLocation, Grape, Warning, Document, Box, List, TrendCharts, Bell, ArrowRight, CircleCheck, Location
} from '@element-plus/icons-vue'
import {
  getFarmerStats,
  getMyFieldsSummary,
  getMyTodos,
  getMyTrends,
  getCurrentWeather
} from '@/api/farmer'

const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => userStore.user?.real_name || '农户')
const currentTime = computed(() => dayjs().format('YYYY年MM月DD日 HH:mm'))

const loading = ref(false)

// 天气数据
const weatherData = ref(null)

// 统计数据
const stats = reactive({
  fieldCount: 0,
  cropCount: 0,
  warningCount: 0,
  lossReportCount: 0,
  resourceCount: 0,
  emergencyCount: 0
})

// 趋势周期
const trendPeriod = ref('week')
const periodOptions = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]

// 趋势数据
const trendData = reactive({
  dates: [],
  warnings: [],
  lossReports: [],
  emergencies: []
})

// 地块列表
const fields = ref([])

// 预警列表
const warnings = ref([])

// 地区预警列表（用于对话框）
const regionWarnings = ref([])

// 预警详情对话框
const warningDialogVisible = ref(false)
const warningDialogTitle = ref('')

// 待办事项
const todos = ref([])

// 趋势图表配置
const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['预警', '损失报告', '应急预案']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: trendData.dates
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '预警',
      type: 'line',
      data: trendData.warnings,
      smooth: true,
      itemStyle: { color: '#F56C6C' }
    },
    {
      name: '损失报告',
      type: 'line',
      data: trendData.lossReports,
      smooth: true,
      itemStyle: { color: '#E6A23C' }
    },
    {
      name: '应急预案',
      type: 'line',
      data: trendData.emergencies,
      smooth: true,
      itemStyle: { color: '#409EFF' }
    }
  ]
}))

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 获取预警类型
const getWarningType = (level) => {
  const typeMap = {
    light: 'info',
    moderate: 'warning',
    severe: 'danger'
  }
  return typeMap[level] || 'info'
}

// 获取预警等级文本
const getWarningLevelText = (level) => {
  const textMap = {
    light: '轻度',
    moderate: '中度',
    severe: '重度'
  }
  return textMap[level] || '未知'
}

// 处理待办点击
const handleTodoClick = (todo) => {
  router.push(todo.path)
}

// 显示预警详情
const showWarningDetail = (warning) => {
  ElMessageBox.alert(
    `
      <div style="padding: 20px;">
        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 18px; font-weight: bold; color: #303133;">${warning.region}</span>
          <el-tag type="${getWarningType(warning.warning_level || warning.level)}" size="large" effect="dark">
            ${getWarningLevelText(warning.warning_level || warning.level)}预警
          </el-tag>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #909399;">灾害类型：</span>
          <span style="color: #303133; font-weight: 500;">${warning.disaster_type || '气象灾害'}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #909399;">发布时间：</span>
          <span style="color: #303133;">${dayjs(warning.created_at || warning.start_time).format('YYYY-MM-DD HH:mm:ss')}</span>
        </div>
        <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <div style="color: #606266; line-height: 1.8;">${warning.warning_content || '暂无详细内容'}</div>
        </div>
      </div>
    `,
    '预警详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了',
      customClass: 'warning-detail-dialog'
    }
  )
}

// 处理预警点击
const handleWarningClick = async () => {
  try {
    // 首先获取用户的地块信息
    const fieldsResponse = await getMyFieldsSummary(100) // 获取所有地块
    let addressParts = []
    let dialogTitle = '我的地区预警'
    
    if (fieldsResponse.code === 200 && fieldsResponse.data && fieldsResponse.data.length > 0) {
      // 提取地块的省份和城市
      fieldsResponse.data.forEach(field => {
        if (field.location) {
          // 提取省份（如 "北京市" 或 "广东省"）
          const provinceMatch = field.location.match(/^(.+?[省市自治区])/)
          if (provinceMatch) {
            addressParts.push(provinceMatch[1])
          }
          // 提取城市（如 "北京" 或 "深圳"）
          const cityMatch = field.location.match(/^.+?[省市自治区](.+?)[市州盟]/)
          if (cityMatch) {
            addressParts.push(cityMatch[1])
          }
        }
      })
      
      const uniqueAddresses = [...new Set(addressParts)]
      addressParts = uniqueAddresses
      
      if (addressParts.length > 0) {
        dialogTitle = addressParts.length > 1 ? '我的地块所在地区预警' : `${addressParts[0]}地区预警`
      }
    }
    
    // 如果没有地块，使用用户地区
    if (addressParts.length === 0) {
      const userRegion = userStore.user?.region || ''
      if (userRegion) {
        addressParts = [userRegion]
        dialogTitle = `${userRegion}地区预警`
      } else {
        ElMessage.warning('请先设置您的地区信息或添加地块')
        return
      }
    }

    // 设置对话框标题
    warningDialogTitle.value = dialogTitle
    
    // 加载这些地区的最新批序预警列表
    const { getWarningList } = await import('@/api/warning')
    const response = await getWarningList({ regions: addressParts.join(','), status: 'active', latestBatch: true })
    if (response.code === 200) {
      // 确保 regionWarnings 始终是一个数组
      const data = response.data
      if (Array.isArray(data.warnings)) {
        regionWarnings.value = data.warnings
      } else if (Array.isArray(data.list)) {
        regionWarnings.value = data.list
      } else if (Array.isArray(data)) {
        regionWarnings.value = data
      } else {
        regionWarnings.value = []
      }
    } else {
      regionWarnings.value = []
    }
  } catch (error) {
    console.error('加载地区预警失败:', error)
    ElMessage.error('加载地区预警失败')
    regionWarnings.value = []
  }
  
  // 显示对话框
  warningDialogVisible.value = true
}

// 加载统计数据
const loadStats = async () => {
  try {
    console.log('开始加载统计数据...')
    const response = await getFarmerStats()
    console.log('统计数据响应:', response)
    if (response.code === 200) {
      console.log('统计数据:', response.data)
      Object.assign(stats, response.data)
      console.log('更新后的stats:', stats)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载地块概况
const loadFields = async () => {
  try {
    const response = await getMyFieldsSummary(5)
    if (response.code === 200) {
      fields.value = response.data
    }
  } catch (error) {
    console.error('加载地块概况失败:', error)
  }
}

// 加载待办事项
const loadTodos = async () => {
  try {
    const response = await getMyTodos()
    if (response.code === 200) {
      todos.value = response.data
    }
  } catch (error) {
    console.error('加载待办事项失败:', error)
  }
}

// 加载趋势数据
const loadTrends = async (period) => {
  try {
    const response = await getMyTrends(period)
    if (response.code === 200) {
      trendData.dates = response.data.dates || []
      trendData.warnings = response.data.warnings || []
      trendData.lossReports = response.data.lossReports || []
      trendData.emergencies = response.data.emergencies || []
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error)
  }
}

// 加载天气数据
const loadWeather = async () => {
  try {
    const response = await getCurrentWeather()
    if (response.code === 200) {
      weatherData.value = response.data
    }
  } catch (error) {
    console.error('加载天气数据失败:', error)
  }
}

// 加载预警数据(基于用户地块所在地区获取最新批次的预警)
const loadWarnings = async () => {
  try {
    console.log('开始加载预警数据...')
    // 首先获取用户的地块信息
    const fieldsResponse = await getMyFieldsSummary(100) // 获取所有地块
    console.log('地块信息:', fieldsResponse)
    
    if (fieldsResponse.code === 200 && fieldsResponse.data && fieldsResponse.data.length > 0) {
      // 提取地块的省份和城市
      const addressParts = []
      fieldsResponse.data.forEach(field => {
        // 尝试从location字段中提取省份和城市
        if (field.location) {
          // 提取省份（如 "北京市" 或 "广东省"）
          const provinceMatch = field.location.match(/^(.+?[省市自治区])/)
          if (provinceMatch) {
            addressParts.push(provinceMatch[1])
          }
          // 提取城市（如 "北京" 或 "深圳"）
          const cityMatch = field.location.match(/^.+?[省市自治区](.+?)[市州盟]/)
          if (cityMatch) {
            addressParts.push(cityMatch[1])
          }
        }
      })
      
      const uniqueAddresses = [...new Set(addressParts)]
      console.log('提取的地区:', uniqueAddresses)
      
      if (uniqueAddresses.length > 0) {
        const { getWarningList } = await import('@/api/warning')
        // 获取这些地区的最新批次预警
        const response = await getWarningList({
          regions: uniqueAddresses.join(','),
          status: 'active',
          latestBatch: true,
          limit: 5
        })
        console.log('预警数据响应:', response)
        
        if (response.code === 200) {
          warnings.value = response.data.warnings || response.data.list || response.data || []
          console.log('加载的预警数量:', warnings.value.length)
          // 更新预警数量
          stats.warningCount = warnings.value.length
          console.log('更新后的预警数量:', stats.warningCount)
        }
      } else {
        // 如果没有地块，使用用户地区
        const userRegion = userStore.user?.region || ''
        if (userRegion) {
          const { getWarningList } = await import('@/api/warning')
          const response = await getWarningList({
            region: userRegion,
            status: 'active',
            latestBatch: true,
            limit: 5
          })
          if (response.code === 200) {
            warnings.value = response.data.warnings || response.data.list || response.data || []
            // 更新预警数量
            stats.warningCount = warnings.value.length
          }
        }
      }
    } else {
      // 如果没有地块，使用用户地区
      const userRegion = userStore.user?.region || ''
      if (userRegion) {
        const { getWarningList } = await import('@/api/warning')
        const response = await getWarningList({
          region: userRegion,
          status: 'active',
          latestBatch: true,
          limit: 5
        })
        if (response.code === 200) {
            warnings.value = response.data.warnings || response.data.list || response.data || []
            // 更新预警数量
            stats.warningCount = warnings.value.length
          }
      }
    }
  } catch (error) {
    console.error('加载预警数据失败:', error)
  }
}

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    // 先加载基础统计数据
    await loadStats()
    // 然后加载其他数据，确保loadWarnings在最后执行，覆盖统计数据中的预警数量
    await Promise.all([
      loadFields(),
      loadTodos(),
      loadTrends(trendPeriod.value),
      loadWeather()
    ])
    // 最后加载预警数据，确保它覆盖统计数据中的预警数量
    await loadWarnings()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 监听周期变化
watch(trendPeriod, (newPeriod) => {
  loadTrends(newPeriod)
})

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.farmer-dashboard {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 16px;
  
  .welcome-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .welcome-text {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
      
      .time {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
    
    .weather-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .weather-text {
        .temp {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
        }
        
        .desc {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  margin-bottom: 16px;
  
  :deep(.el-card__body) {
    padding: 16px;
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .stat-icon {
      font-size: 32px;
    }
    
    .stat-info {
      flex: 1;
      
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
    }
  }
}

.chart-card,
.fields-card,
.warnings-card,
.todos-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
}

.chart-container {
  height: 300px;
  
  .chart {
    width: 100%;
    height: 100%;
  }
}

.fields-list {
  .field-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &:not(:last-child) {
      margin-bottom: 8px;
    }
    
    .field-status {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      
      &.healthy {
        background-color: #f0f9ff;
        color: #67C23A;
      }
      
      &.warning {
        background-color: #fef0f0;
        color: #F56C6C;
      }
    }
    
    .field-info {
      flex: 1;
      
      .field-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .field-detail {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.warnings-card {
  &.has-warnings {
    :deep(.el-card__header) {
      background: linear-gradient(135deg, #fef0f0 0%, #fff5f5 100%);
    }
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .warning-count {
      margin-left: 4px;
    }
  }
}

.warnings-list {
  .warning-item {
    padding: 16px;
    border-radius: 12px;
    transition: all 0.3s;
    cursor: pointer;
    border: 2px solid transparent;
    margin-bottom: 12px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &.level-severe {
      background: linear-gradient(135deg, #fef0f0 0%, #fff5f5 100%);
      border-color: #F56C6C;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
      }
    }
    
    &.level-moderate {
      background: linear-gradient(135deg, #fdf6ec 0%, #fff9f0 100%);
      border-color: #E6A23C;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
      }
    }
    
    &.level-light {
      background: linear-gradient(135deg, #f4f4f5 0%, #f9f9fa 100%);
      border-color: #909399;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(144, 147, 153, 0.2);
      }
    }
    
    .warning-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      
      .warning-level-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        color: white;
        
        &.badge-severe {
          background: linear-gradient(135deg, #F56C6C 0%, #ff8585 100%);
        }
        
        &.badge-moderate {
          background: linear-gradient(135deg, #E6A23C 0%, #ffc266 100%);
        }
        
        &.badge-light {
          background: linear-gradient(135deg, #909399 0%, #b0b3b8 100%);
        }
      }
      
      .warning-disaster-type {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
        color: #303133;
      }
      
      .warning-time {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .warning-content {
      margin-bottom: 12px;
      
      .warning-region {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
        
        .el-icon {
          color: #409EFF;
          font-size: 18px;
        }
      }
      
      .warning-desc {
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .warning-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px dashed rgba(0, 0, 0, 0.1);
      
      .view-detail {
        font-size: 12px;
        color: #409EFF;
        display: flex;
        align-items: center;
        gap: 4px;
        
        .el-icon {
          font-size: 12px;
        }
      }
    }
  }
}

.todos-list {
  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &:not(:last-child) {
      margin-bottom: 8px;
    }
    
    .todo-icon {
      font-size: 20px;
    }
    
    .todo-text {
      flex: 1;
      color: #303133;
    }
    
    .todo-arrow {
      color: #909399;
    }
  }
}

/* 预警详情对话框样式 */
.warning-details {
  width: 100%;
}

.warning-details :deep(.el-table) {
  width: 100%;
}

@media (max-width: 768px) {
  .farmer-dashboard {
    padding: 12px;
  }
  
  .welcome-card .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

/* 预警详情对话框样式 */
:global(.warning-detail-dialog) {
  .el-message-box__content {
    padding: 0;
  }
  
  .el-message-box__message {
    padding: 0;
  }
}
</style>
