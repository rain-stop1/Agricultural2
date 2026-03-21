<template>
  <div class="admin-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1>欢迎回来，{{ userName }}</h1>
        <p>{{ currentTime }} · 系统运行正常</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" @click="$router.push('/admin/system')">
          <el-icon><Setting /></el-icon>
          系统配置
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 核心统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card primary">
          <div class="stat-header">
            <span class="stat-title">用户总数</span>
            <el-icon class="stat-icon"><User /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-trend up">
              <el-icon><CaretTop /></el-icon>
              <span>+{{ stats.newUsersToday }} 今日新增</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card warning">
          <div class="stat-header">
            <span class="stat-title">活跃预警</span>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-number">{{ stats.activeWarnings }}</div>
            <div class="stat-detail">
              <el-tag type="danger" size="small">重度 {{ stats.severeWarnings }}</el-tag>
              <el-tag type="warning" size="small">中度 {{ stats.moderateWarnings }}</el-tag>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card success">
          <div class="stat-header">
            <span class="stat-title">应急方案</span>
            <el-icon class="stat-icon"><Promotion /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-number">{{ stats.emergencyPlans }}</div>
            <div class="stat-trend">
              <span>{{ stats.activeEmergencies }} 个进行中</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card info">
          <div class="stat-header">
            <span class="stat-title">待处理事项</span>
            <el-icon class="stat-icon"><Document /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-number">{{ stats.pendingTasks }}</div>
            <div class="stat-detail">
              <span>损失报告 {{ stats.pendingReports }}</span>
              <span>资源需求 {{ stats.pendingDemands }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 左侧主要内容 -->
      <el-col :xs="24" :lg="16">
        <!-- 系统概览 -->
        <el-card class="dashboard-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 系统概览</span>
              <el-segmented v-model="overviewPeriod" :options="periodOptions" size="small" />
            </div>
          </template>
          <div class="overview-charts">
            <v-chart class="chart" :option="overviewChartOption" autoresize />
          </div>
        </el-card>

        <!-- 最新预警 -->
        <el-card class="dashboard-card" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span><el-icon><Bell /></el-icon> 最新预警</span>
              <el-button text @click="$router.push('/warning')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <div v-if="recentWarnings.length === 0" class="empty-state">
            <el-empty description="暂无活跃预警" :image-size="100" />
          </div>
          <el-table v-else :data="recentWarnings" style="width: 100%" :show-header="false">
            <el-table-column width="80">
              <template #default="scope">
                <el-tag :type="getWarningType(scope.row.level)" size="large">
                  {{ getWarningLevelText(scope.row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column>
              <template #default="scope">
                <div class="warning-info">
                  <div class="warning-title">{{ scope.row.disaster_type }} - {{ scope.row.region }}</div>
                  <div class="warning-content">{{ scope.row.content }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="150" align="right">
              <template #default="scope">
                <span class="warning-time">{{ formatTime(scope.row.created_at) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 待处理事项 -->
        <el-card class="dashboard-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 待处理事项</span>
              <el-badge :value="stats.pendingTasks" :max="99" />
            </div>
          </template>
          <el-tabs v-model="activeTaskTab">
            <el-tab-pane label="损失报告" name="reports">
              <div v-if="pendingReports.length === 0" class="empty-state">
                <el-empty description="暂无待处理报告" :image-size="100" />
              </div>
              <div v-else class="task-list">
                <div v-for="report in pendingReports" :key="report.id" class="task-item">
                  <div class="task-content">
                    <h4>{{ report.disaster_type }} - {{ report.location }}</h4>
                    <p>上报人：{{ report.reporter }} · 损失金额：¥{{ report.loss_amount.toLocaleString() }}</p>
                  </div>
                  <el-button type="primary" size="small" @click="handleReport(report)">
                    处理
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="资源需求" name="demands">
              <div v-if="pendingDemands.length === 0" class="empty-state">
                <el-empty description="暂无待处理需求" :image-size="100" />
              </div>
              <div v-else class="task-list">
                <div v-for="demand in pendingDemands" :key="demand.id" class="task-item">
                  <div class="task-content">
                    <h4>{{ demand.title }}</h4>
                    <p>需求方：{{ demand.requester }} · 紧急程度：
                      <el-rate v-model="demand.urgency" disabled size="small" />
                    </p>
                  </div>
                  <el-button type="success" size="small" @click="handleDemand(demand)">
                    匹配
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :xs="24" :lg="8">
        <!-- 系统状态 -->
        <el-card class="dashboard-card" shadow="hover">
          <template #header>
            <span><el-icon><Monitor /></el-icon> 系统状态</span>
          </template>
          <div class="system-status">
            <div class="status-item">
              <span class="status-label">数据库</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">天气API</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">存储空间</span>
              <el-progress :percentage="75" :stroke-width="8" />
            </div>
            <div class="status-item">
              <span class="status-label">CPU使用率</span>
              <el-progress :percentage="45" :stroke-width="8" status="success" />
            </div>
            <div class="status-item">
              <span class="status-label">内存使用率</span>
              <el-progress :percentage="62" :stroke-width="8" />
            </div>
          </div>
        </el-card>

        <!-- 数据统计 -->
        <el-card class="dashboard-card" shadow="hover">
          <template #header>
            <span><el-icon><PieChart /></el-icon> 数据统计</span>
          </template>
          <div class="data-stats">
            <v-chart class="chart-small" :option="pieChartOption" autoresize />
          </div>
          <div class="stats-list">
            <div class="stats-item">
              <span class="stats-label">作物类型</span>
              <span class="stats-value">{{ stats.cropTypes }} 种</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">灾害类型</span>
              <span class="stats-value">{{ stats.disasterTypes }} 种</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">地块总数</span>
              <span class="stats-value">{{ stats.totalFields }} 块</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">资源总数</span>
              <span class="stats-value">{{ stats.totalResources }} 个</span>
            </div>
          </div>
        </el-card>

        <!-- 最近活动 -->
        <el-card class="dashboard-card" shadow="hover">
          <template #header>
            <span><el-icon><Clock /></el-icon> 最近活动</span>
          </template>
          <div v-if="recentActivities.length === 0" class="empty-state">
            <el-empty description="暂无活动记录" :image-size="80" />
          </div>
          <el-timeline v-else>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="formatTime(activity.time)"
              :type="activity.type"
              size="large"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { 
  getDashboardStats, 
  getDashboardWarnings, 
  getPendingReports, 
  getPendingDemands,
  getRecentActivities,
  getTrendData
} from '@/api/admin'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userName = computed(() => userStore.user?.real_name || '管理员')
const currentTime = computed(() => dayjs().format('YYYY年MM月DD日 HH:mm'))

const loading = ref(false)

// 统计数据
const stats = reactive({
  totalUsers: 0,
  newUsersToday: 0,
  activeWarnings: 0,
  severeWarnings: 0,
  moderateWarnings: 0,
  emergencyPlans: 0,
  activeEmergencies: 0,
  pendingTasks: 0,
  pendingReports: 0,
  pendingDemands: 0,
  cropTypes: 0,
  disasterTypes: 0,
  totalFields: 0,
  totalResources: 0,
  userDistribution: {
    admin: 0,
    farmer: 0
  }
})

// 时间周期选项
const overviewPeriod = ref('week')
const periodOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]

// 趋势数据
const trendData = reactive({
  dates: [],
  warnings: [],
  emergencies: [],
  reports: []
})

// 最新预警
const recentWarnings = ref([])

// 待处理报告
const pendingReports = ref([])

// 待处理需求
const pendingDemands = ref([])

// 最近活动
const recentActivities = ref([])

const activeTaskTab = ref('reports')

// 灾害类型映射
const disasterTypeMap = {
  'drought': '干旱',
  'flood': '洪涝',
  'typhoon': '台风',
  'hail': '冰雹',
  'frost': '霜冻',
  'heat': '高温',
  'cold': '低温',
  'wind': '大风',
  'pest': '病虫害',
  'waterlogging': '内涝',
  'snow': '暴雪',
  'fog': '大雾'
}

// 转换灾害类型
const getDisasterTypeName = (code) => {
  return disasterTypeMap[code] || code || '未知'
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getDashboardStats()
    if (response.code === 200) {
      Object.assign(stats, response.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.warning('部分统计数据加载失败')
  }
}

// 加载预警数据
const loadWarnings = async () => {
  try {
    const response = await getDashboardWarnings(5)
    if (response.code === 200 && Array.isArray(response.data)) {
      recentWarnings.value = response.data.map(item => ({
        id: item.id,
        disaster_type: item.disasterType?.type_name || item.disaster_type || '未知',
        region: item.region || '未知地区',
        level: item.warning_level,
        content: item.warning_content || item.content || '暂无详情',
        created_at: item.created_at
      }))
    }
  } catch (error) {
    console.error('加载预警数据失败:', error)
    recentWarnings.value = []
  }
}

// 加载待处理报告
const loadPendingReports = async () => {
  try {
    const response = await getPendingReports(5)
    if (response.code === 200 && Array.isArray(response.data)) {
      pendingReports.value = response.data.map(item => ({
        id: item.id,
        disaster_type: getDisasterTypeName(item.disaster_type),
        location: item.location || '未知地点',
        reporter: item.reporter || '匿名',
        loss_amount: parseFloat(item.loss_amount) || 0,
        created_at: item.created_at
      }))
    }
  } catch (error) {
    console.error('加载待处理报告失败:', error)
    pendingReports.value = []
  }
}

// 加载待处理需求
const loadPendingDemands = async () => {
  try {
    const response = await getPendingDemands(5)
    if (response.code === 200 && Array.isArray(response.data)) {
      pendingDemands.value = response.data.map(item => ({
        id: item.id,
        title: item.title || item.resource_type || '资源需求',
        requester: item.requester || '匿名',
        urgency: Math.min(5, Math.max(1, parseInt(item.urgency) || 3)),
        created_at: item.created_at
      }))
    }
  } catch (error) {
    console.error('加载待处理需求失败:', error)
    pendingDemands.value = []
  }
}

// 加载最近活动
const loadActivities = async () => {
  try {
    const response = await getRecentActivities(10)
    if (response.code === 200 && Array.isArray(response.data)) {
      recentActivities.value = response.data.map(item => ({
        id: item.id,
        content: item.action || item.content || '系统活动',
        time: item.created_at,
        type: item.log_type || 'info'
      }))
    }
  } catch (error) {
    console.error('加载最近活动失败:', error)
    recentActivities.value = []
  }
}

// 加载趋势数据
const loadTrendData = async (period) => {
  console.log('🔍 加载趋势数据, period:', period)
  try {
    const response = await getTrendData(period)
    console.log('📊 趋势数据响应:', response)
    if (response.code === 200 && response.data) {
      // 使用数组解构确保是普通数组而不是Proxy
      trendData.dates = [...(response.data.dates || [])]
      trendData.warnings = [...(response.data.warnings || [])]
      trendData.emergencies = [...(response.data.emergencies || [])]
      trendData.reports = [...(response.data.reports || [])]
      console.log('✅ 趋势数据已更新:', {
        dates: trendData.dates,
        warnings: trendData.warnings,
        emergencies: trendData.emergencies,
        reports: trendData.reports
      })
    }
  } catch (error) {
    console.error('❌ 加载趋势数据失败:', error)
    trendData.dates = []
    trendData.warnings = []
    trendData.emergencies = []
    trendData.reports = []
  }
}

// 监听周期变化
watch(overviewPeriod, (newPeriod) => {
  loadTrendData(newPeriod)
})

// 系统概览图表
const overviewChartOption = computed(() => {
  // 确保数据是普通数组
  const dates = trendData.dates ? [...trendData.dates] : []
  const warnings = trendData.warnings ? [...trendData.warnings] : []
  const emergencies = trendData.emergencies ? [...trendData.emergencies] : []
  const reports = trendData.reports ? [...trendData.reports] : []
  
  console.log('📈 图表配置计算:', {
    dates,
    warnings,
    emergencies,
    reports,
    datesLength: dates.length,
    warningsLength: warnings.length
  })
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['预警数量', '应急响应', '损失报告']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '预警数量',
        type: 'bar',
        data: warnings,
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '应急响应',
        type: 'bar',
        data: emergencies,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '损失报告',
        type: 'bar',
        data: reports,
        itemStyle: { color: '#409eff' }
      }
    ]
  }
})

// 饼图配置
const pieChartOption = computed(() => {
  const farmerCount = stats.userDistribution?.farmer || 0
  const adminCount = stats.userDistribution?.admin || 0
  const total = farmerCount + adminCount
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0',
      data: ['农户', '管理员']
    },
    series: [
      {
        name: '用户类型',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 14
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: total > 0 ? [
          { value: farmerCount, name: '农户', itemStyle: { color: '#67c23a' } },
          { value: adminCount, name: '管理员', itemStyle: { color: '#409eff' } }
        ] : [
          { value: 1, name: '暂无数据', itemStyle: { color: '#dcdfe6' } }
        ]
      }
    ]
  }
})

// 工具函数
const getWarningType = (level) => {
  const map = { light: 'info', moderate: 'warning', severe: 'danger' }
  return map[level] || 'info'
}

const getWarningLevelText = (level) => {
  const map = { light: '轻度', moderate: '中度', severe: '重度' }
  return map[level] || '未知'
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadWarnings(),
      loadPendingReports(),
      loadPendingDemands(),
      loadActivities(),
      loadTrendData(overviewPeriod.value)
    ])
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

const handleReport = (report) => {
  // 跳转到损失报告详情页
  window.open(`/loss?id=${report.id}`, '_blank')
}

const handleDemand = (demand) => {
  // 跳转到资源匹配页
  window.open(`/resources?id=${demand.id}`, '_blank')
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadWarnings(),
      loadPendingReports(),
      loadPendingDemands(),
      loadActivities(),
      loadTrendData(overviewPeriod.value)
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-dashboard {
  padding: 0;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 20px;
}

.welcome-content h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.welcome-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-card.primary {
  border-left: 4px solid #409eff;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  font-size: 24px;
  color: #c0c4cc;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 12px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-detail {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #606266;
}

.dashboard-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-charts {
  height: 300px;
}

.chart {
  height: 100%;
  width: 100%;
}

.chart-small {
  height: 200px;
  width: 100%;
}

.warning-info {
  padding: 4px 0;
}

.warning-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.warning-content {
  font-size: 13px;
  color: #606266;
}

.warning-time {
  font-size: 12px;
  color: #909399;
}

.task-list {
  max-height: 300px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
  margin-bottom: 12px;
  transition: background 0.3s;
}

.task-item:hover {
  background: #ecf5ff;
}

.task-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.task-content p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

@media (max-width: 768px) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.system-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.data-stats {
  margin-bottom: 16px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.stats-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
