<template>
  <div class="admin-system-page">
    <el-card class="page-card">
      <template #header>
        <h3>系统管理</h3>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="系统信息" name="info">
          <div class="system-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="系统名称">{{ systemInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
              <el-descriptions-item label="系统描述">{{ systemInfo.description }}</el-descriptions-item>
              <el-descriptions-item label="服务器时间">{{ formatDate(systemInfo.serverTime) }}</el-descriptions-item>
              <el-descriptions-item label="Node版本">{{ systemInfo.nodeVersion }}</el-descriptions-item>
              <el-descriptions-item label="运行平台">{{ systemInfo.platform }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="系统日志" name="logs">
          <div class="system-logs">
            <el-table
              v-loading="logsLoading"
              :data="systemLogs"
              style="width: 100%"
              border
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="level" label="级别" width="120">
                <template #default="{ row }">
                  <el-tag :type="getLogLevelType(row.level)">
                    {{ row.level.toUpperCase() }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="消息" />
              <el-table-column prop="timestamp" label="时间" width="200">
                <template #default="{ row }">
                  {{ formatDate(row.timestamp) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理" name="data">
          <div class="data-management">
            <el-card class="mb-20">
              <template #header>
                <div class="flex-between">
                  <h4>作物参数</h4>
                  <el-button type="primary" size="small" @click="openCropDialog">
                    新增作物
                  </el-button>
                </div>
              </template>
              <el-table
                v-loading="dataLoading"
                :data="basicData.crops"
                style="width: 100%"
                border
              >
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="作物名称" />
                <el-table-column prop="growthCycle" label="生长周期(天)" width="120" />
                <el-table-column prop="disasterCoefficient" label="灾害系数" width="120" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openCropDialog(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteCrop(row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <el-card class="mb-20">
              <template #header>
                <div class="flex-between">
                  <div>
                    <h4>灾害类型管理</h4>
                    <p class="text-gray text-small">配置灾害类型及其预警阈值条件</p>
                  </div>
                  <el-button type="primary" size="small" @click="openDisasterTypeDialog">
                    新增灾害类型
                  </el-button>
                </div>
              </template>
              <el-table
                v-loading="disasterTypeLoading"
                :data="disasterTypeList"
                style="width: 100%"
                border
              >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="type_name" label="灾害名称" width="120" />
                <el-table-column prop="type_code" label="类型编码" width="100" />
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
                <el-table-column label="预警阈值配置" min-width="300">
                  <template #default="{ row }">
                    <div v-if="row.warning_criteria && row.warning_criteria.length > 0" class="criteria-tags">
                      <el-tag 
                        v-for="(criteria, index) in row.warning_criteria" 
                        :key="index"
                        :type="getCriteriaTagType(criteria.level)"
                        size="small"
                        class="criteria-tag"
                      >
                        {{ getCriteriaLabel(criteria) }}
                      </el-tag>
                    </div>
                    <el-tag v-else type="info" size="small">未配置</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openDisasterTypeDialog(row)">
                      编辑
                    </el-button>
                    <el-button type="success" size="small" @click="openThresholdDialog(row)">
                      阈值
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteDisasterType(row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <el-card>
              <template #header>
                <div class="flex-between">
                  <h4>资产单价</h4>
                  <el-button type="primary" size="small" @click="openAssetDialog">
                    新增资产
                  </el-button>
                </div>
              </template>
              <el-table
                v-loading="dataLoading"
                :data="basicData.assets"
                style="width: 100%"
                border
              >
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="资产名称" />
                <el-table-column prop="unitPrice" label="单价(元)" width="120" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openAssetDialog(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteAsset(row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <div class="mt-20 flex-right">
              <el-button type="primary" @click="saveBasicData">
                保存所有数据
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        

      </el-tabs>
    </el-card>
    
    <!-- 作物对话框 -->
    <el-dialog
      v-model="cropDialogVisible"
      :title="cropDialogType === 'create' ? '新增作物' : '编辑作物'"
      width="500px"
    >
      <el-form
        :model="cropForm"
        :rules="cropFormRules"
        ref="cropFormRef"
        label-width="120px"
      >
        <el-form-item label="作物名称" prop="name">
          <el-input v-model="cropForm.name" placeholder="请输入作物名称" />
        </el-form-item>
        <el-form-item label="生长周期(天)" prop="growthCycle">
          <el-input v-model.number="cropForm.growthCycle" type="number" placeholder="请输入生长周期" />
        </el-form-item>
        <el-form-item label="灾害系数" prop="disasterCoefficient">
          <el-input v-model.number="cropForm.disasterCoefficient" type="number" placeholder="请输入灾害系数" step="0.1" min="0" max="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cropDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCrop">
            {{ cropDialogType === 'create' ? '新增' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 灾害类型对话框 -->
    <el-dialog
      v-model="disasterTypeDialogVisible"
      :title="disasterTypeDialogType === 'create' ? '新增灾害类型' : '编辑灾害类型'"
      width="500px"
    >
      <el-form
        :model="disasterTypeForm"
        :rules="disasterTypeFormRules"
        ref="disasterTypeFormRef"
        label-width="120px"
      >
        <el-form-item label="灾害名称" prop="type_name">
          <el-input v-model="disasterTypeForm.type_name" placeholder="请输入灾害名称，如：暴雨、高温" />
        </el-form-item>
        <el-form-item label="类型编码" prop="type_code">
          <el-input v-model="disasterTypeForm.type_code" placeholder="请输入类型编码，如：rainstorm、heat" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="disasterTypeForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入灾害描述" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="disasterTypeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDisasterType">
            {{ disasterTypeDialogType === 'create' ? '新增' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 阈值配置对话框 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="配置预警阈值"
      width="700px"
    >
      <div v-if="currentDisasterType" class="threshold-dialog-content">
        <div class="threshold-header">
          <h4>{{ currentDisasterType.type_name }} - 预警阈值配置</h4>
          <p class="text-gray">设置触发预警的天气条件，当条件满足时将自动生成预警</p>
        </div>
        
        <div class="threshold-list">
          <div 
            v-for="(criteria, index) in thresholdForm.criteriaList" 
            :key="index"
            class="threshold-item"
          >
            <el-card shadow="hover">
              <div class="threshold-item-header">
                <span class="threshold-index">条件 {{ index + 1 }}</span>
                <el-button type="danger" link size="small" @click="removeCriteria(index)">
                  删除
                </el-button>
              </div>
              <div class="threshold-item-content">
                <el-row :gutter="10">
                  <el-col :span="6">
                    <el-select v-model="criteria.parameter" placeholder="参数">
                      <el-option label="温度" value="temperature" />
                      <el-option label="湿度" value="humidity" />
                      <el-option label="降雨量" value="rainfall" />
                      <el-option label="风速" value="wind_speed" />
                      <el-option label="气压" value="air_pressure" />
                    </el-select>
                  </el-col>
                  <el-col :span="5">
                    <el-select v-model="criteria.operator" placeholder="运算符">
                      <el-option label=">" value=">" />
                      <el-option label="<" value="<" />
                      <el-option label=">=" value=">=" />
                      <el-option label="<=" value="<=" />
                      <el-option label="=" value="=" />
                    </el-select>
                  </el-col>
                  <el-col :span="6">
                    <el-input-number 
                      v-model="criteria.value" 
                      :precision="1" 
                      :step="0.1"
                      placeholder="阈值"
                      style="width: 100%"
                    />
                  </el-col>
                  <el-col :span="7">
                    <el-select v-model="criteria.level" placeholder="预警级别">
                      <el-option label="轻度预警" value="light">
                        <el-tag type="success" size="small">轻度</el-tag>
                      </el-option>
                      <el-option label="中度预警" value="moderate">
                        <el-tag type="warning" size="small">中度</el-tag>
                      </el-option>
                      <el-option label="重度预警" value="severe">
                        <el-tag type="danger" size="small">重度</el-tag>
                      </el-option>
                    </el-select>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
          
          <div v-if="thresholdForm.criteriaList.length === 0" class="empty-criteria">
            <el-empty description="暂无阈值配置">
              <el-button type="primary" @click="addCriteria">添加条件</el-button>
            </el-empty>
          </div>
          
          <div v-else class="add-criteria-btn">
            <el-button type="primary" plain @click="addCriteria">
              <el-icon><Plus /></el-icon> 添加条件
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="thresholdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveThreshold">
            保存配置
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 资产对话框 -->
    <el-dialog
      v-model="assetDialogVisible"
      :title="assetDialogType === 'create' ? '新增资产' : '编辑资产'"
      width="500px"
    >
      <el-form
        :model="assetForm"
        :rules="assetFormRules"
        ref="assetFormRef"
        label-width="120px"
      >
        <el-form-item label="资产名称" prop="name">
          <el-input v-model="assetForm.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="单价(元)" prop="unitPrice">
          <el-input v-model.number="assetForm.unitPrice" type="number" placeholder="请输入单价" step="0.1" min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAsset">
            {{ assetDialogType === 'create' ? '新增' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi, dataApi } from '@/api/admin'
import { disasterTypeApi } from '@/api/disaster-types'

const activeTab = ref('info')
const systemInfo = ref({
  name: '',
  version: '',
  description: '',
  serverTime: '',
  nodeVersion: '',
  platform: ''
})
const systemLogs = ref([])
const logsLoading = ref(false)

// 基础数据
const basicData = ref({
  crops: [],
  disasterTypes: [],
  assets: []
})
const dataLoading = ref(false)

// 灾害类型管理
const disasterTypeList = ref([])
const disasterTypeLoading = ref(false)

// 灾害类型对话框
const disasterTypeDialogVisible = ref(false)
const disasterTypeDialogType = ref('create')
const disasterTypeForm = ref({
  id: null,
  type_name: '',
  type_code: '',
  description: ''
})
const disasterTypeFormRef = ref(null)
const disasterTypeFormRules = {
  type_name: [
    { required: true, message: '请输入灾害名称', trigger: 'blur' }
  ],
  type_code: [
    { required: true, message: '请输入类型编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '类型编码只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

// 阈值配置对话框
const thresholdDialogVisible = ref(false)
const currentDisasterType = ref(null)
const thresholdForm = ref({
  criteriaList: []
})

// 作物对话框
const cropDialogVisible = ref(false)
const cropDialogType = ref('create')
const cropForm = ref({
  id: null,
  name: '',
  growthCycle: '',
  disasterCoefficient: ''
})
const cropFormRef = ref(null)
const cropFormRules = {
  name: [
    { required: true, message: '请输入作物名称', trigger: 'blur' }
  ],
  growthCycle: [
    { required: true, message: '请输入生长周期', trigger: 'blur' },
    { type: 'number', min: 1, message: '生长周期必须大于0', trigger: 'blur' }
  ],
  disasterCoefficient: [
    { required: true, message: '请输入灾害系数', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '灾害系数必须在0-1之间', trigger: 'blur' }
  ]
}

// 资产对话框
const assetDialogVisible = ref(false)
const assetDialogType = ref('create')
const assetForm = ref({
  id: null,
  name: '',
  unitPrice: ''
})
const assetFormRef = ref(null)
const assetFormRules = {
  name: [
    { required: true, message: '请输入资产名称', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    { type: 'number', min: 0, message: '单价必须大于等于0', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 获取日志级别对应的标签类型
const getLogLevelType = (level) => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'default'
  }
}

// 加载系统信息
const loadSystemInfo = async () => {
  try {
    const response = await systemApi.getSystemInfo()
    if (response.code === 200) {
      systemInfo.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取系统信息失败')
  }
}

// 加载系统日志
const loadSystemLogs = async () => {
  logsLoading.value = true
  try {
    const response = await systemApi.getSystemLogs()
    if (response.code === 200) {
      systemLogs.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取系统日志失败')
  } finally {
    logsLoading.value = false
  }
}

// 加载基础数据
const loadBasicData = async () => {
  dataLoading.value = true
  try {
    const response = await dataApi.getBasicData()
    if (response.code === 200) {
      basicData.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取基础数据失败')
  } finally {
    dataLoading.value = false
  }
}

// 保存基础数据
const saveBasicData = async () => {
  try {
    const response = await dataApi.updateBasicData(basicData.value)
    if (response.code === 200) {
      ElMessage.success('保存基础数据成功')
    }
  } catch (error) {
    ElMessage.error('保存基础数据失败')
  }
}

// 打开作物对话框
const openCropDialog = (crop = null) => {
  if (crop) {
    cropDialogType.value = 'edit'
    cropForm.value = { ...crop }
  } else {
    cropDialogType.value = 'create'
    cropForm.value = {
      id: null,
      name: '',
      growthCycle: '',
      disasterCoefficient: ''
    }
  }
  cropDialogVisible.value = true
}

// 保存作物
const saveCrop = async () => {
  if (!cropFormRef.value) return
  
  await cropFormRef.value.validate(async (valid) => {
    if (valid) {
      if (cropDialogType.value === 'create') {
        // 生成新ID
        const newId = Math.max(...basicData.value.crops.map(c => c.id), 0) + 1
        cropForm.value.id = newId
        basicData.value.crops.push(cropForm.value)
      } else {
        // 更新现有作物
        const index = basicData.value.crops.findIndex(c => c.id === cropForm.value.id)
        if (index !== -1) {
          basicData.value.crops[index] = { ...cropForm.value }
        }
      }
      ElMessage.success(cropDialogType.value === 'create' ? '新增作物成功' : '更新作物成功')
      cropDialogVisible.value = false
    }
  })
}

// 删除作物
const deleteCrop = (id) => {
  ElMessageBox.confirm('确定要删除这个作物吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    basicData.value.crops = basicData.value.crops.filter(c => c.id !== id)
    ElMessage.success('删除作物成功')
  }).catch(() => {
    // 取消删除
  })
}

// 打开资产对话框
const openAssetDialog = (asset = null) => {
  if (asset) {
    assetDialogType.value = 'edit'
    assetForm.value = { ...asset }
  } else {
    assetDialogType.value = 'create'
    assetForm.value = {
      id: null,
      name: '',
      unitPrice: ''
    }
  }
  assetDialogVisible.value = true
}

// 保存资产
const saveAsset = async () => {
  if (!assetFormRef.value) return
  
  await assetFormRef.value.validate(async (valid) => {
    if (valid) {
      if (assetDialogType.value === 'create') {
        // 生成新ID
        const newId = Math.max(...basicData.value.assets.map(a => a.id), 0) + 1
        assetForm.value.id = newId
        basicData.value.assets.push(assetForm.value)
      } else {
        // 更新现有资产
        const index = basicData.value.assets.findIndex(a => a.id === assetForm.value.id)
        if (index !== -1) {
          basicData.value.assets[index] = { ...assetForm.value }
        }
      }
      ElMessage.success(assetDialogType.value === 'create' ? '新增资产成功' : '更新资产成功')
      assetDialogVisible.value = false
    }
  })
}

// 删除资产
const deleteAsset = (id) => {
  ElMessageBox.confirm('确定要删除这个资产吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    basicData.value.assets = basicData.value.assets.filter(a => a.id !== id)
    ElMessage.success('删除资产成功')
  }).catch(() => {
    // 取消删除
  })
}

// 获取阈值标签类型
const getCriteriaTagType = (level) => {
  const typeMap = {
    'light': 'success',
    'moderate': 'warning',
    'severe': 'danger'
  }
  return typeMap[level] || 'info'
}

// 获取阈值显示标签
const getCriteriaLabel = (criteria) => {
  const paramNames = {
    'temperature': '温度',
    'humidity': '湿度',
    'rainfall': '降雨量',
    'wind_speed': '风速',
    'air_pressure': '气压'
  }
  const levelNames = {
    'light': '轻度',
    'moderate': '中度',
    'severe': '重度'
  }
  const param = paramNames[criteria.parameter] || criteria.parameter
  const level = levelNames[criteria.level] || criteria.level
  return `${param}${criteria.operator}${criteria.value}(${level})`
}

// 加载灾害类型列表
const loadDisasterTypes = async () => {
  disasterTypeLoading.value = true
  try {
    const response = await disasterTypeApi.getDisasterTypes()
    if (response.code === 200) {
      // 解析warning_criteria JSON（支持下划线和驼峰命名）
      disasterTypeList.value = response.data.map(item => {
        // 尝试获取warning_criteria（可能是warningCriteria或warning_criteria）
        let criteria = item.warning_criteria || item.warningCriteria || null
        
        // 如果是字符串，解析为JSON
        if (criteria && typeof criteria === 'string') {
          try {
            criteria = JSON.parse(criteria)
          } catch (e) {
            criteria = null
          }
        }
        
        // 将分组格式转换为数组格式
        let criteriaArray = []
        if (criteria && typeof criteria === 'object') {
          // 检查是否是分组格式 { light: [...], moderate: [...], severe: [...] }
          if (criteria.light || criteria.moderate || criteria.severe) {
            const levels = ['light', 'moderate', 'severe']
            levels.forEach(level => {
              if (criteria[level] && Array.isArray(criteria[level])) {
                criteria[level].forEach(c => {
                  criteriaArray.push({
                    parameter: c.type || c.parameter,
                    operator: c.operator,
                    value: c.value,
                    level: level
                  })
                })
              }
            })
          } else if (Array.isArray(criteria)) {
            // 已经是数组格式
            criteriaArray = criteria
          }
        }
        
        return {
          ...item,
          warning_criteria: criteriaArray
        }
      })
      console.log('加载的灾害类型数据:', disasterTypeList.value)
    }
  } catch (error) {
    console.error('加载灾害类型失败:', error)
    ElMessage.error('获取灾害类型列表失败')
  } finally {
    disasterTypeLoading.value = false
  }
}

// 打开灾害类型对话框
const openDisasterTypeDialog = (disasterType = null) => {
  if (disasterType) {
    disasterTypeDialogType.value = 'edit'
    disasterTypeForm.value = { 
      id: disasterType.id,
      type_name: disasterType.type_name,
      type_code: disasterType.type_code,
      description: disasterType.description || ''
    }
  } else {
    disasterTypeDialogType.value = 'create'
    disasterTypeForm.value = {
      id: null,
      type_name: '',
      type_code: '',
      description: ''
    }
  }
  disasterTypeDialogVisible.value = true
}

// 保存灾害类型
const saveDisasterType = async () => {
  if (!disasterTypeFormRef.value) return
  
  await disasterTypeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (disasterTypeDialogType.value === 'create') {
          const response = await disasterTypeApi.createDisasterType({
            type_name: disasterTypeForm.value.type_name,
            type_code: disasterTypeForm.value.type_code,
            description: disasterTypeForm.value.description,
            warning_criteria: []
          })
          if (response.code === 200) {
            ElMessage.success('新增灾害类型成功')
            loadDisasterTypes()
          }
        } else {
          const response = await disasterTypeApi.updateDisasterType(disasterTypeForm.value.id, {
            type_name: disasterTypeForm.value.type_name,
            type_code: disasterTypeForm.value.type_code,
            description: disasterTypeForm.value.description
          })
          if (response.code === 200) {
            ElMessage.success('更新灾害类型成功')
            loadDisasterTypes()
          }
        }
        disasterTypeDialogVisible.value = false
      } catch (error) {
        ElMessage.error(disasterTypeDialogType.value === 'create' ? '新增失败' : '更新失败')
      }
    }
  })
}

// 删除灾害类型
const deleteDisasterType = (id) => {
  ElMessageBox.confirm('确定要删除这个灾害类型吗？删除后将无法恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await disasterTypeApi.deleteDisasterType(id)
      if (response.code === 200) {
        ElMessage.success('删除灾害类型成功')
        loadDisasterTypes()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 打开阈值配置对话框
const openThresholdDialog = (disasterType) => {
  currentDisasterType.value = disasterType
  thresholdForm.value.criteriaList = disasterType.warning_criteria ? 
    [...disasterType.warning_criteria] : []
  thresholdDialogVisible.value = true
}

// 添加阈值条件
const addCriteria = () => {
  thresholdForm.value.criteriaList.push({
    parameter: 'temperature',
    operator: '>',
    value: 0,
    level: 'moderate'
  })
}

// 删除阈值条件
const removeCriteria = (index) => {
  thresholdForm.value.criteriaList.splice(index, 1)
}

// 保存阈值配置
const saveThreshold = async () => {
  if (!currentDisasterType.value) return
  
  try {
    const response = await disasterTypeApi.updateDisasterType(currentDisasterType.value.id, {
      type_name: currentDisasterType.value.type_name,
      type_code: currentDisasterType.value.type_code,
      description: currentDisasterType.value.description,
      warning_criteria: thresholdForm.value.criteriaList
    })
    if (response.code === 200) {
      ElMessage.success('阈值配置保存成功')
      loadDisasterTypes()
      thresholdDialogVisible.value = false
    }
  } catch (error) {
    ElMessage.error('保存阈值配置失败')
  }
}

// 页面挂载时加载数据
onMounted(() => {
  loadSystemInfo()
  loadSystemLogs()
  loadBasicData()
  loadDisasterTypes()
})
</script>

<style scoped>
.admin-system-page {
  padding: 0;
}

.page-card {
  border-radius: 12px;
}

.system-info {
  margin-top: 20px;
}

.system-logs {
  margin-top: 20px;
}

.data-management {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.flex-right {
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mr-10 {
  margin-right: 10px;
}

.empty-criteria {
  padding: 20px;
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}

.text-gray {
  color: #909399;
}

.text-small {
  font-size: 12px;
  margin-top: 4px;
}

.criteria-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.criteria-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.threshold-dialog-content {
  max-height: 500px;
  overflow-y: auto;
}

.threshold-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.threshold-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.threshold-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.threshold-item {
  position: relative;
}

.threshold-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.threshold-index {
  font-weight: bold;
  color: #606266;
}

.threshold-item-content {
  padding: 10px 0;
}

.add-criteria-btn {
  text-align: center;
  margin-top: 10px;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>