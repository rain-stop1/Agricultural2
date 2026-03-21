<template>
  <div class="warning-page">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <h3>灾害预警</h3>
          <div class="header-actions">
            <el-button @click="showRealWeatherDialog = true" type="primary">
              <el-icon><Location /></el-icon>
              实时天气
            </el-button>
            <el-button @click="showWeatherDialog = true">
              <el-icon><Cloudy /></el-icon>
              气象数据采集
            </el-button>
            <el-button type="success" @click="autoDetectWarning">
              <el-icon><Warning /></el-icon>
              智能预警
            </el-button>
            <el-button @click="exportData">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="info" @click="$router.push('/warning/enhanced')">
              <el-icon><DataAnalysis /></el-icon>
              可视化分析
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline>
          <el-form-item label="区域">
            <el-input
              v-model="filterForm.region"
              placeholder="请输入区域名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="预警等级">
            <el-select v-model="filterForm.level" placeholder="请选择" clearable>
              <el-option label="轻度" value="light" />
              <el-option label="中度" value="moderate" />
              <el-option label="重度" value="severe" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="请选择" clearable>
              <el-option label="有效" value="active" />
              <el-option label="已过期" value="expired" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedWarnings.length > 0" class="batch-actions">
        <el-alert
          :title="`已选择 ${selectedWarnings.length} 条预警`"
          type="info"
          :closable="false"
        />
        <div class="batch-buttons">
          <el-button size="small" @click="batchCancel">批量取消</el-button>
          <el-button size="small" @click="clearSelection">清空选择</el-button>
        </div>
      </div>

      <!-- 预警列表 -->
      <div class="warning-list">
        <el-empty v-if="warnings.length === 0 && !loading" description="暂无预警信息" />
        
        <div v-else class="warning-cards">
          <div 
            v-for="warning in warnings" 
            :key="warning.id"
            class="warning-card"
            :class="[warning.warning_level, { 'selected': selectedWarnings.find(w => w.id === warning.id) }]"
            @click.ctrl="handleWarningSelect(warning, !selectedWarnings.find(w => w.id === warning.id))"
          >
            <div class="warning-header">
              <div class="header-left">
                <el-checkbox 
                  :model-value="!!selectedWarnings.find(w => w.id === warning.id)"
                  @change="handleWarningSelect(warning, $event)"
                  @click.stop
                />
                <el-tag :type="getWarningType(warning.warning_level)" size="large">
                  {{ getWarningLevelText(warning.warning_level) }}
                </el-tag>
              </div>
              <span class="warning-time">{{ formatTime(warning.created_at) }}</span>
            </div>
            
            <div class="warning-content">
              <h4>{{ warning.warning_content }}</h4>
              <div class="warning-meta">
                <p><strong>区域：</strong>{{ warning.region }}</p>
                <p><strong>灾害类型：</strong>{{ warning.disasterType?.type_name }}</p>
                <p v-if="warning.start_time">
                  <strong>开始时间：</strong>{{ formatTime(warning.start_time) }}
                </p>
              </div>
            </div>
            
            <div class="warning-actions">
              <el-button size="small" @click="viewDetail(warning)">查看详情</el-button>
              <el-button 
                v-if="warning.status === 'active'" 
                type="danger" 
                size="small"
                @click="cancelWarning(warning)"
              >
                取消预警
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="预警详情"
      width="600px"
    >
      <div v-if="selectedWarning" class="warning-detail">
        <div class="detail-item">
          <label>预警等级：</label>
          <el-tag :type="getWarningType(selectedWarning.warning_level)">
            {{ getWarningLevelText(selectedWarning.warning_level) }}
          </el-tag>
        </div>
        
        <div class="detail-item">
          <label>区域：</label>
          <span>{{ selectedWarning.region }}</span>
        </div>
        
        <div class="detail-item">
          <label>灾害类型：</label>
          <span>{{ selectedWarning.disasterType?.type_name }}</span>
        </div>
        
        <div class="detail-item">
          <label>预警内容：</label>
          <p>{{ selectedWarning.warning_content }}</p>
        </div>
        
        <div class="detail-item">
          <label>开始时间：</label>
          <span>{{ formatTime(selectedWarning.start_time) }}</span>
        </div>
        
        <div class="detail-item">
          <label>结束时间：</label>
          <span>{{ selectedWarning.end_time ? formatTime(selectedWarning.end_time) : '未设定' }}</span>
        </div>
        
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="getStatusType(selectedWarning.status)">
            {{ getStatusText(selectedWarning.status) }}
          </el-tag>
        </div>
        
        <div v-if="selectedWarning.affected_fields && selectedWarning.affected_fields.length > 0" class="detail-item">
          <label>影响地块：</label>
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

    <!-- 气象数据采集对话框 -->
    <el-dialog
      v-model="showWeatherDialog"
      title="气象数据采集"
      width="600px"
    >
      <el-form :model="weatherForm" label-width="100px">
        <el-form-item label="地区" required>
          <el-input v-model="weatherForm.region" placeholder="请输入地区名称" />
        </el-form-item>
        <el-form-item label="温度(°C)">
          <el-input-number v-model="weatherForm.temperature" :precision="2" placeholder="温度" />
        </el-form-item>
        <el-form-item label="湿度(%)">
          <el-input-number v-model="weatherForm.humidity" :precision="2" :min="0" :max="100" placeholder="湿度" />
        </el-form-item>
        <el-form-item label="降雨量(mm)">
          <el-input-number v-model="weatherForm.rainfall" :precision="2" :min="0" placeholder="降雨量" />
        </el-form-item>
        <el-form-item label="风速(m/s)">
          <el-input-number v-model="weatherForm.wind_speed" :precision="2" :min="0" placeholder="风速" />
        </el-form-item>
        <el-form-item label="风向">
          <el-select v-model="weatherForm.wind_direction" placeholder="请选择风向">
            <el-option label="北" value="北" />
            <el-option label="东北" value="东北" />
            <el-option label="东" value="东" />
            <el-option label="东南" value="东南" />
            <el-option label="南" value="南" />
            <el-option label="西南" value="西南" />
            <el-option label="西" value="西" />
            <el-option label="西北" value="西北" />
          </el-select>
        </el-form-item>
        <el-form-item label="气压(hPa)">
          <el-input-number v-model="weatherForm.air_pressure" :precision="2" placeholder="气压" />
        </el-form-item>
        <el-form-item label="记录时间" required>
          <el-date-picker
            v-model="weatherForm.record_time"
            type="datetime"
            placeholder="选择记录时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWeatherDialog = false">取消</el-button>
        <el-button type="primary" @click="submitWeatherData" :loading="weatherLoading">
          提交气象数据
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建预警对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建预警"
      width="600px"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="灾害类型" required>
          <el-select v-model="createForm.disaster_type_id" placeholder="请选择灾害类型">
            <el-option 
              v-for="type in disasterTypes" 
              :key="type.id" 
              :label="type.type_name" 
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预警区域" required>
          <el-input v-model="createForm.region" placeholder="请输入预警区域" />
        </el-form-item>
        <el-form-item label="预警等级" required>
          <el-select v-model="createForm.warning_level" placeholder="请选择预警等级">
            <el-option label="轻度" value="light" />
            <el-option label="中度" value="moderate" />
            <el-option label="重度" value="severe" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警内容" required>
          <el-input 
            v-model="createForm.warning_content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入预警内容"
          />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="createForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="createForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreateWarning">创建预警</el-button>
      </template>
    </el-dialog>

    <!-- 实时天气数据对话框 -->
    <el-dialog
      v-model="showRealWeatherDialog"
      title="实时天气数据"
      width="800px"
    >
      <div class="real-weather-content">
        <!-- 地区选择 -->
        <div class="region-selector">
          <el-select 
            v-model="selectedRegion" 
            placeholder="选择地区"
            @change="fetchRealWeather"
            style="width: 200px"
          >
            <el-option
              v-for="region in supportedRegions"
              :key="region.code"
              :label="region.name"
              :value="region.code"
            />
          </el-select>
          <el-button type="primary" @click="fetchRealWeather" :loading="realWeatherLoading">
            <el-icon><Refresh /></el-icon>
            刷新天气
          </el-button>
          <el-button 
            type="success" 
            @click="submitRealWeather"
            :disabled="!currentWeather"
            :loading="weatherLoading"
          >
            <el-icon><Cloudy /></el-icon>
            同步到系统
          </el-button>
        </div>

        <!-- 当前天气显示 -->
        <div v-if="currentWeather" class="current-weather">
          <el-card>
            <template #header>
              <div class="weather-header">
                <h3>{{ getRegionName(selectedRegion) }} - 实时天气</h3>
                <span class="update-time">更新时间: {{ formatTime(currentWeather.record_time) }}</span>
              </div>
            </template>
            
            <div class="weather-info">
              <div class="weather-main">
                <div class="weather-icon">
                  <el-icon size="60" :color="getWeatherIconColor(currentWeather.weather_code)">
                    <component :is="getWeatherIcon(currentWeather.weather_code)" />
                  </el-icon>
                </div>
                <div class="weather-details">
                  <div class="temperature">{{ currentWeather.temperature }}°C</div>
                  <div class="weather-text">{{ currentWeather.weather_text }}</div>
                  <div class="weather-meta">
                    <span>湿度: {{ currentWeather.humidity }}%</span>
                    <span>风速: {{ currentWeather.wind_speed }}m/s</span>
                    <span>风向: {{ currentWeather.wind_direction }}</span>
                  </div>
                </div>
              </div>
              
              <div class="weather-extra">
                <div class="extra-item">
                  <label>气压</label>
                  <span>{{ currentWeather.air_pressure }}hPa</span>
                </div>
                <div class="extra-item">
                  <label>体感温度</label>
                  <span>{{ calculateFeelTemp(currentWeather.temperature, currentWeather.humidity) }}°C</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 3天天气预报 -->
        <div v-if="weatherForecast.length > 0" class="weather-forecast">
          <h3>未来3天预报</h3>
          <div class="forecast-cards">
            <el-card 
              v-for="(day, index) in weatherForecast" 
              :key="day.date"
              class="forecast-card"
            >
              <div class="forecast-date">
                {{ index === 0 ? '今天' : index === 1 ? '明天' : '后天' }}
                <div class="date-text">{{ day.date }}</div>
              </div>
              <div class="forecast-weather">
                <el-icon size="40" :color="getWeatherIconColor(day.weather_code)">
                  <component :is="getWeatherIcon(day.weather_code)" />
                </el-icon>
                <div class="weather-text">{{ day.weather_text }}</div>
              </div>
              <div class="forecast-temp">
                <div class="temp-high">{{ day.temperature_high }}°</div>
                <div class="temp-low">{{ day.temperature_low }}°</div>
              </div>
              <div class="forecast-info">
                <div class="info-item">
                  <el-icon><Cloudy /></el-icon>
                  <span>{{ day.wind_speed }}m/s</span>
                </div>
                <div class="info-item">
                  <el-icon><Cloudy /></el-icon>
                  <span>{{ day.humidity }}%</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 灾害风险提示 -->
        <div v-if="currentWeather && getDisasterRisk(currentWeather).length > 0" class="disaster-risk">
          <el-alert
            title="⚠️ 潜在灾害风险"
            type="warning"
            :description="getDisasterRisk(currentWeather).join('；')"
            show-icon
            :closable="false"
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showRealWeatherDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Download, 
  Refresh, 
  DataAnalysis, 
  Cloudy, 
  Warning, 
  Plus, 
  Location,
  Sunny,
  // CloudyRain/Snowy/Wind 等在 Element Plus 中不存在，使用 Cloudy 代替
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getWarningList, cancelWarningRecord } from '@/api/warning'
import { getRealWeather, getWeatherForecast, submitRealWeatherData, getSupportedRegions } from '@/api/weather'

