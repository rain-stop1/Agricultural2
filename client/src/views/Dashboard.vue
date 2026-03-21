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
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.warningCount }}</div>
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
        <!-- 数据趋势 -->
        <el-card class="chart-card" shadow="hover">
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
        <el-card class="warnings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Bell /></el-icon> 最新预警</span>
              <el-button text @click="$router.push('/warning')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-empty v-if="warnings.length === 0" description="暂无预警信息" />
          <div v-else class="warnings-list">
            <div v-for="warning in warnings" :key="warning.id" class="warning-item">
              <div class="warning-level" :class="'level-' + warning.level">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="warning-info">
                <div class="warning-title">{{ warning.disaster_type }}</div>
                <div class="warning-region">{{ warning.region }}</div>
                <div class="warning-time">{{ formatTime(warning.created_at) }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 待办事项 -->
        <el-card class="todos-card" shadow="hover">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
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

// 处理待办点击
const handleTodoClick = (todo) => {
  router.push(todo.path)
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getFarmerStats()
    if (response.code === 200) {
      Object.assign(stats, response.data)
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

// 加载预警数据(使用现有API)
const loadWarnings = async () => {
  try {
    const { getWarningList } = await import('@/api/warning')
    const response = await getWarningList({ limit: 5, status: 'active' })
    if (response.code === 200) {
      warnings.value = response.data.list || response.data || []
    }
  } catch (error) {
    console.error('加载预警数据失败:', error)
  }
}

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadFields(),
      loadTodos(),
      loadTrends(trendPeriod.value),
      loadWeather(),
      loadWarnings()
    ])
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

.warnings-list {
  .warning-item {
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
    
    .warning-level {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      
      &.level-severe {
        background-color: #fef0f0;
        color: #F56C6C;
      }
      
      &.level-moderate {
        background-color: #fdf6ec;
        color: #E6A23C;
      }
      
      &.level-light {
        background-color: #f4f4f5;
        color: #909399;
      }
    }
    
    .warning-info {
      flex: 1;
      
      .warning-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .warning-region,
      .warning-time {
        font-size: 12px;
        color: #909399;
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
</style>
