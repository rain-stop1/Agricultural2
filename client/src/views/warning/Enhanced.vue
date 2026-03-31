<template>
  <div class="enhanced-warning-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card severe clickable" @click="showRiskDetails('high')">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="40"><WarningFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ weatherStatistics.high || 0 }}</div>
                <div class="stat-label">高风险区域</div>
                <div class="stat-sub">{{ activeWarnings.filter(w => w.warning_level === 'severe').length || 0 }} 条预警记录</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card moderate clickable" @click="showRiskDetails('medium')">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="40"><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ weatherStatistics.medium || 0 }}</div>
                <div class="stat-label">中风险区域</div>
                <div class="stat-sub">{{ activeWarnings.filter(w => w.warning_level === 'moderate').length || 0 }} 条预警记录</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card light clickable" @click="showRiskDetails('normal')">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="40"><InfoFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ weatherStatistics.normal || 0 }}</div>
                <div class="stat-label">正常区域</div>
                <div class="stat-sub">{{ weatherStatistics.light || 0 }} 条轻度预警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card total clickable" @click="showRiskDetails('all')">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="40"><DataAnalysis /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ weatherStatistics.total || 0 }}</div>
                <div class="stat-label">监测城市</div>
                <div class="stat-sub">{{ totalWarningsCount || 0 }} 条总预警</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 地图和预警列表区域 -->
    <el-row :gutter="20" class="main-content">
      <el-col :span="18">
        <!-- 预警地图 -->
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <h3>预警地图</h3>
              <div class="map-controls">
                <el-select v-model="mapFilter.level" placeholder="筛选等级" size="small" @change="renderLeafletMap">
                  <el-option label="全部" value="" />
                  <el-option label="轻度" value="light" />
                  <el-option label="中度" value="moderate" />
                  <el-option label="重度" value="severe" />
                </el-select>
                <el-switch 
                  v-model="showWeather" 
                  size="small"
                  active-text="显示天气"
                  @change="renderLeafletMap"
                />
                <el-button size="small" @click="refreshMap">
                  <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button type="info" size="small" @click="showWeatherLayerPanel = !showWeatherLayerPanel">
                  <el-icon><Cloudy /></el-icon>
                  气象图层
                </el-button>
                <el-button type="primary" size="small" @click="weatherDialogVisible = true">
                  <el-icon><Sunny /></el-icon>
                  实时天气
                </el-button>
                <span v-if="isLoadingWeather" class="loading-indicator">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  加载中 {{ weatherLoadingProgress }}/{{ weatherLoadingTotal }}
                </span>
                <span v-else-if="Object.keys(weatherData).length > 0" class="cache-indicator">
                  <el-icon><SuccessFilled /></el-icon>
                  已加载 {{ Object.keys(weatherData).length }} 个城市
                </span>
              </div>
            </div>
          </template>
          
          <div class="map-container" ref="mapContainer">
            <!-- 气象图层控制面板 -->
            <transition name="slide-fade">
              <div v-if="showWeatherLayerPanel" class="weather-layer-panel">
                <div class="panel-header">
                  <span>气象图层</span>
                  <el-icon @click="showWeatherLayerPanel = false" class="close-icon" style="cursor: pointer;"><Close /></el-icon>
                </div>
                <div class="layer-list">
                  <div 
                    v-for="layer in weatherLayers" 
                    :key="layer.id"
                    class="layer-item"
                    :class="{ active: activeWeatherLayer === layer.id }"
                  >
                    <div class="layer-info">
                      <el-icon :color="layer.color" size="20">
                        <component :is="layer.icon" />
                      </el-icon>
                      <span class="layer-name">{{ layer.name }}</span>
                    </div>
                    <el-switch 
                      v-model="layer.enabled" 
                      size="small"
                      @change="toggleWeatherLayer(layer.id)"
                    />
                  </div>
                </div>
                <div class="layer-opacity">
                  <div class="opacity-label">
                    <span>透明度</span>
                    <span>{{ Math.round(weatherLayerOpacity * 100) }}%</span>
                  </div>
                  <el-slider 
                    v-model="weatherLayerOpacity" 
                    :min="0" 
                    :max="1" 
                    :step="0.1"
                    @change="updateWeatherLayerOpacity"
                  />
                </div>
              </div>
            </transition>

            <div class="map-legend">
              <div class="legend-item">
                <span class="legend-color severe"></span>
                <span>重度预警</span>
              </div>
              <div class="legend-item">
                <span class="legend-color moderate"></span>
                <span>中度预警</span>
              </div>
              <div class="legend-item">
                <span class="legend-color light"></span>
                <span>轻度预警</span>
              </div>
            </div>
            <!-- Leaflet 地图渲染在 mapContainer 上，无需额外占位内容 -->
          </div>
        </el-card>


      </el-col>

      <el-col :span="6">
        <!-- 实时预警列表 -->
        <el-card class="warning-list-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <h3>实时预警</h3>
                <el-tag type="danger" size="small" effect="dark">{{ totalWarningsCount }}</el-tag>
              </div>
            </div>
          </template>
          
          <el-tabs v-model="activeWarningTab" class="warning-tabs">
            <el-tab-pane label="气象局预警" name="meteorological_bureau">
              <div class="realtime-warnings">
                <el-empty 
                  v-if="meteorologicalWarnings.length === 0" 
                  description="暂无气象局预警记录"
                  :image-size="100"
                />
                
                <div 
                  v-for="warning in meteorologicalWarnings" 
                  :key="warning.id"
                  class="warning-item"
                  :class="warning.warning_level"
                >
                  <div class="warning-header">
                    <div class="warning-tags">
                      <el-tag :type="getWarningType(warning.warning_level)" size="small">
                        {{ getWarningLevelText(warning.warning_level) }}
                      </el-tag>
                      <el-tag type="info" size="small">
                        气象局
                      </el-tag>
                    </div>
                    <span class="warning-time">{{ formatTime(warning.created_at) }}</span>
                  </div>
                  
                  <div class="warning-content">
                    <h4>{{ warning.warning_content }}</h4>
                    <p class="warning-location">{{ warning.region }}</p>
                  </div>
                  
                  <div class="warning-actions">
                    <el-button size="small" text @click="viewWeatherDetail(warning)">详情</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="阈值设定预警" name="threshold">
              <div class="realtime-warnings">
                <el-empty 
                  v-if="thresholdWarnings.length === 0" 
                  description="暂无阈值设定预警记录"
                  :image-size="100"
                />
                
                <div 
                  v-for="warning in thresholdWarnings" 
                  :key="warning.id"
                  class="warning-item"
                  :class="warning.warning_level"
                >
                  <div class="warning-header">
                    <div class="warning-tags">
                      <el-tag :type="getWarningType(warning.warning_level)" size="small">
                        {{ getWarningLevelText(warning.warning_level) }}
                      </el-tag>
                      <el-tag type="success" size="small">
                        阈值设定
                      </el-tag>
                    </div>
                    <span class="warning-time">{{ formatTime(warning.created_at) }}</span>
                  </div>
                  
                  <div class="warning-content">
                    <h4>{{ warning.warning_content }}</h4>
                    <p class="warning-location">{{ warning.region }}</p>
                  </div>
                  
                  <div class="warning-actions">
                    <el-button size="small" text @click="viewWeatherDetail(warning)">详情</el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>


      </el-col>
    </el-row>

    <!-- 风险区域详情对话框 -->
    <el-dialog
      v-model="riskDialogVisible"
      :title="riskDialogTitle"
      width="900px"
      top="5vh"
    >
      <div class="risk-details">
        <el-table :data="riskCitiesList" height="500" stripe>
          <el-table-column prop="name" label="城市" width="120" />
          <el-table-column label="温度" width="100">
            <template #default="{ row }">
              <span :style="{ color: getTempColor(row.weather.temperature) }">
                {{ Math.round(row.weather.temperature) }}°C
              </span>
            </template>
          </el-table-column>
          <el-table-column label="湿度" width="100">
            <template #default="{ row }">
              {{ row.weather.humidity }}%
            </template>
          </el-table-column>
          <el-table-column label="风速" width="100">
            <template #default="{ row }">
              {{ row.weather.wind_speed }} m/s
            </template>
          </el-table-column>
          <el-table-column label="降雨量" width="100">
            <template #default="{ row }">
              {{ row.weather.rainfall ? row.weather.rainfall.toFixed(1) : 0 }} mm
            </template>
          </el-table-column>
          <el-table-column label="天气" width="120">
            <template #default="{ row }">
              {{ row.weather.weather_text || row.weather.weather_description || row.weather.description || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="风险类型" width="150">
            <template #default="{ row }">
              <el-tag 
                v-for="risk in row.risk.risks" 
                :key="risk"
                :type="row.risk.level === 'severe' ? 'danger' : row.risk.level === 'moderate' ? 'warning' : 'info'"
                size="small"
                style="margin-right: 4px;"
              >
                {{ risk }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag :type="row.risk.level === 'severe' ? 'danger' : row.risk.level === 'moderate' ? 'warning' : row.risk.level === 'light' ? 'info' : 'success'">
                {{ row.risk.level === 'severe' ? '高风险' : row.risk.level === 'moderate' ? '中风险' : row.risk.level === 'light' ? '轻度风险' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedWarning ? '预警详情' : ''"
      width="800px"
    >
      <div v-if="selectedWarning" class="warning-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预警等级">
            <el-tag :type="getWarningType(selectedWarning.warning_level)">
              {{ getWarningLevelText(selectedWarning.warning_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警状态">
            <el-tag :type="getStatusType(selectedWarning.status)">
              {{ getStatusText(selectedWarning.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警区域">
            {{ selectedWarning.region }}
          </el-descriptions-item>
          <el-descriptions-item label="灾害类型">
            {{ selectedWarning.disasterType?.type_name }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatTime(selectedWarning.start_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ selectedWarning.end_time ? formatTime(selectedWarning.end_time) : '未设定' }}
          </el-descriptions-item>
          <el-descriptions-item label="预警内容" :span="2">
            {{ selectedWarning.warning_content }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedWarning.affected_fields && selectedWarning.affected_fields.length > 0" class="affected-section">
          <h4>影响地块</h4>
          <div class="affected-fields">
            <el-tag 
              v-for="field in selectedWarning.affected_fields" 
              :key="field.id"
              class="field-tag"
            >
              {{ field.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 实时天气对话框 -->
    <el-dialog
      v-model="weatherDialogVisible"
      title="实时天气数据"
      width="900px"
      @open="fetchWeatherForDialog"
    >
      <div class="weather-dialog-content">
        <!-- 城市选择 -->
        <div class="city-selector">
          <el-select 
            v-model="selectedCity" 
            placeholder="选择或输入城市" 
            @change="fetchWeatherForDialog"
            style="width: 200px;"
            filterable
            allow-create
            default-first-option
          >
            <el-option
              v-for="city in cityOptions"
              :key="city.value"
              :label="city.label"
              :value="city.value"
            />
          </el-select>
          <el-button type="primary" @click="fetchWeatherForDialog" :loading="loadingWeatherDialog">
            <el-icon><Refresh /></el-icon>
            刷新天气
          </el-button>
        </div>

        <!-- 当前天气 -->
        <el-card v-if="currentWeather" class="current-weather-card" v-loading="loadingWeatherDialog">
          <template #header>
            <h3>{{ cityOptions.find(c => c.value === selectedCity)?.label }} - 实时天气</h3>
            <span class="update-time">更新时间: {{ formatTime(currentWeather.record_time) }}</span>
          </template>
          
          <div class="weather-info-grid">
            <div class="weather-main">
              <div class="temperature-display">
                <span class="temp-value">{{ Math.round(currentWeather.temperature) }}°C</span>
                <span class="weather-desc">{{ currentWeather.weather_text || currentWeather.weather_description || '未知' }}</span>
              </div>
              <div class="weather-icon">
                {{ getWeatherEmoji(currentWeather) }}
              </div>
            </div>
            
            <div class="weather-details">
              <div class="detail-item">
                <span class="label">气压</span>
                <span class="value">{{ currentWeather.air_pressure }} hPa</span>
              </div>
              <div class="detail-item">
                <span class="label">体感温度</span>
                <span class="value">{{ Math.round(currentWeather.temperature - 2) }}°C</span>
              </div>
              <div class="detail-item">
                <span class="label">湿度</span>
                <span class="value">{{ currentWeather.humidity }}%</span>
              </div>
              <div class="detail-item">
                <span class="label">风速</span>
                <span class="value">{{ currentWeather.wind_speed }} m/s</span>
              </div>
              <div class="detail-item">
                <span class="label">风向</span>
                <span class="value">{{ currentWeather.wind_direction || '未知' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">降雨量</span>
                <span class="value">{{ currentWeather.rainfall ? currentWeather.rainfall.toFixed(1) : 0 }} mm</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 未来3天预报 -->
        <div v-if="weatherForecast.length > 0" class="forecast-section">
          <h3>未来3天预报</h3>
          <el-row :gutter="20">
            <el-col :span="8" v-for="(day, index) in weatherForecast" :key="index">
              <el-card class="forecast-card">
                <div class="forecast-date">
                  {{ index === 0 ? '今天' : index === 1 ? '明天' : '后天' }}
                  <span class="date-text">{{ day.date }}</span>
                </div>
                <div class="forecast-icon">
                  {{ getWeatherEmoji({ weather_text: day.weather_text }) }}
                </div>
                <div class="forecast-weather">{{ day.weather_text }}</div>
                <div class="forecast-temp">
                  <span class="temp-high">{{ Math.round(day.temperature_high) }}°</span>
                  <span class="temp-low">{{ Math.round(day.temperature_low) }}°</span>
                </div>
                <div class="forecast-details">
                  <div><el-icon><Drizzling /></el-icon> {{ day.rainfall ? day.rainfall.toFixed(1) : 0 }}mm</div>
                  <div><el-icon><Compass /></el-icon> {{ day.humidity }}%</div>
                  <div><el-icon><Warning /></el-icon> 降雨概率 {{ day.rain_probability !== undefined ? day.rain_probability : 0 }}%</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  WarningFilled, 
  Warning, 
  InfoFilled, 
  DataAnalysis, 
  Refresh, 
  LocationInformation,
  Loading,
  SuccessFilled,
  Sunny,
  Drizzling,
  Compass,
  Close,
  Cloudy
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修复 Leaflet 默认图标路径问题
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

import { getWarningList, cancelWarningRecord, getWarningStatistics } from '@/api/warning'
import { getRealWeather, getWeatherForecast, submitRealWeatherData } from '@/api/weather'
import { disasterTypeApi } from '@/api/disaster-types'
import request from '@/api/request'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 响应式数据
const route = useRoute()
const statistics = ref({})
const warnings = ref([])
const allWarnings = ref([]) // 存储所有预警
const totalWarningsCount = ref(0) // 总预警数（用于显示badge）
const loading = ref(false)
const chartLoading = ref(false)
const pieChartLoading = ref(false)
const detailDialogVisible = ref(false)
const selectedWarning = ref(null)
const mapContainer = ref(null)
const leafletMap = ref(null)
const leafletMarkers = ref([])
const weatherLayer = ref(null) // 气象图层
const weatherData = ref({}) // 存储各城市天气数据
const showWeather = ref(true) // 是否显示天气
const weatherLoadingProgress = ref(0) // 天气加载进度
const weatherLoadingTotal = ref(0) // 总城市数
const isLoadingWeather = ref(false) // 是否正在加载天气
const showWeatherLayerPanel = ref(false) // 是否显示气象图层面板
const activeWeatherLayer = ref(null) // 当前激活的气象图层
const weatherLayerOpacity = ref(0.6) // 气象图层透明度

// 计算属性：根据 region 查询参数过滤预警
const activeWarnings = computed(() => {
  const region = route.query.region
  if (!region) {
    return allWarnings.value
  }
  // 过滤出与用户地区匹配的预警
  return allWarnings.value.filter(warning => {
    const warningRegion = warning.region || warning.region_name || ''
    return warningRegion.includes(region) || region.includes(warningRegion)
  })
})

// 阈值配置缓存
const thresholdConfig = ref({})

// 气象图层配置
const weatherLayers = reactive([
  {
    id: 'temp',
    name: '温度',
    icon: 'Sunny',
    color: '#f56c6c',
    enabled: false,
    url: 'temp_new'
  },
  {
    id: 'precipitation',
    name: '降水',
    icon: 'Drizzling',
    color: '#409eff',
    enabled: false,
    url: 'precipitation_new'
  },
  {
    id: 'clouds',
    name: '云层',
    icon: 'Cloudy',
    color: '#909399',
    enabled: false,
    url: 'clouds_new'
  },
  {
    id: 'wind',
    name: '风速',
    icon: 'Wind',
    color: '#67c23a',
    enabled: false,
    url: 'wind_new'
  },
  {
    id: 'pressure',
    name: '气压',
    icon: 'Compass',
    color: '#e6a23c',
    enabled: false,
    url: 'pressure_new'
  }
])
const weatherStatistics = ref({
  high: 0,      // 高风险区域数
  medium: 0,    // 中风险区域数
  normal: 0,    // 正常区域数
  total: 0      // 总监测城市数
})

// 风险详情对话框
const riskDialogVisible = ref(false)
const riskCitiesList = ref([])
const riskDialogTitle = ref('')

// 实时天气对话框
const weatherDialogVisible = ref(false)
const selectedCity = ref('beijing')
const currentWeather = ref(null)
const weatherForecast = ref([])
const loadingWeatherDialog = ref(false)

// 缓存配置
const CACHE_KEY = 'weather_data_cache'
const CACHE_TIMESTAMP_KEY = 'weather_data_timestamp'
const CACHE_DURATION = 60 * 60 * 1000 // 1小时

// 定时刷新天气数据的定时器
let weatherRefreshTimer = null

// 筛选条件
const mapFilter = reactive({
  level: ''
})

// 趋势周期
const trendPeriod = ref('7')

// 预警标签页
const activeWarningTab = ref('meteorological_bureau')

// 计算属性：气象局预警（使用前端生成的预警数据）
const meteorologicalWarnings = computed(() => {
  return allWarnings.value.filter(warning => warning.source === 'meteorological_bureau')
})

// 计算属性：阈值设定预警（使用前端生成的预警数据）
const thresholdWarnings = computed(() => {
  return allWarnings.value.filter(warning => warning.source === 'threshold' || !warning.source)
})

// 统计数据
const fetchStatistics = async () => {
  try {
    const response = await getWarningStatistics()
    if (response.code === 200) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('获取统计数据错误:', error)
  }
}

// 加载阈值配置
const loadThresholdConfig = async () => {
  try {
    const response = await disasterTypeApi.getDisasterTypes()
    if (response.code === 200) {
      const types = response.data
      const config = {}
      types.forEach(type => {
        if (type.warning_criteria) {
          config[type.type_code] = type.warning_criteria
        }
      })
      thresholdConfig.value = config
      console.log('✅ 加载阈值配置成功:', config)
    }
  } catch (error) {
    console.error('加载阈值配置失败:', error)
  }
}

// 获取预警列表（用于地图显示）
const fetchWarnings = async () => {
  try {
    loading.value = true
    
    // 获取数据库中的预警记录用于地图显示
    const response = await getWarningList({
      page: 1,
      limit: 100
    })
    
    if (response.code === 200) {
      warnings.value = response.data.warnings || []
      console.log(`✓ 获取到 ${warnings.value.length} 条数据库预警记录`)
      
      generateMapPoints()
      renderLeafletMap()
    }
  } catch (error) {
    console.error('获取预警列表错误:', error)
    // 不显示错误提示，因为我们主要使用天气数据生成预警
  } finally {
    loading.value = false
  }
}

// 生成地图点位数据（使用前端生成的预警数据）
const mapPoints = computed(() => {
  return allWarnings.value.map(warning => ({
    ...warning,
    x: Math.random() * 80 + 10, // 10% - 90%
    y: Math.random() * 80 + 10, // 10% - 90%
    level: warning.warning_level,
    content: `${getWarningLevelText(warning.warning_level)}预警: ${warning.warning_content}`
  })).filter(point => !mapFilter.level || point.level === mapFilter.level)
})

// 图表配置
const chartOption = ref({
  title: {
    text: '预警数量趋势',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['轻度', '中度', '重度'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '轻度',
      type: 'line',
      data: [],
      smooth: true,
      itemStyle: { color: '#409eff' }
    },
    {
      name: '中度',
      type: 'line',
      data: [],
      smooth: true,
      itemStyle: { color: '#e6a23c' }
    },
    {
      name: '重度',
      type: 'line',
      data: [],
      smooth: true,
      itemStyle: { color: '#f56c6c' }
    }
  ]
})

// 饼图配置
const pieChartOption = ref({
  title: {
    text: '灾害类型分布',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center'
  },
  series: [
    {
      name: '灾害类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
})

// 生成图表数据（基于实际预警记录）
const generateChartData = () => {
  const days = parseInt(trendPeriod.value)
  const dates = []
  const lightData = []
  const moderateData = []
  const severeData = []
  
  console.log(`📊 开始统计预警趋势，共 ${warnings.value.length} 条预警记录`)
  
  // 如果没有预警数据，显示空图表
  if (warnings.value.length === 0) {
    console.warn('⚠️ 没有预警数据，显示空图表')
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = dayjs().subtract(i, 'day').format('MM-DD')
      dates.push(dateStr)
      lightData.push(0)
      moderateData.push(0)
      severeData.push(0)
    }
  } else {
    // 先看看预警数据的日期范围
    const warningDates = warnings.value.map(w => {
      const date = w.created_at || w.start_time
      return date ? dayjs(date).format('YYYY-MM-DD') : null
    }).filter(d => d)
    
    console.log('预警日期范围:', {
      最早: warningDates.length > 0 ? Math.min(...warningDates.map(d => new Date(d).getTime())) : null,
      最晚: warningDates.length > 0 ? Math.max(...warningDates.map(d => new Date(d).getTime())) : null,
      示例日期: warningDates.slice(0, 5)
    })
    
    // 统计每天的预警数量
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      const dateStr = date.format('MM-DD')
      const fullDateStr = date.format('YYYY-MM-DD')
      dates.push(dateStr)
      
      // 统计当天的预警数量
      let lightCount = 0
      let moderateCount = 0
      let severeCount = 0
      
      warnings.value.forEach(warning => {
        const warningDateStr = warning.created_at || warning.start_time
        if (!warningDateStr) return
        
        const warningDate = dayjs(warningDateStr)
        const warningFullDate = warningDate.format('YYYY-MM-DD')
        
        // 检查预警是否在当天创建
        if (warningFullDate === fullDateStr) {
          if (warning.warning_level === 'light') {
            lightCount++
          } else if (warning.warning_level === 'moderate') {
            moderateCount++
          } else if (warning.warning_level === 'severe') {
            severeCount++
          }
        }
      })
      
      lightData.push(lightCount)
      moderateData.push(moderateCount)
      severeData.push(severeCount)
    }
  }
  
  chartOption.value.xAxis.data = dates
  chartOption.value.series[0].data = lightData
  chartOption.value.series[1].data = moderateData
  chartOption.value.series[2].data = severeData
  
  const totalLight = lightData.reduce((a, b) => a + b, 0)
  const totalModerate = moderateData.reduce((a, b) => a + b, 0)
  const totalSevere = severeData.reduce((a, b) => a + b, 0)
  
  console.log('📈 预警趋势数据已更新:', { 
    时间范围: `近${days}天`,
    轻度: totalLight,
    中度: totalModerate,
    重度: totalSevere,
    总计: totalLight + totalModerate + totalSevere
  })
  
  // 如果所有数据都是0，给出提示
  if (totalLight === 0 && totalModerate === 0 && totalSevere === 0) {
    console.warn(`⚠️ 近${days}天内没有预警记录`)
  }
}

// 生成饼图数据（基于实际天气数据的灾害类型分布）
const generatePieData = () => {
  const disasterTypes = {
    '干旱': 0,
    '洪涝': 0,
    '冻害': 0,
    '高温': 0,
    '大风': 0,
    '正常': 0
  }
  
  // 统计天气数据中的灾害类型
  Object.values(weatherData.value).forEach(weather => {
    const risk = analyzeDisasterRisk(weather)
    
    if (risk.risks.length === 0) {
      disasterTypes['正常']++
    } else {
      risk.risks.forEach(riskType => {
        if (riskType.includes('干旱')) {
          disasterTypes['干旱']++
        } else if (riskType.includes('洪涝') || riskType.includes('降雨')) {
          disasterTypes['洪涝']++
        } else if (riskType.includes('冻')) {
          disasterTypes['冻害']++
        } else if (riskType.includes('高温')) {
          disasterTypes['高温']++
        } else if (riskType.includes('风')) {
          disasterTypes['大风']++
        }
      })
    }
  })
  
  // 如果没有天气数据，使用预警数据
  if (Object.keys(weatherData.value).length === 0) {
    warnings.value.forEach(warning => {
      const type = warning.disasterType?.type_name || '未知'
      if (disasterTypes[type] !== undefined) {
        disasterTypes[type]++
      } else {
        disasterTypes[type] = 1
      }
    })
  }
  
  const data = Object.entries(disasterTypes)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value
    }))
  
  pieChartOption.value.series[0].data = data
  
  console.log('📊 灾害类型分布:', disasterTypes)
}

// 更新图表数据
const updateChartData = () => {
  chartLoading.value = true
  setTimeout(() => {
    generateChartData()
    chartLoading.value = false
  }, 500)
}

const updatePieChart = () => {
  pieChartLoading.value = true
  setTimeout(() => {
    generatePieData()
    pieChartLoading.value = false
  }, 500)
}

// 更新所有图表（在天气数据加载后调用）
const updateAllCharts = () => {
  updateChartData()
  updatePieChart()
}

// 刷新地图
const refreshMap = async () => {
  // 清空现有标记
  leafletMarkers.value.forEach(marker => {
    try {
      marker.remove()
    } catch (e) {
      console.warn('移除标记失败:', e)
    }
  })
  leafletMarkers.value = []
  
  // 清空天气数据
  weatherData.value = {}
  
  // 强制重新加载
  fetchWarnings()
  await addWeatherMarkers(true) // 传入 true 强制重新加载
  
  // 自动同步天气数据到系统并触发预警检测
  await syncWeatherDataToSystem()
}

// 同步天气数据到系统（使用批量接口）
const syncWeatherDataToSystem = async () => {
  try {
    // 同步所有城市的天气数据
    const citiesToSync = Object.keys(weatherData.value)
    if (citiesToSync.length === 0) {
      ElMessage.warning('没有天气数据可同步')
      return
    }
    
    ElMessage.info(`正在同步 ${citiesToSync.length} 个城市的天气数据...`)
    
    // 准备批量提交的数据
    const weatherDataList = []
    for (const cityCode of citiesToSync) {
      const weather = weatherData.value[cityCode]
      if (weather) {
        // 获取城市名称
        const city = getAllCities().find(c => c.code === cityCode)
        const cityName = city ? city.name : cityCode
        
        // 确保天气数据格式正确，包含所有必要字段
        const formattedWeatherData = {
          region: cityName,
          temperature: weather.temperature || 0,
          humidity: weather.humidity || 0,
          rainfall: weather.rainfall || 0,
          wind_speed: weather.wind_speed || 0,
          wind_direction: weather.wind_direction || '无',
          air_pressure: weather.air_pressure || 1013
        }
        
        weatherDataList.push(formattedWeatherData)
      }
    }
    
    if (weatherDataList.length === 0) {
      ElMessage.warning('没有有效的天气数据可同步')
      return
    }
    
    console.log(`批量提交 ${weatherDataList.length} 个城市的天气数据`)
    
    // 使用批量提交接口
    const response = await request({
      url: '/weather/batch',
      method: 'post',
      data: { weatherDataList }
    })
    
    if (response.code === 200) {
      const { batchOrder, cityCount, warningCount } = response.data
      ElMessage.success(`成功同步 ${cityCount} 个城市的天气数据，生成 ${warningCount} 条预警（批序: ${batchOrder}）`)
      
      // 重新获取预警列表，显示最新的预警
      await fetchWarnings()
    } else {
      ElMessage.warning('同步天气数据失败')
    }
  } catch (error) {
    console.error('同步天气数据到系统失败:', error)
    ElMessage.error('同步天气数据到系统失败')
  }
}



// 切换气象图层
const toggleWeatherLayer = (layerId) => {
  if (!leafletMap.value) return

  const layer = weatherLayers.find(l => l.id === layerId)
  if (!layer) return

  // 关闭其他图层
  weatherLayers.forEach(l => {
    if (l.id !== layerId) {
      l.enabled = false
    }
  })

  // 移除现有气象图层
  if (weatherLayer.value) {
    leafletMap.value.removeLayer(weatherLayer.value)
    weatherLayer.value = null
  }

  // 如果选择了新图层，添加到地图
  if (layer.enabled) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
    
    if (!apiKey) {
      ElMessage.error('请配置OpenWeatherMap API密钥')
      layer.enabled = false
      return
    }

    weatherLayer.value = L.tileLayer(
      `https://tile.openweathermap.org/map/${layer.url}/{z}/{x}/{y}.png?appid=${apiKey}`,
      {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: weatherLayerOpacity.value,
        maxZoom: 18,
        minZoom: 4
      }
    )

    weatherLayer.value.addTo(leafletMap.value)
    activeWeatherLayer.value = layerId
    ElMessage.success(`已切换到${layer.name}图层`)
  } else {
    activeWeatherLayer.value = null
    ElMessage.info('已关闭气象图层')
  }
}

// 更新气象图层透明度
const updateWeatherLayerOpacity = () => {
  if (weatherLayer.value) {
    weatherLayer.value.setOpacity(weatherLayerOpacity.value)
  }
}

// 显示预警详情
const showWarningDetail = (point) => {
  viewDetail(point)
}

// 查看全部预警
const showAllWarnings = () => {
  // 这里可以跳转到预警列表页面
  ElMessage.info('跳转到预警列表页面')
}

// 查看详情
const viewDetail = (warning) => {
  selectedWarning.value = warning
  detailDialogVisible.value = true
}

// 查看天气预警详情
const viewWeatherDetail = (warning) => {
  ElMessageBox.alert(
    `
      <div style="padding: 10px;">
        <p style="margin-bottom: 10px;"><strong>区域：</strong>${warning.region}</p>
        <p style="margin-bottom: 10px;"><strong>预警等级：</strong><span style="color: ${warning.warning_level === 'severe' ? '#f56c6c' : '#e6a23c'};">${getWarningLevelText(warning.warning_level)}</span></p>
        <p style="margin-bottom: 10px;"><strong>预警内容：</strong>${warning.warning_content}</p>
        <p style="margin-bottom: 10px;"><strong>当前温度：</strong>${Math.round(warning.weather.temperature)}°C</p>
        <p style="margin-bottom: 10px;"><strong>湿度：</strong>${warning.weather.humidity}%</p>
        <p style="margin-bottom: 10px;"><strong>风速：</strong>${warning.weather.wind_speed} m/s</p>
        <p style="margin-bottom: 10px;"><strong>降雨量：</strong>${warning.weather.rainfall ? warning.weather.rainfall.toFixed(1) : 0} mm</p>
        <p style="margin-bottom: 10px;"><strong>天气状况：</strong>${warning.weather.weather_text || warning.weather.weather_description || warning.weather.description || '未知'}</p>
        <p style="margin-bottom: 10px;"><strong>风险类型：</strong>${warning.risk.risks.join('、')}</p>
        <p style="margin-bottom: 10px;"><strong>发布时间：</strong>${formatTime(warning.created_at)}</p>
      </div>
    `,
    '预警详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 取消预警
const cancelWarning = async (warning) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消"${warning.warning_content}"这条预警吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await cancelWarningRecord(warning.id)
    
    if (response.code === 200) {
      ElMessage.success('预警已取消')
      fetchWarnings()
      fetchStatistics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消预警错误:', error)
      ElMessage.error('取消预警失败')
    }
  }
}

// 工具函数
const getWarningType = (level) => {
  const typeMap = {
    light: 'info',
    moderate: 'warning',
    severe: 'danger'
  }
  return typeMap[level] || 'info'
}

const getWarningLevelText = (level) => {
  const textMap = {
    light: '轻度',
    moderate: '中度',
    severe: '重度'
  }
  return textMap[level] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    active: 'success',
    expired: 'info',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    active: '有效',
    expired: '已过期',
    cancelled: '已取消'
  }
  return textMap[status] || '未知'
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

const generateMapPoints = () => {
  // 地图点位数据已在计算属性中处理
}

// 内置城市坐标（可根据后端返回 lat/lng 优先使用后端坐标）
const cityCoords = {
  // 直辖市
  beijing: { lat: 39.9042, lng: 116.4074 },
  北京: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  上海: { lat: 31.2304, lng: 121.4737 },
  tianjin: { lat: 39.3434, lng: 117.3616 },
  天津: { lat: 39.3434, lng: 117.3616 },
  chongqing: { lat: 29.563, lng: 106.5516 },
  重庆: { lat: 29.563, lng: 106.5516 },
  
  // 省会城市
  guangzhou: { lat: 23.1291, lng: 113.2644 },
  广州: { lat: 23.1291, lng: 113.2644 },
  shenzhen: { lat: 22.5431, lng: 114.0579 },
  深圳: { lat: 22.5431, lng: 114.0579 },
  hangzhou: { lat: 30.2741, lng: 120.1551 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  nanjing: { lat: 32.0603, lng: 118.7969 },
  南京: { lat: 32.0603, lng: 118.7969 },
  wuhan: { lat: 30.5928, lng: 114.3055 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  chengdu: { lat: 30.5728, lng: 104.0668 },
  成都: { lat: 30.5728, lng: 104.0668 },
  xian: { lat: 34.3416, lng: 108.9398 },
  西安: { lat: 34.3416, lng: 108.9398 },
  shijiazhuang: { lat: 38.0428, lng: 114.5149 },
  石家庄: { lat: 38.0428, lng: 114.5149 },
  jinan: { lat: 36.6512, lng: 117.12 },
  济南: { lat: 36.6512, lng: 117.12 },
  qingdao: { lat: 36.0662, lng: 120.3826 },
  青岛: { lat: 36.0662, lng: 120.3826 },
  dalian: { lat: 38.914, lng: 121.6147 },
  大连: { lat: 38.914, lng: 121.6147 },
  xiamen: { lat: 24.4798, lng: 118.0894 },
  厦门: { lat: 24.4798, lng: 118.0894 },
  suzhou: { lat: 31.2989, lng: 120.5853 },
  苏州: { lat: 31.2989, lng: 120.5853 },
  zhengzhou: { lat: 34.7473, lng: 113.6249 },
  郑州: { lat: 34.7473, lng: 113.6249 },
  changsha: { lat: 28.2282, lng: 112.9388 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  hefei: { lat: 31.8206, lng: 117.229 },
  合肥: { lat: 31.8206, lng: 117.229 },
  kunming: { lat: 25.0406, lng: 102.7123 },
  昆明: { lat: 25.0406, lng: 102.7123 },
  nanchang: { lat: 28.6829, lng: 115.8579 },
  南昌: { lat: 28.6829, lng: 115.8579 },
  fuzhou: { lat: 26.0745, lng: 119.2965 },
  福州: { lat: 26.0745, lng: 119.2965 },
  guiyang: { lat: 26.6470, lng: 106.6302 },
  贵阳: { lat: 26.6470, lng: 106.6302 },
  haikou: { lat: 20.0444, lng: 110.1999 },
  海口: { lat: 20.0444, lng: 110.1999 },
  lanzhou: { lat: 36.0611, lng: 103.8343 },
  兰州: { lat: 36.0611, lng: 103.8343 },
  nanning: { lat: 22.8170, lng: 108.3665 },
  南宁: { lat: 22.8170, lng: 108.3665 },
  shenyang: { lat: 41.8057, lng: 123.4328 },
  沈阳: { lat: 41.8057, lng: 123.4328 },
  taiyuan: { lat: 37.8706, lng: 112.5489 },
  太原: { lat: 37.8706, lng: 112.5489 },
  urumqi: { lat: 43.8256, lng: 87.6168 },
  乌鲁木齐: { lat: 43.8256, lng: 87.6168 },
  yinchuan: { lat: 38.4872, lng: 106.2309 },
  银川: { lat: 38.4872, lng: 106.2309 },
  xining: { lat: 36.6171, lng: 101.7782 },
  西宁: { lat: 36.6171, lng: 101.7782 },
  lhasa: { lat: 29.6500, lng: 91.1000 },
  拉萨: { lat: 29.6500, lng: 91.1000 },
  hohhot: { lat: 40.8414, lng: 111.7519 },
  呼和浩特: { lat: 40.8414, lng: 111.7519 },
  harbin: { lat: 45.8038, lng: 126.5340 },
  哈尔滨: { lat: 45.8038, lng: 126.5340 },
  changchun: { lat: 43.8171, lng: 125.3235 },
  长春: { lat: 43.8171, lng: 125.3235 }
}

// 根据预警数据渲染 Leaflet 地图
const renderLeafletMap = () => {
  if (!mapContainer.value) {
    console.warn('地图容器未准备好')
    return
  }

  // 初始化地图
  if (!leafletMap.value) {
    try {
      // 中国区域边界
      const chinaBounds = L.latLngBounds(
        L.latLng(18, 73),  // 西南角 (南海诸岛)
        L.latLng(54, 135)  // 东北角 (黑龙江)
      )
      
      leafletMap.value = L.map(mapContainer.value, {
        center: [35.8617, 104.1954],  // 中国中心点
        zoom: 5,
        minZoom: 4,  // 最小缩放级别，防止缩太小
        maxZoom: 10, // 最大缩放级别
        maxBounds: chinaBounds,  // 限制地图边界
        maxBoundsViscosity: 1.0,  // 边界粘性，1.0表示完全限制
        zoomControl: true,
        attributionControl: true
      })
      
      // 使用高德地图瓦片（国内可访问）
      L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        subdomains: ['1', '2', '3', '4'],
        attribution: '&copy; 高德地图'
      }).addTo(leafletMap.value)
      
      console.log('地图初始化成功')
    } catch (error) {
      console.error('地图初始化失败:', error)
      return
    }
  }

  // 清空旧标记
  leafletMarkers.value.forEach(m => {
    try {
      m.remove()
    } catch (e) {
      console.warn('移除标记失败:', e)
    }
  })
  leafletMarkers.value = []

  // 颜色映射
  const colorMap = {
    severe: '#f56c6c',
    moderate: '#e6a23c',
    light: '#409eff'
  }

  // 生成标记
  let validMarkerCount = 0
  allWarnings.value.forEach(warning => {
    // 尝试获取坐标
    let coord = null
    
    // 尝试从城市名称匹配坐标
    const regionKey = (warning.region || '').toLowerCase()
      .replace(/省|市|区|县/g, '')
      .trim()
    
    // 尝试多种匹配方式
    coord = cityCoords[regionKey] || 
            cityCoords[warning.region?.toLowerCase()]
    
    if (!coord || isNaN(coord.lat) || isNaN(coord.lng)) {
      console.warn('无效坐标:', warning.region, coord)
      return
    }

    try {
      const level = warning.warning_level
      const marker = L.circleMarker([coord.lat, coord.lng], {
        radius: 10,
        color: '#fff',
        weight: 2,
        fillColor: colorMap[level] || '#409eff',
        fillOpacity: 0.8
      }).addTo(leafletMap.value)

      marker.bindPopup(`
        <div style="min-width:200px; padding: 8px;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${warning.region || '未知区域'}</div>
          <div style="margin-bottom: 4px;">等级：<span style="color: ${colorMap[level]}; font-weight: bold;">${getWarningLevelText(level)}</span></div>
          <div style="margin-bottom: 4px;">内容：${warning.warning_content || '-'}</div>
          <div style="margin-bottom: 4px;">灾害类型：${warning.disasterType?.type_name || '-'}</div>
          <div style="color: #999; font-size: 12px;">时间：${formatTime(warning.created_at)}</div>
        </div>
      `)

      marker.on('click', () => showWarningDetail(warning))
      leafletMarkers.value.push(marker)
      validMarkerCount++
    } catch (error) {
      console.error('添加标记失败:', error, warning)
    }
  })
  
  console.log(`地图渲染完成，共添加 ${validMarkerCount} 个标记`)
  
  // 如果有标记，调整视图以显示所有标记
  if (leafletMarkers.value.length > 0 && leafletMap.value) {
    try {
      const group = L.featureGroup(leafletMarkers.value)
      leafletMap.value.fitBounds(group.getBounds().pad(0.1))
    } catch (e) {
      console.warn('调整地图视图失败:', e)
    }
  }
  
  // 如果开启天气显示，添加天气标记
  if (showWeather.value && Object.keys(weatherData.value).length === 0) {
    addWeatherMarkers()
  }
}

// 全国主要城市列表（只使用 OpenWeatherMap 支持的城市）
const getAllCities = () => {
  return [
    // 直辖市
    { code: 'beijing', name: '北京', coord: cityCoords['北京'], province: '北京' },
    { code: 'shanghai', name: '上海', coord: cityCoords['上海'], province: '上海' },
    { code: 'tianjin', name: '天津', coord: cityCoords['天津'], province: '天津' },
    { code: 'chongqing', name: '重庆', coord: cityCoords['重庆'], province: '重庆' },
    
    // 省会及重点城市
    { code: 'shijiazhuang', name: '石家庄', coord: cityCoords['石家庄'], province: '河北' },
    { code: 'taiyuan', name: '太原', coord: cityCoords['太原'], province: '山西' },
    { code: 'hohhot', name: '呼和浩特', coord: cityCoords['呼和浩特'], province: '内蒙古' },
    { code: 'shenyang', name: '沈阳', coord: cityCoords['沈阳'], province: '辽宁' },
    { code: 'dalian', name: '大连', coord: cityCoords['大连'], province: '辽宁' },
    { code: 'changchun', name: '长春', coord: cityCoords['长春'], province: '吉林' },
    { code: 'harbin', name: '哈尔滨', coord: cityCoords['哈尔滨'], province: '黑龙江' },
    { code: 'nanjing', name: '南京', coord: cityCoords['南京'], province: '江苏' },
    { code: 'suzhou', name: '苏州', coord: cityCoords['苏州'], province: '江苏' },
    { code: 'hangzhou', name: '杭州', coord: cityCoords['杭州'], province: '浙江' },
    { code: 'hefei', name: '合肥', coord: cityCoords['合肥'], province: '安徽' },
    { code: 'fuzhou', name: '福州', coord: cityCoords['福州'], province: '福建' },
    { code: 'xiamen', name: '厦门', coord: cityCoords['厦门'], province: '福建' },
    { code: 'nanchang', name: '南昌', coord: cityCoords['南昌'], province: '江西' },
    { code: 'jinan', name: '济南', coord: cityCoords['济南'], province: '山东' },
    { code: 'qingdao', name: '青岛', coord: cityCoords['青岛'], province: '山东' },
    { code: 'zhengzhou', name: '郑州', coord: cityCoords['郑州'], province: '河南' },
    { code: 'wuhan', name: '武汉', coord: cityCoords['武汉'], province: '湖北' },
    { code: 'changsha', name: '长沙', coord: cityCoords['长沙'], province: '湖南' },
    { code: 'guangzhou', name: '广州', coord: cityCoords['广州'], province: '广东' },
    { code: 'shenzhen', name: '深圳', coord: cityCoords['深圳'], province: '广东' },
    { code: 'nanning', name: '南宁', coord: cityCoords['南宁'], province: '广西' },
    { code: 'haikou', name: '海口', coord: cityCoords['海口'], province: '海南' },
    { code: 'chengdu', name: '成都', coord: cityCoords['成都'], province: '四川' },
    { code: 'guiyang', name: '贵阳', coord: cityCoords['贵阳'], province: '贵州' },
    { code: 'kunming', name: '昆明', coord: cityCoords['昆明'], province: '云南' },
    { code: 'lhasa', name: '拉萨', coord: cityCoords['拉萨'], province: '西藏' },
    { code: 'xian', name: '西安', coord: cityCoords['西安'], province: '陕西' },
    { code: 'lanzhou', name: '兰州', coord: cityCoords['兰州'], province: '甘肃' },
    { code: 'xining', name: '西宁', coord: cityCoords['西宁'], province: '青海' },
    { code: 'yinchuan', name: '银川', coord: cityCoords['银川'], province: '宁夏' },
    { code: 'urumqi', name: '乌鲁木齐', coord: cityCoords['乌鲁木齐'], province: '新疆' },
    
    // 河北省地级市
    { code: 'tangshan', name: '唐山', coord: { lat: 39.6304, lng: 118.1803 }, province: '河北' },
    { code: 'qinhuangdao', name: '秦皇岛', coord: { lat: 39.9353, lng: 119.6001 }, province: '河北' },
    { code: 'handan', name: '邯郸', coord: { lat: 36.6253, lng: 114.5389 }, province: '河北' },
    { code: 'baoding', name: '保定', coord: { lat: 38.8738, lng: 115.4648 }, province: '河北' },
    { code: 'zhangjiakou', name: '张家口', coord: { lat: 40.8110, lng: 114.8794 }, province: '河北' },
    { code: 'chengde', name: '承德', coord: { lat: 40.9517, lng: 117.9633 }, province: '河北' },
    { code: 'cangzhou', name: '沧州', coord: { lat: 38.3037, lng: 116.8387 }, province: '河北' },
    { code: 'langfang', name: '廊坊', coord: { lat: 39.5196, lng: 116.6838 }, province: '河北' },
    { code: 'hengshui', name: '衡水', coord: { lat: 37.7389, lng: 115.6708 }, province: '河北' },
    
    // 山西省地级市
    { code: 'datong', name: '大同', coord: { lat: 40.0769, lng: 113.2950 }, province: '山西' },
    { code: 'yangquan', name: '阳泉', coord: { lat: 37.8570, lng: 113.5830 }, province: '山西' },
    { code: 'changzhi', name: '长治', coord: { lat: 36.1951, lng: 113.1163 }, province: '山西' },
    { code: 'jincheng', name: '晋城', coord: { lat: 35.4901, lng: 112.8513 }, province: '山西' },
    { code: 'shuozhou', name: '朔州', coord: { lat: 39.3313, lng: 112.4328 }, province: '山西' },
    { code: 'jinzhong', name: '晋中', coord: { lat: 37.6872, lng: 112.7524 }, province: '山西' },
    { code: 'yuncheng', name: '运城', coord: { lat: 35.0228, lng: 110.9977 }, province: '山西' },
    { code: 'xinzhou', name: '忻州', coord: { lat: 38.4167, lng: 112.7333 }, province: '山西' },
    { code: 'linfen', name: '临汾', coord: { lat: 36.0881, lng: 111.5189 }, province: '山西' },
    { code: 'lvliang', name: '吕梁', coord: { lat: 37.5178, lng: 111.1419 }, province: '山西' },
    
    // 辽宁省地级市
    { code: 'anshan', name: '鞍山', coord: { lat: 41.1087, lng: 122.9945 }, province: '辽宁' },
    { code: 'fushun', name: '抚顺', coord: { lat: 41.8800, lng: 123.9570 }, province: '辽宁' },
    { code: 'benxi', name: '本溪', coord: { lat: 41.2861, lng: 123.7654 }, province: '辽宁' },
    { code: 'dandong', name: '丹东', coord: { lat: 40.1290, lng: 124.3544 }, province: '辽宁' },
    { code: 'jinzhou', name: '锦州', coord: { lat: 41.0956, lng: 121.1270 }, province: '辽宁' },
    { code: 'yingkou', name: '营口', coord: { lat: 40.6674, lng: 122.2190 }, province: '辽宁' },
    { code: 'fuxin', name: '阜新', coord: { lat: 42.0118, lng: 121.6708 }, province: '辽宁' },
    { code: 'liaoyang', name: '辽阳', coord: { lat: 41.2694, lng: 123.2372 }, province: '辽宁' },
    { code: 'panjin', name: '盘锦', coord: { lat: 41.1245, lng: 122.0699 }, province: '辽宁' },
    { code: 'tieling', name: '铁岭', coord: { lat: 42.2906, lng: 123.8445 }, province: '辽宁' },
    { code: 'chaoyang', name: '朝阳', coord: { lat: 41.5761, lng: 120.4506 }, province: '辽宁' },
    { code: 'huludao', name: '葫芦岛', coord: { lat: 40.7110, lng: 120.8378 }, province: '辽宁' },
    
    // 江苏省地级市
    { code: 'wuxi', name: '无锡', coord: { lat: 31.4912, lng: 120.3119 }, province: '江苏' },
    { code: 'xuzhou', name: '徐州', coord: { lat: 34.2044, lng: 117.2844 }, province: '江苏' },
    { code: 'changzhou', name: '常州', coord: { lat: 31.8117, lng: 119.9742 }, province: '江苏' },
    { code: 'nantong', name: '南通', coord: { lat: 32.0085, lng: 120.8947 }, province: '江苏' },
    { code: 'lianyungang', name: '连云港', coord: { lat: 34.5969, lng: 119.2216 }, province: '江苏' },
    { code: 'huaian', name: '淮安', coord: { lat: 33.5975, lng: 119.0153 }, province: '江苏' },
    { code: 'yancheng', name: '盐城', coord: { lat: 33.3798, lng: 120.1631 }, province: '江苏' },
    { code: 'yangzhou', name: '扬州', coord: { lat: 32.3912, lng: 119.4215 }, province: '江苏' },
    { code: 'zhenjiang', name: '镇江', coord: { lat: 32.1889, lng: 119.4258 }, province: '江苏' },
    { code: 'taizhou', name: '泰州', coord: { lat: 32.4849, lng: 119.9229 }, province: '江苏' },
    { code: 'suqian', name: '宿迁', coord: { lat: 33.9631, lng: 118.2752 }, province: '江苏' },
    
    // 浙江省地级市
    { code: 'ningbo', name: '宁波', coord: { lat: 29.8683, lng: 121.5440 }, province: '浙江' },
    { code: 'wenzhou', name: '温州', coord: { lat: 28.0006, lng: 120.6994 }, province: '浙江' },
    { code: 'jiaxing', name: '嘉兴', coord: { lat: 30.7466, lng: 120.7505 }, province: '浙江' },
    { code: 'huzhou', name: '湖州', coord: { lat: 30.8941, lng: 120.0864 }, province: '浙江' },
    { code: 'shaoxing', name: '绍兴', coord: { lat: 30.0333, lng: 120.5800 }, province: '浙江' },
    { code: 'jinhua', name: '金华', coord: { lat: 29.0789, lng: 119.6478 }, province: '浙江' },
    { code: 'quzhou', name: '衢州', coord: { lat: 28.9700, lng: 118.8750 }, province: '浙江' },
    { code: 'zhoushan', name: '舟山', coord: { lat: 29.9850, lng: 122.2070 }, province: '浙江' },
    { code: 'taizhou-zj', name: '台州', coord: { lat: 28.6561, lng: 121.4287 }, province: '浙江' },
    { code: 'lishui', name: '丽水', coord: { lat: 28.4670, lng: 119.9229 }, province: '浙江' },
    
    // 山东省地级市
    { code: 'zibo', name: '淄博', coord: { lat: 36.8131, lng: 118.0548 }, province: '山东' },
    { code: 'zaozhuang', name: '枣庄', coord: { lat: 34.8107, lng: 117.3231 }, province: '山东' },
    { code: 'dongying', name: '东营', coord: { lat: 37.4337, lng: 118.6751 }, province: '山东' },
    { code: 'yantai', name: '烟台', coord: { lat: 37.4638, lng: 121.4478 }, province: '山东' },
    { code: 'weifang', name: '潍坊', coord: { lat: 36.7069, lng: 119.1619 }, province: '山东' },
    { code: 'jining', name: '济宁', coord: { lat: 35.4154, lng: 116.5874 }, province: '山东' },
    { code: 'taian', name: '泰安', coord: { lat: 36.2003, lng: 117.0874 }, province: '山东' },
    { code: 'weihai', name: '威海', coord: { lat: 37.5128, lng: 122.1201 }, province: '山东' },
    { code: 'rizhao', name: '日照', coord: { lat: 35.4164, lng: 119.5269 }, province: '山东' },
    { code: 'linyi', name: '临沂', coord: { lat: 35.1041, lng: 118.3564 }, province: '山东' },
    { code: 'dezhou', name: '德州', coord: { lat: 37.4355, lng: 116.3594 }, province: '山东' },
    { code: 'liaocheng', name: '聊城', coord: { lat: 36.4570, lng: 115.9859 }, province: '山东' },
    { code: 'binzhou', name: '滨州', coord: { lat: 37.3835, lng: 117.9708 }, province: '山东' },
    { code: 'heze', name: '菏泽', coord: { lat: 35.2333, lng: 115.4806 }, province: '山东' },
    
    // 广东省地级市
    { code: 'zhuhai', name: '珠海', coord: { lat: 22.2711, lng: 113.5767 }, province: '广东' },
    { code: 'shantou', name: '汕头', coord: { lat: 23.3540, lng: 116.6824 }, province: '广东' },
    { code: 'foshan', name: '佛山', coord: { lat: 23.0219, lng: 113.1219 }, province: '广东' },
    { code: 'jiangmen', name: '江门', coord: { lat: 22.5790, lng: 113.0815 }, province: '广东' },
    { code: 'zhanjiang', name: '湛江', coord: { lat: 21.2707, lng: 110.3577 }, province: '广东' },
    { code: 'maoming', name: '茂名', coord: { lat: 21.6631, lng: 110.9253 }, province: '广东' },
    { code: 'zhaoqing', name: '肇庆', coord: { lat: 23.0469, lng: 112.4658 }, province: '广东' },
    { code: 'huizhou', name: '惠州', coord: { lat: 23.1115, lng: 114.4152 }, province: '广东' },
    { code: 'meizhou', name: '梅州', coord: { lat: 24.2888, lng: 116.1225 }, province: '广东' },
    { code: 'shanwei', name: '汕尾', coord: { lat: 22.7787, lng: 115.3750 }, province: '广东' },
    { code: 'dongguan', name: '东莞', coord: { lat: 23.0205, lng: 113.7518 }, province: '广东' },
    { code: 'zhongshan', name: '中山', coord: { lat: 22.5171, lng: 113.3926 }, province: '广东' },
    { code: 'chaozhou', name: '潮州', coord: { lat: 23.6567, lng: 116.6228 }, province: '广东' },
    { code: 'jieyang', name: '揭阳', coord: { lat: 23.5438, lng: 116.3729 }, province: '广东' },
    { code: 'yunfu', name: '云浮', coord: { lat: 22.9297, lng: 112.0442 }, province: '广东' }
  ].filter(city => city.coord) // 只保留有坐标的城市
}

// 检查缓存是否有效
const isCacheValid = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const cacheTime = parseInt(timestamp)
    const now = Date.now()
    const isValid = (now - cacheTime) < CACHE_DURATION
    
    if (isValid) {
      console.log(`✓ 缓存有效，距离上次加载 ${Math.floor((now - cacheTime) / 1000)} 秒`)
    } else {
      console.log(`✗ 缓存已过期，距离上次加载 ${Math.floor((now - cacheTime) / 1000)} 秒`)
    }
    
    return isValid
  } catch (error) {
    console.error('检查缓存失败:', error)
    return false
  }
}

// 从缓存加载数据
const loadFromCache = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (!cachedData) return false
    
    const data = JSON.parse(cachedData)
    weatherData.value = data
    
    console.log(`📦 从缓存加载了 ${Object.keys(data).length} 个城市的天气数据`)
    
    // 渲染缓存的数据
    renderCachedWeatherData()
    
    // 更新统计
    updateWeatherStatistics()
    
    // 绘制灾害区域
    drawDisasterAreas()
    
    ElMessage.success(`已加载缓存数据，共 ${Object.keys(data).length} 个城市`)
    
    return true
  } catch (error) {
    console.error('加载缓存失败:', error)
    return false
  }
}

// 渲染缓存的天气数据
const renderCachedWeatherData = () => {
  if (!leafletMap.value) return
  
  const allCities = getAllCities()
  const cachedResults = []
  
  Object.entries(weatherData.value).forEach(([code, weather]) => {
    const city = allCities.find(c => c.code === code)
    if (city) {
      cachedResults.push({
        code,
        name: city.name,
        coord: city.coord,
        weather
      })
    }
  })
  
  // 批量渲染
  renderWeatherBatch(cachedResults)
  
  // 更新图表
  updateAllCharts()
}

// 保存到缓存
const saveToCache = () => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(weatherData.value))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    console.log(`💾 已缓存 ${Object.keys(weatherData.value).length} 个城市的天气数据`)
  } catch (error) {
    console.error('保存缓存失败:', error)
  }
}

// 分批加载天气数据
const addWeatherMarkers = async (forceReload = false) => {
  if (!leafletMap.value) return
  if (isLoadingWeather.value) return // 避免重复加载
  
  // 检查缓存
  if (!forceReload && isCacheValid()) {
    const loaded = loadFromCache()
    if (loaded) return
  }
  
  isLoadingWeather.value = true
  const allCities = getAllCities()
  weatherLoadingTotal.value = allCities.length
  weatherLoadingProgress.value = 0
  
  console.log(`开始加载 ${allCities.length} 个城市的天气数据...`)
  
  // 分批配置：每批3个城市，批次间延迟800ms，请求间延迟300ms（减少并发，避免超时）
  const batchSize = 3
  const batchDelay = 800
  const requestDelay = 300
  
  // 延迟函数
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  
  // 分批处理
  for (let i = 0; i < allCities.length; i += batchSize) {
    const batch = allCities.slice(i, i + batchSize)
    const batchResults = []
    
    console.log(`\n📦 加载第 ${Math.floor(i / batchSize) + 1} 批 (${batch.map(c => c.name).join('、')})`)
    
    // 批次内串行请求
    for (let j = 0; j < batch.length; j++) {
      const city = batch[j]
      
      try {
        if (j > 0) await delay(requestDelay)
        
        const response = await getRealWeather(city.code)
        if (response.code === 200 && response.data) {
          batchResults.push({ ...city, weather: response.data })
          console.log(`  ✓ ${city.name}: ${Math.round(response.data.temperature)}°C`)
        }
      } catch (error) {
        console.warn(`  ✗ ${city.name}: ${error.message}`)
      }
      
      weatherLoadingProgress.value++
    }
    
    // 立即渲染这一批的数据
    if (batchResults.length > 0) {
      renderWeatherBatch(batchResults)
    }
    
    // 批次间延迟
    if (i + batchSize < allCities.length) {
      await delay(batchDelay)
    }
  }
  
  isLoadingWeather.value = false
  console.log(`\n✅ 天气数据加载完成！共成功加载 ${Object.keys(weatherData.value).length} 个城市`)
  
  // 保存到缓存
  saveToCache()
  
  // 计算天气统计
  updateWeatherStatistics()
  
  // 所有数据加载完成后，绘制灾害影响区域
  drawDisasterAreas()
  
  // 更新图表数据
  updateAllCharts()
  
  ElMessage.success(`天气图层加载完成，共 ${Object.keys(weatherData.value).length} 个城市`)
}

// 更新天气统计数据并生成实时预警
const updateWeatherStatistics = () => {
  let high = 0
  let medium = 0
  let normal = 0
  let light = 0 // 统计轻度预警数量
  const generatedWarnings = []
  
  const allCities = getAllCities()
  
  Object.entries(weatherData.value).forEach(([code, weather]) => {
    const city = allCities.find(c => c.code === code)
    if (!city) return
    
    const risk = analyzeDisasterRisk(weather)
    
    if (risk.level === 'severe') {
      high++
    } else if (risk.level === 'moderate') {
      medium++
    } else {
      normal++
      // 检查是否存在轻度风险
      if (risk.level === 'light') {
        light++
      }
    }
    
    // 为高风险、中风险和轻度风险区域生成预警
    if (risk.level === 'severe' || risk.level === 'moderate' || risk.level === 'light') {
      const warningLevel = risk.level
      
      // 生成预警内容
      let warningContent = ''
      const temp = Math.round(weather.temperature)
      const humidity = weather.humidity
      const windSpeed = weather.wind_speed
      const rainfall = weather.rainfall || 0
      
      if (risk.risks.includes('干旱') || risk.risks.includes('干旱倾向')) {
        warningContent = `${city.name}地区当前温度${temp}°C，湿度${humidity}%，降雨量${rainfall.toFixed(1)}mm，存在干旱风险，请注意农田灌溉`
      } else if (risk.risks.includes('洪涝') || risk.risks.includes('强降雨')) {
        if (rainfall > 0) {
          warningContent = `${city.name}地区当前降雨量${rainfall.toFixed(1)}mm，湿度${humidity}%，风速${windSpeed}m/s，存在洪涝风险，请做好排水准备`
        } else {
          warningContent = `${city.name}地区当前湿度${humidity}%，风速${windSpeed}m/s，存在强降雨风险，请做好排水准备`
        }
      } else if (risk.risks.includes('冻害')) {
        warningContent = `${city.name}地区当前温度${temp}°C，存在冻害风险，请做好农作物防冻措施`
      } else if (risk.risks.includes('高温')) {
        warningContent = `${city.name}地区当前温度${temp}°C，高温预警，请注意防暑降温和作物遮阳`
      } else if (risk.risks.includes('大风')) {
        warningContent = `${city.name}地区当前风速${windSpeed}m/s，大风预警，请加固农业设施`
      } else if (risk.risks.length > 0) {
        warningContent = `${city.name}地区${risk.risks.join('、')}，请注意防范`
      }
      
      if (warningContent) {
        generatedWarnings.push({
          id: `weather_${code}_${Date.now()}`,
          region: city.name,
          warning_level: warningLevel,
          warning_content: warningContent,
          status: 'active',
          created_at: new Date().toISOString(),
          weather: weather,
          risk: risk,
          disasterType: {
            type_name: risk.risks[0] || '气象灾害'
          }
        })
      }
    }
  })
  
  // 按风险等级排序（重度优先）
  generatedWarnings.sort((a, b) => {
    const levelOrder = { severe: 0, moderate: 1, light: 2 }
    return levelOrder[a.warning_level] - levelOrder[b.warning_level]
  })
  
  // 更新统计数据
  weatherStatistics.value = {
    high,
    medium,
    normal,
    light, // 新增轻度预警数量
    total: Object.keys(weatherData.value).length
  }
  
  // 保存总预警数
  totalWarningsCount.value = generatedWarnings.length
  
  // 更新预警列表（存储所有预警）
  allWarnings.value = generatedWarnings
  
  console.log(`📊 天气统计: 高风险 ${high} 个, 中风险 ${medium} 个, 正常 ${normal} 个, 轻度风险 ${light} 个`)
  console.log(`⚠️ 生成预警: ${totalWarningsCount.value} 条`)
}

// 渲染一批天气数据（优化性能：只在特定缩放级别显示标签）
const renderWeatherBatch = (batchResults) => {
  if (!leafletMap.value) return
  
  try {
    batchResults.forEach(result => {
      if (!result || !result.weather) return
      
      const { name, coord, weather } = result
      weatherData.value[result.code] = weather
      
      // 调试：输出第一个城市的天气数据结构
      if (Object.keys(weatherData.value).length === 1) {
        console.log('📋 天气数据结构示例:', {
          城市: name,
          数据: weather,
          字段: Object.keys(weather)
        })
      }
      
      // 只添加简单的圆点标记，不添加文字标签（减少DOM元素）
      const risk = analyzeDisasterRisk(weather)
      const markerColor = risk.level === 'severe' ? '#f56c6c' : 
                         risk.level === 'moderate' ? '#e6a23c' : 
                         risk.level === 'light' ? '#409eff' : '#67c23a'
      
      const simpleMarker = L.circleMarker([coord.lat, coord.lng], {
        radius: 4,
        fillColor: markerColor,
        color: '#fff',
        weight: 1,
        fillOpacity: 0.8
      }).addTo(leafletMap.value)
      
      // 使用 Popup 而不是 Tooltip，减少性能消耗
      simpleMarker.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <strong>${name}</strong><br/>
          <div style="margin: 8px 0;">
            <span style="font-size: 20px; font-weight: bold; color: ${markerColor};">
              ${Math.round(weather.temperature)}°C
            </span>
            <span style="font-size: 18px; margin-left: 8px;">
              ${getWeatherEmoji(weather)}
            </span>
          </div>
          <div style="font-size: 12px; color: #666;">
            ${weather.weather_text || weather.weather_description || weather.description || '未知'}<br/>
            湿度 ${weather.humidity}% | 风速 ${weather.wind_speed}m/s | 降雨 ${weather.rainfall ? weather.rainfall.toFixed(1) : 0}mm
          </div>
          ${risk.level !== 'none' ? `
            <div style="margin-top: 8px; padding: 4px; background: ${markerColor}20; border-radius: 4px; color: ${markerColor}; font-size: 12px;">
              ⚠️ ${risk.risks.join('、')}风险
            </div>
          ` : ''}
        </div>
      `)
      
      leafletMarkers.value.push(simpleMarker)
    })
  } catch (error) {
    console.error('渲染天气数据出错:', error)
  }
}

// 评估单个阈值条件
const evaluateCondition = (type, operator, value, actualValue) => {
  if (actualValue === null || actualValue === undefined) return false
  
  switch (operator) {
    case '>':
      return actualValue > value
    case '<':
      return actualValue < value
    case '>=':
      return actualValue >= value
    case '<=':
      return actualValue <= value
    case '=':
    case '==':
      return actualValue == value
    default:
      return false
  }
}

// 使用配置的阈值评估风险
const evaluateRiskWithConfig = (weather) => {
  const risks = []
  let level = 'none'
  let color = '#67c23a'
  let disasterType = ''
  
  // 如果没有配置，使用默认逻辑
  if (Object.keys(thresholdConfig.value).length === 0) {
    return analyzeDisasterRiskDefault(weather)
  }
  
  // 遍历所有灾害类型的阈值配置
  Object.entries(thresholdConfig.value).forEach(([typeCode, criteria]) => {
    if (!criteria) return
    
    // 按优先级检查：severe > moderate > light
    const levels = ['severe', 'moderate', 'light']
    
    for (const levelKey of levels) {
      if (criteria[levelKey] && Array.isArray(criteria[levelKey])) {
        const conditions = criteria[levelKey]
        let allMatched = true
        
        for (const condition of conditions) {
          const { type, operator, value } = condition
          const actualValue = weather[type]
          
          if (!evaluateCondition(type, operator, value, actualValue)) {
            allMatched = false
            break
          }
        }
        
        if (allMatched) {
          // 找到匹配的风险等级
          const typeNameMap = {
            'drought': '干旱',
            'flood': '洪涝',
            'freeze': '冻害',
            'heat': '高温',
            'wind': '大风',
            'pest': '病虫害',
            'hail': '冰雹',
            'storm': '暴雨',
            'snow': '暴雪',
            'fog': '大雾',
            'sandstorm': '沙尘暴',
            'typhoon': '台风'
          }
          const typeName = typeNameMap[typeCode] || typeCode
          
          risks.push(typeName)
          
          // 更新最高风险等级
          if (levelKey === 'severe' || 
              (levelKey === 'moderate' && level !== 'severe') || 
              (levelKey === 'light' && level === 'none')) {
            level = levelKey
            color = levelKey === 'severe' ? '#f56c6c' : 
                   levelKey === 'moderate' ? '#e6a23c' : '#409eff'
            disasterType = typeCode
          }
          
          break // 找到最高风险等级后停止检查
        }
      }
    }
  })
  
  return { level, risks, color, disasterType }
}

// 默认风险评估逻辑（当没有配置时使用）
const analyzeDisasterRiskDefault = (weather) => {
  const risks = []
  let level = 'none'
  let color = '#67c23a'
  let disasterType = ''
  
  // 干旱风险判断
  if (weather.humidity < 30 && weather.temperature > 30) {
    risks.push('干旱')
    level = 'severe'
    color = '#e6a23c'
    disasterType = 'drought'
  } else if (weather.humidity < 40 && weather.temperature > 28) {
    risks.push('干旱倾向')
    level = 'moderate'
    color = '#f0c78a'
    disasterType = 'drought'
  }
  
  // 洪涝风险判断（考虑降雨量）
  const rainfall = weather.rainfall || 0
  if (rainfall > 50 || (weather.humidity > 85 && weather.wind_speed > 10)) {
    risks.push('洪涝')
    level = 'severe'
    color = '#f56c6c'
    disasterType = 'flood'
  } else if (rainfall > 20 || weather.humidity > 80) {
    risks.push('强降雨')
    level = level === 'severe' ? 'severe' : 'moderate'
    color = level === 'severe' ? color : '#f89898'
    disasterType = 'flood'
  }
  
  // 冻害风险
  if (weather.temperature < 0) {
    risks.push('冻害')
    const isHighFreeze = weather.temperature < -10
    level = isHighFreeze ? 'severe' : (level === 'severe' ? 'severe' : 'moderate')
    color = isHighFreeze ? '#409eff' : (level === 'severe' ? color : '#79bbff')
    disasterType = 'freeze'
  }
  
  // 高温风险
  if (weather.temperature > 35) {
    risks.push('高温')
    const isHighHeat = weather.temperature > 38
    level = isHighHeat ? 'severe' : (level === 'severe' ? 'severe' : 'moderate')
    color = isHighHeat ? '#f56c6c' : (level === 'severe' ? color : '#e6a23c')
    disasterType = 'heat'
  }
  
  // 大风风险
  if (weather.wind_speed > 15) {
    risks.push('大风')
    level = 'severe'
    color = '#909399'
    disasterType = 'wind'
  }
  
  return { level, risks, color, disasterType }
}

// 分析灾害风险（使用配置的阈值）
const analyzeDisasterRisk = (weather) => {
  return evaluateRiskWithConfig(weather)
}

// 计算灾害影响区域（基于相邻城市的实际天气情况）
const calculateDisasterArea = (allWeatherData, disasterType) => {
  const affectedCities = []
  
  Object.entries(allWeatherData).forEach(([code, data]) => {
    if (!data.weather || !data.coord) return
    
    const risk = analyzeDisasterRisk(data.weather)
    if (risk.disasterType === disasterType && risk.level !== 'none') {
      affectedCities.push({
        code,
        name: data.name,
        coord: data.coord,
        weather: data.weather,
        risk
      })
    }
  })
  
  return affectedCities
}

// 绘制灾害影响区域（优化：只绘制高风险区域，减少图层）
const drawDisasterAreas = () => {
  if (!leafletMap.value) return
  
  // 收集所有城市的天气数据
  const allWeatherData = {}
  Object.entries(weatherData.value).forEach(([code, weather]) => {
    const city = getAllCities().find(c => c.code === code)
    if (city) {
      allWeatherData[code] = {
        name: city.name,
        coord: city.coord,
        weather,
        province: city.province
      }
    }
  })
  
  // 只处理高风险灾害，减少渲染负担
  const disasterTypes = ['drought', 'flood', 'freeze', 'heat', 'wind']
  
  disasterTypes.forEach(type => {
    const affectedCities = calculateDisasterArea(allWeatherData, type)
    
    // 只绘制高风险区域
    const highRiskCities = affectedCities.filter(city => city.risk.level === 'severe')
    
    if (highRiskCities.length > 0) {
      // 按省份分组
      const provinceGroups = {}
      highRiskCities.forEach(city => {
        const province = allWeatherData[city.code]?.province || '未知'
        if (!provinceGroups[province]) {
          provinceGroups[province] = []
        }
        provinceGroups[province].push(city)
      })
      
      // 为每个省份的受影响区域绘制多边形
      Object.entries(provinceGroups).forEach(([province, cities]) => {
        if (cities.length >= 3) {
          // 3个及以上城市：绘制多边形
          const coords = cities.map(c => [c.coord.lat, c.coord.lng])
          const polygon = L.polygon(coords, {
            color: cities[0].risk.color,
            fillColor: cities[0].risk.color,
            fillOpacity: 0.15,
            weight: 2
          }).addTo(leafletMap.value)
          
          polygon.bindPopup(`
            <div style="padding: 8px;">
              <strong style="color: ${cities[0].risk.color};">⚠️ ${province} - ${cities[0].risk.risks.join('/')}</strong><br/>
              <div style="margin-top: 8px; font-size: 12px;">
                受影响城市：${cities.map(c => c.name).join('、')}<br/>
                共 ${cities.length} 个地区
              </div>
            </div>
          `)
          
          leafletMarkers.value.push(polygon)
        } else if (cities.length >= 1) {
          // 1-2个城市：绘制圆形区域
          cities.forEach(city => {
            const circle = L.circle([city.coord.lat, city.coord.lng], {
              color: city.risk.color,
              fillColor: city.risk.color,
              fillOpacity: 0.15,
              weight: 2,
              radius: 50000 // 50km
            }).addTo(leafletMap.value)
            
            circle.bindPopup(`
              <div style="padding: 8px;">
                <strong style="color: ${city.risk.color};">⚠️ ${city.name} - ${city.risk.risks.join('/')}</strong><br/>
                <div style="margin-top: 8px; font-size: 12px;">
                  风险等级：高风险<br/>
                  影响半径：约 50 公里
                </div>
              </div>
            `)
            
            leafletMarkers.value.push(circle)
          })
        }
      })
    }
  })
  
  console.log(`🎨 灾害区域绘制完成，共 ${leafletMarkers.value.length} 个图层`)
}



// 获取天气 emoji
const getWeatherEmoji = (weather) => {
  const desc = (weather.weather_text || weather.weather_description || weather.description || '').toLowerCase()
  
  if (desc.includes('晴') || desc.includes('clear')) return '☀️'
  if (desc.includes('雨') || desc.includes('rain')) return '🌧️'
  if (desc.includes('雪') || desc.includes('snow')) return '❄️'
  if (desc.includes('雷') || desc.includes('thunder')) return '⛈️'
  if (desc.includes('云') || desc.includes('cloud')) return '☁️'
  
  return '☁️'
}

// 根据温度返回颜色
const getTempColor = (temp) => {
  if (temp < 0) return '#409eff' // 冰冻 - 蓝色
  if (temp < 10) return '#67c23a' // 寒冷 - 绿色
  if (temp < 20) return '#95d475' // 凉爽 - 浅绿
  if (temp < 28) return '#e6a23c' // 温暖 - 橙色
  if (temp < 35) return '#f56c6c' // 炎热 - 红色
  return '#c03639' // 酷热 - 深红
}

// 显示风险详情对话框
const showRiskDetails = (riskLevel) => {
  const allCities = getAllCities()
  const citiesWithRisk = []
  
  Object.entries(weatherData.value).forEach(([code, weather]) => {
    const city = allCities.find(c => c.code === code)
    if (!city) return
    
    const risk = analyzeDisasterRisk(weather)
    
    // 根据筛选条件过滤
    if (riskLevel === 'all') {
      citiesWithRisk.push({
        code,
        name: city.name,
        weather,
        risk
      })
    } else if (riskLevel === 'high' && risk.level === 'severe') {
      citiesWithRisk.push({
        code,
        name: city.name,
        weather,
        risk
      })
    } else if (riskLevel === 'medium' && risk.level === 'moderate') {
      citiesWithRisk.push({
        code,
        name: city.name,
        weather,
        risk
      })
    } else if (riskLevel === 'normal') {
      // 正常区域包括无风险和轻度风险
      if (risk.level === 'none' || (risk.risks.length > 0 && risk.level === 'light')) {
        citiesWithRisk.push({
          code,
          name: city.name,
          weather,
          risk
        })
      }
    }
  })
  
  // 设置对话框标题
  const titleMap = {
    high: '高风险区域详情',
    medium: '中风险区域详情',
    normal: '正常区域详情',
    all: '所有监测城市详情'
  }
  
  riskDialogTitle.value = titleMap[riskLevel] || '区域详情'
  riskCitiesList.value = citiesWithRisk
  riskDialogVisible.value = true
  
  console.log(`显示 ${riskLevel} 风险详情，共 ${citiesWithRisk.length} 个城市`)
}

// 获取实时天气（用于对话框）
const fetchWeatherForDialog = async () => {
  if (!selectedCity.value) return
  
  loadingWeatherDialog.value = true
  try {
    // 获取实时天气
    const weatherResponse = await getRealWeather(selectedCity.value)
    if (weatherResponse.code === 200) {
      currentWeather.value = weatherResponse.data
    }
    
    // 获取天气预报
    const forecastResponse = await getWeatherForecast(selectedCity.value, 3)
    if (forecastResponse.code === 200) {
      weatherForecast.value = forecastResponse.data
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    ElMessage.error('获取天气数据失败')
  } finally {
    loadingWeatherDialog.value = false
  }
}

// 城市列表（用于下拉选择）
const cityOptions = getAllCities().map(city => ({
  value: city.code,
  label: city.name
}))

// 初始化
onMounted(async () => {
  // 先加载基础数据
  await Promise.all([
    fetchStatistics(),
    fetchWarnings(),
    loadThresholdConfig() // 加载阈值配置
  ])
  updateChartData()
  updatePieChart()
  
  // 延迟初始化地图，确保 DOM 已渲染
  setTimeout(() => {
    renderLeafletMap()
    
    // 地图初始化后，自动开始加载天气数据
    if (showWeather.value) {
      setTimeout(() => {
        addWeatherMarkers()
      }, 500)
    }
  }, 100)
  
  // 设置定时自动刷新天气数据，每小时一次
  weatherRefreshTimer = setInterval(() => {
    console.log('⏰ 定时自动刷新天气数据...')
    addWeatherMarkers(true) // 强制刷新，忽略缓存
  }, CACHE_DURATION)
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    if (weatherRefreshTimer) {
      clearInterval(weatherRefreshTimer)
      console.log('⏹️ 清除天气数据自动刷新定时器')
    }
  })
})
</script>

<style scoped>
.enhanced-warning-page {
  padding: 0;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card.severe {
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
  border-left: 4px solid #f56c6c;
}

.stat-card.moderate {
  background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
  border-left: 4px solid #e6a23c;
}

.stat-card.light {
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
  border-left: 4px solid #409eff;
}

.stat-card.total {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-left: 4px solid #67c23a;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}

/* 主内容区域 */
.main-content {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

/* 地图样式 */
.map-card {
  margin-bottom: 20px;
}

.map-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.map-controls .el-select {
  width: 120px;
}

.map-controls .el-switch {
  margin: 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #409eff;
  padding: 4px 12px;
  background: #ecf5ff;
  border-radius: 4px;
  white-space: nowrap;
}

.cache-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #67c23a;
  padding: 4px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  white-space: nowrap;
}

.map-container {
  width: 100%;
  height: 600px;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.mock-map {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f9ff 100%);
}

.map-legend {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* 气象图层面板样式 */
.weather-layer-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  font-size: 14px;
}

.close-icon {
  cursor: pointer;
  color: #909399;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #303133;
}

.layer-list {
  padding: 8px 0;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.layer-item:hover {
  background: #f5f7fa;
}

.layer-item.active {
  background: #ecf5ff;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-name {
  font-size: 14px;
  color: #303133;
}

.layer-opacity {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
}

.opacity-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-color.severe {
  background: #f56c6c;
}

.legend-color.moderate {
  background: #e6a23c;
}

.legend-color.light {
  background: #409eff;
}

.map-point {
  position: absolute;
  width: 24px;
  height: 24px;
  cursor: pointer;
  z-index: 5;
}

.point-marker {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.map-point.severe .point-marker {
  background: #f56c6c;
}

.map-point.moderate .point-marker {
  background: #e6a23c;
}

.map-point.light .point-marker {
  background: #409eff;
}

.map-point:hover .point-marker {
  transform: scale(1.2);
}

.map-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
}

.map-placeholder .placeholder-text {
  font-size: 12px;
  margin-top: 8px;
}



/* 实时预警列表 */
.warning-list-card {
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  margin: 0;
}

.realtime-warnings {
  height: 540px;
  overflow-y: auto;
}

.warning-item {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.warning-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.warning-item.severe {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
}

.warning-item.moderate {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
}

.warning-item.light {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.warning-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.warning-time {
  font-size: 12px;
  color: #909399;
}

.warning-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.warning-location {
  margin: 0;
  font-size: 12px;
  color: #606266;
}

.warning-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}



/* 详情对话框 */
.warning-detail {
  padding: 20px 0;
}

.affected-section {
  margin-top: 20px;
}

.affected-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.affected-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  margin: 0;
}

/* 天气信息标签样式 - 简洁显示 */
:deep(.weather-label) {
  background: transparent;
  border: none;
}

:deep(.weather-info-label) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 4px 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.weather-info-label .temp) {
  font-weight: bold;
  color: #409eff;
}

:deep(.weather-info-label .condition) {
  font-size: 14px;
}



/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-section .el-col {
    margin-bottom: 12px;
  }
  
  .main-content .el-col:first-child {
    margin-bottom: 20px;
  }
}

/* 天气对话框样式 */
.weather-dialog-content {
  padding: 10px 0;
}

.city-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.current-weather-card {
  margin-bottom: 20px;
}

.current-weather-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-weather-card h3 {
  margin: 0;
  font-size: 18px;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.weather-info-grid {
  display: flex;
  gap: 40px;
}

.weather-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.temperature-display {
  display: flex;
  flex-direction: column;
}

.temp-value {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  line-height: 1;
}

.weather-desc {
  font-size: 16px;
  color: #606266;
  margin-top: 8px;
}

.weather-icon {
  font-size: 80px;
  line-height: 1;
}

.weather-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.forecast-section h3 {
  margin: 20px 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.forecast-card {
  text-align: center;
}

.forecast-date {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.date-text {
  display: block;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-top: 4px;
}

.forecast-icon {
  font-size: 48px;
  margin: 12px 0;
}

.forecast-weather {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.forecast-temp {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.temp-high {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.temp-low {
  font-size: 20px;
  color: #909399;
}

.forecast-details {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.forecast-details div {
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-warnings-tip {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
  }
  
  .map-container {
    height: 400px;
  }
  

  
  .warning-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>