// 数据
const warnings = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedWarning = ref(null)
const showWeatherDialog = ref(false)
const showCreateDialog = ref(false)
const showRealWeatherDialog = ref(false)
const weatherLoading = ref(false)
const autoDetecting = ref(false)
const realWeatherLoading = ref(false)
const currentWeather = ref(null)
const weatherForecast = ref([])
const selectedRegion = ref('beijing')

// 筛选表单
const filterForm = reactive({
  region: '',
  level: '',
  status: ''
})

// 选择的预警
const selectedWarnings = ref([])

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 表单数据
const weatherForm = reactive({
  region: '',
  temperature: null,
  humidity: null,
  rainfall: null,
  wind_speed: null,
  wind_direction: '',
  air_pressure: null,
  record_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
})

const createForm = reactive({
  disaster_type_id: null,
  region: '',
  warning_level: '',
  warning_content: '',
  start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  end_time: ''
})

const disasterTypes = ref([])
const supportedRegions = ref(getSupportedRegions())

// 获取预警列表
const fetchWarnings = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filterForm
    }
    // 清理空字符串参数，避免后端校验报错
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await getWarningList(params)
    
    if (response.code === 200) {
      warnings.value = response.data.warnings
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('获取预警列表错误:', error)
    ElMessage.error('获取预警列表失败')
  } finally {
    loading.value = false
  }
}

// 获取灾害类型
const fetchDisasterTypes = async () => {
  try {
    const response = await fetch('/api/disaster-types')
    if (response.ok) {
      const data = await response.json()
      if (data.code === 200) {
        disasterTypes.value = data.data
      }
    }
  } catch (error) {
    console.error('获取灾害类型错误:', error)
  }
}

// 获取实时天气数据
const fetchRealWeather = async () => {
  try {
    realWeatherLoading.value = true
    
    // 获取当前天气
    const currentResponse = await getRealWeather(selectedRegion.value)
    if (currentResponse.code === 200) {
      currentWeather.value = currentResponse.data
    } else {
      ElMessage.error(currentResponse.message || '获取实时天气失败')
      return
    }
    
    // 获取3天预报
    const forecastResponse = await getWeatherForecast(selectedRegion.value, 3)
    if (forecastResponse.code === 200) {
      weatherForecast.value = forecastResponse.data
    }
    
    ElMessage.success('天气数据获取成功')
  } catch (error) {
    console.error('获取实时天气错误:', error)
    ElMessage.error('获取实时天气失败')
  } finally {
    realWeatherLoading.value = false
  }
}

// 同步真实天气数据到系统
const submitRealWeather = async () => {
  try {
    weatherLoading.value = true
    
    const response = await submitRealWeatherData(currentWeather.value)
    if (response.code === 200) {
      ElMessage.success('天气数据已同步到系统')
      // 同步后自动进行智能预警检测
      await autoDetectWarning()
    } else {
      ElMessage.error(response.message || '同步失败')
    }
  } catch (error) {
    console.error('同步天气数据错误:', error)
    ElMessage.error('同步天气数据失败')
  } finally {
    weatherLoading.value = false
  }
}

// 获取地区名称
const getRegionName = (regionCode) => {
  const region = supportedRegions.value.find(r => r.code === regionCode)
  return region ? region.name : regionCode
}

// 获取天气图标
const getWeatherIcon = (weatherCode) => {
  const iconMap = {
    '0': 'Sunny', // 晴天
    '1': 'Cloudy', // 多云
    '2': 'Cloudy', // 阴天
    '3': 'Cloudy', // 阵雨
    '4': 'Cloudy', // 雷阵雨
    '5': 'Cloudy', // 雷阵雨伴有冰雹
    '6': 'Cloudy', // 雨夹雪
    '7': 'Cloudy', // 小雪
    '8': 'Cloudy', // 中雪
    '9': 'Cloudy', // 大雪
    '10': 'Cloudy', // 浮尘
    '11': 'Cloudy', // 雾
    '12': 'Cloudy', // 小雨
    '13': 'Cloudy', // 中雨
    '14': 'Cloudy', // 大雨
    '15': 'Cloudy', // 暴雨
    '16': 'Cloudy', // 大暴雨
    '17': 'Cloudy', // 特大暴雨
    '18': 'Cloudy', // 阵雪
    '19': 'Cloudy', // 沙尘暴
    '20': 'Cloudy', // 小雨-中雨
    '21': 'Cloudy', // 中雨-大雨
    '22': 'Cloudy', // 大雨-暴雨
    '23': 'Cloudy', // 暴雨-大暴雨
    '24': 'Cloudy', // 大暴雨-特大暴雨
    '25': 'Cloudy', // 暴雨-大暴雨
    '26': 'Cloudy', // 大暴雨-特大暴雨
    '27': 'Cloudy', // 特大暴雨
    '28': 'Cloudy', // 雨夹雪
    '29': 'Cloudy', // 阵雨-中雨
    '30': 'Cloudy', // 中雨-大雨
    '31': 'Cloudy', // 大雨-暴雨
    '99': 'Warning' // 未知
  }
  return iconMap[weatherCode] || 'Warning'
}

// 获取天气图标颜色
const getWeatherIconColor = (weatherCode) => {
  if (weatherCode >= '3' && weatherCode <= '5') return '#409eff' // 降雨类 - 蓝色
  if (weatherCode >= '6' && weatherCode <= '9') return '#67c23a' // 降雪类 - 绿色
  if (weatherCode >= '12' && weatherCode <= '27') return '#e6a23c' // 降雨类 - 橙色
  if (weatherCode === '19') return '#909399' // 沙尘暴 - 灰色
  if (weatherCode === '11') return '#c0c4cc' // 雾 - 浅灰色
  return '#f39c12' // 晴天类 - 金色
}

// 计算体感温度
const calculateFeelTemp = (temp, humidity) => {
  // 简单的体感温度计算公式
  const feelTemp = temp + (humidity - 50) * 0.1
  return Math.round(feelTemp)
}

// 获取灾害风险提示
const getDisasterRisk = (weather) => {
  const risks = []
  
  // 干旱风险
  if (weather.humidity < 30 && weather.temperature > 35 && weather.rainfall < 5) {
    risks.push('存在干旱风险，请注意防旱')
  }
  
  // 洪涝风险
  if (weather.rainfall > 50) {
    risks.push('存在洪涝风险，请注意防汛')
  }
  
  // 台风风险
  if (weather.wind_speed > 17) {
    risks.push('存在台风风险，请注意防台')
  }
  
  // 高温风险
  if (weather.temperature > 38) {
    risks.push('存在高温风险，请注意防暑')
  }
  
  // 低温风险
  if (weather.temperature < -5) {
    risks.push('存在低温风险，请注意防寒')
  }
  
  return risks
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchWarnings()
}

// 重置筛选
const handleReset = () => {
  Object.assign(filterForm, {
    region: '',
    level: '',
    status: ''
  })
  pagination.page = 1
  fetchWarnings()
}

// 刷新数据
const refreshData = () => {
  fetchWarnings()
}

// 分页变化
const handleSizeChange = (val) => {
  pagination.limit = val
  pagination.page = 1
  fetchWarnings()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchWarnings()
}

// 查看详情
const viewDetail = (warning) => {
  selectedWarning.value = warning
  detailDialogVisible.value = true
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
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消预警错误:', error)
      ElMessage.error('取消预警失败')
    }
  }
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

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    active: 'success',
    expired: 'info',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    active: '有效',
    expired: '已过期',
    cancelled: '已取消'
  }
  return textMap[status] || '未知'
}

// 格式化时间
const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

// 导出数据
const exportData = () => {
  if (warnings.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  // 准备CSV数据
  const headers = ['预警等级', '区域', '灾害类型', '预警内容', '开始时间', '结束时间', '状态', '创建时间']
  const csvContent = [
    headers.join(','),
    ...warnings.value.map(warning => [
      getWarningLevelText(warning.warning_level),
      warning.region,
      warning.disasterType?.type_name || '',
      `"${warning.warning_content}"`,
      formatTime(warning.start_time),
      formatTime(warning.end_time),
      getStatusText(warning.status),
      formatTime(warning.created_at)
    ].join(','))
  ].join('\n')

  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `灾害预警数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

// 批量取消预警
const batchCancel = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要取消选中的 ${selectedWarnings.value.length} 条预警吗？`,
      '批量取消预警',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量处理取消操作
    const promises = selectedWarnings.value.map(warning => 
      cancelWarningRecord(warning.id)
    )
    
    await Promise.all(promises)
    ElMessage.success(`成功取消 ${selectedWarnings.value.length} 条预警`)
    selectedWarnings.value = []
    fetchWarnings()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量取消预警错误:', error)
      ElMessage.error('批量取消预警失败')
    }
  }
}

// 清空选择
const clearSelection = () => {
  selectedWarnings.value = []
}

// 提交气象数据
const submitWeatherData = async () => {
  try {
    weatherLoading.value = true
    
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token') || '""')}`
      },
      body: JSON.stringify(weatherForm)
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.code === 200) {
        ElMessage.success('气象数据提交成功')
        showWeatherDialog.value = false
        // 重置表单
        Object.assign(weatherForm, {
          region: '',
          temperature: null,
          humidity: null,
          rainfall: null,
          wind_speed: null,
          wind_direction: '',
          air_pressure: null,
          record_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
      }
    } else {
      ElMessage.error('气象数据提交失败')
    }
  } catch (error) {
    console.error('提交气象数据错误:', error)
    ElMessage.error('提交气象数据失败')
  } finally {
    weatherLoading.value = false
  }
}

// 创建预警
const submitCreateWarning = async () => {
  try {
    const response = await createWarning(createForm)
    if (response.code === 200) {
      ElMessage.success('预警创建成功')
      showCreateDialog.value = false
      fetchWarnings()
      // 重置表单
      Object.assign(createForm, {
        disaster_type_id: null,
        region: '',
        warning_level: '',
        warning_content: '',
        start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        end_time: ''
      })
    }
  } catch (error) {
    console.error('创建预警错误:', error)
    ElMessage.error('创建预警失败')
  }
}

// 智能预警检测
const autoDetectWarning = async () => {
  try {
    autoDetecting.value = true
    
    const response = await fetch('/api/warning/auto-detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token') || '""')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.code === 200) {
        if (data.data.warnings && data.data.warnings.length > 0) {
          ElMessage.success(`检测到 ${data.data.warnings.length} 个潜在预警`)
          fetchWarnings()
        } else {
          ElMessage.info('暂未检测到潜在预警')
        }
      }
    } else {
      ElMessage.error('智能预警检测失败')
    }
  } catch (error) {
    console.error('智能预警检测错误:', error)
    ElMessage.error('智能预警检测失败')
  } finally {
    autoDetecting.value = false
  }
}

// 处理预警选择
const handleWarningSelect = (warning, selected) => {
  if (selected) {
    if (!selectedWarnings.value.find(w => w.id === warning.id)) {
      selectedWarnings.value.push(warning)
    }
  } else {
    selectedWarnings.value = selectedWarnings.value.filter(w => w.id !== warning.id)
  }
}

onMounted(() => {
  fetchWarnings()
  fetchDisasterTypes()
  // 默认获取北京的天气
  fetchRealWeather()
})
</script>

<style scoped>
.warning-page {
  padding: 0;
}

.page-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.warning-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.warning-card {
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.warning-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.warning-card.selected {
  box-shadow: 0 0 0 2px #409eff;
  transform: translateY(-2px);
}

.warning-card.severe {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
}

.warning-card.moderate {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
}

.warning-card.light {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-time {
  font-size: 12px;
  color: #909399;
}

.warning-content h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  line-height: 1.5;
}

.warning-meta p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.warning-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.warning-detail {
  padding: 20px 0;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
  margin-right: 12px;
}

.detail-item p {
  margin: 0;
  line-height: 1.6;
}

.affected-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  margin: 0;
}

/* 实时天气样式 */
.real-weather-content {
  .region-selector {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .current-weather {
    margin-bottom: 24px;
    
    .weather-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #303133;
      }
      
      .update-time {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .weather-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
    }
    
    .weather-main {
      display: flex;
      align-items: center;
      gap: 24px;
      
      .weather-icon {
        flex-shrink: 0;
      }
      
      .weather-details {
        .temperature {
          font-size: 48px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .weather-text {
          font-size: 18px;
          color: #606266;
          margin-bottom: 12px;
        }
        
        .weather-meta {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #909399;
        }
      }
    }
    
    .weather-extra {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .extra-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;
        min-width: 80px;
        
        label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }
        
        span {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }
  
  .weather-forecast {
    h3 {
      margin: 0 0 16px 0;
      color: #303133;
    }
    
    .forecast-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      
      .forecast-card {
        text-align: center;
        
        .forecast-date {
          font-weight: 500;
          color: #303133;
          margin-bottom: 8px;
          
          .date-text {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
        
        .forecast-weather {
          margin: 16px 0;
          
          .weather-text {
            font-size: 14px;
            color: #606266;
            margin-top: 8px;
          }
        }
        
        .forecast-temp {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 12px 0;
          
          .temp-high {
            font-size: 18px;
            font-weight: 500;
            color: #f56c6c;
          }
          
          .temp-low {
            font-size: 16px;
            color: #409eff;
          }
        }
        
        .forecast-info {
          display: flex;
          justify-content: center;
          gap: 16px;
          
          .info-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .disaster-risk {
    margin-top: 20px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .warning-cards {
    grid-template-columns: 1fr;
  }
  
  .warning-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-item {
    flex-direction: column;
  }
  
  .detail-item label {
    margin-bottom: 4px;
  }
  
  .real-weather-content {
    .region-selector {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    .current-weather .weather-info {
      flex-direction: column;
      gap: 20px;
    }
    
    .weather-main {
      flex-direction: column;
      text-align: center;
    }
    
    .weather-forecast .forecast-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>