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
                  <h4>灾害系数</h4>
                  <el-button type="primary" size="small" @click="openDisasterDialog">
                    新增灾害类型
                  </el-button>
                </div>
              </template>
              <el-table
                v-loading="dataLoading"
                :data="basicData.disasterTypes"
                style="width: 100%"
                border
              >
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="灾害名称" />
                <el-table-column prop="level" label="等级" width="100" />
                <el-table-column prop="coefficient" label="系数" width="100" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openDisasterDialog(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteDisaster(row.id)">
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
        
        <el-tab-pane label="灾害类型管理" name="disaster-types">
          <div class="disaster-types-management">
            <el-card>
              <template #header>
                <div class="flex-between">
                  <h4>灾害类型管理</h4>
                  <el-button type="primary" @click="openCreateDialog">
                    <el-icon><Plus /></el-icon>
                    新增灾害类型
                  </el-button>
                </div>
              </template>
              <el-table
                v-loading="disasterTypesLoading"
                :data="disasterTypes"
                style="width: 100%"
                border
              >
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="type_name" label="灾害类型" />
                <el-table-column prop="type_code" label="类型编码" width="120" />
                <el-table-column prop="description" label="描述" />
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      type="primary"
                      size="small"
                      @click="openEditDialog(row)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="handleDelete(row.id)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
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
      v-model="disasterDialogVisible"
      :title="disasterDialogType === 'create' ? '新增灾害类型' : '编辑灾害类型'"
      width="500px"
    >
      <el-form
        :model="disasterForm"
        :rules="disasterFormRules"
        ref="disasterFormRef"
        label-width="120px"
      >
        <el-form-item label="灾害名称" prop="name">
          <el-input v-model="disasterForm.name" placeholder="请输入灾害名称" />
        </el-form-item>
        <el-form-item label="等级" prop="level">
          <el-select v-model="disasterForm.level" placeholder="请选择等级">
            <el-option label="轻度" value="轻度" />
            <el-option label="中度" value="中度" />
            <el-option label="重度" value="重度" />
          </el-select>
        </el-form-item>
        <el-form-item label="系数" prop="coefficient">
          <el-input v-model.number="disasterForm.coefficient" type="number" placeholder="请输入系数" step="0.1" min="0" max="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="disasterDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDisaster">
            {{ disasterDialogType === 'create' ? '新增' : '保存' }}
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
    
    <!-- 灾害类型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增灾害类型' : '编辑灾害类型'"
      width="600px"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="灾害类型" prop="type_name">
          <el-input v-model="formData.type_name" placeholder="请输入灾害类型名称" />
        </el-form-item>
        <el-form-item label="类型编码" prop="type_code">
          <el-input v-model="formData.type_code" placeholder="请输入类型编码（英文）" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入灾害描述" :rows="3" />
        </el-form-item>
        <el-form-item label="预警阈值" prop="warning_criteria">
          <el-card>
            <template #header>
              <div class="flex-between">
                <h4>分级预警阈值</h4>
                <el-button type="primary" size="small" @click="addCriteria('severe')">
                  添加条件
                </el-button>
              </div>
            </template>
            
            <!-- 重度预警 -->
            <div class="criteria-section">
              <h5 class="criteria-title">🔴 重度预警 (Severe)</h5>
              <div v-if="formData.warning_criteria.severe.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.severe" :key="`severe-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('severe', index)">
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 中度预警 -->
            <div class="criteria-section mt-20">
              <h5 class="criteria-title">🟠 中度预警 (Moderate)</h5>
              <div v-if="formData.warning_criteria.moderate.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.moderate" :key="`moderate-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('moderate', index)">
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 轻度预警 -->
            <div class="criteria-section mt-20">
              <h5 class="criteria-title">🟡 轻度预警 (Light)</h5>
              <div v-if="formData.warning_criteria.light.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.light" :key="`light-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('light', index)">
                  删除
                </el-button>
              </div>
            </div>
          </el-card>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ dialogType === 'create' ? '创建' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
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
const disasterTypes = ref([])
const disasterTypesLoading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('create')
const currentId = ref(null)
const formRef = ref(null)

const formData = ref({
  type_name: '',
  type_code: '',
  description: '',
  warning_criteria: {
    severe: [],
    moderate: [],
    light: []
  }
})

const formRules = {
  type_name: [
    { required: true, message: '请输入灾害类型名称', trigger: 'blur' }
  ],
  type_code: [
    { required: true, message: '请输入类型编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '类型编码只能包含小写字母和下划线', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入灾害描述', trigger: 'blur' }
  ]
}

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

// 灾害类型对话框
const disasterDialogVisible = ref(false)
const disasterDialogType = ref('create')
const disasterForm = ref({
  id: null,
  name: '',
  level: '',
  coefficient: ''
})
const disasterFormRef = ref(null)
const disasterFormRules = {
  name: [
    { required: true, message: '请输入灾害名称', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请选择等级', trigger: 'change' }
  ],
  coefficient: [
    { required: true, message: '请输入系数', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '系数必须在0-1之间', trigger: 'blur' }
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

// 打开灾害类型对话框
const openDisasterDialog = (disaster = null) => {
  if (disaster) {
    disasterDialogType.value = 'edit'
    disasterForm.value = { ...disaster }
  } else {
    disasterDialogType.value = 'create'
    disasterForm.value = {
      id: null,
      name: '',
      level: '',
      coefficient: ''
    }
  }
  disasterDialogVisible.value = true
}

// 保存灾害类型
const saveDisaster = async () => {
  if (!disasterFormRef.value) return
  
  await disasterFormRef.value.validate(async (valid) => {
    if (valid) {
      if (disasterDialogType.value === 'create') {
        // 生成新ID
        const newId = Math.max(...basicData.value.disasterTypes.map(d => d.id), 0) + 1
        disasterForm.value.id = newId
        basicData.value.disasterTypes.push(disasterForm.value)
      } else {
        // 更新现有灾害类型
        const index = basicData.value.disasterTypes.findIndex(d => d.id === disasterForm.value.id)
        if (index !== -1) {
          basicData.value.disasterTypes[index] = { ...disasterForm.value }
        }
      }
      ElMessage.success(disasterDialogType.value === 'create' ? '新增灾害类型成功' : '更新灾害类型成功')
      disasterDialogVisible.value = false
    }
  })
}

// 删除灾害类型
const deleteDisaster = (id) => {
  ElMessageBox.confirm('确定要删除这个灾害类型吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    basicData.value.disasterTypes = basicData.value.disasterTypes.filter(d => d.id !== id)
    ElMessage.success('删除灾害类型成功')
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

// 加载灾害类型列表
const loadDisasterTypes = async () => {
  disasterTypesLoading.value = true
  try {
    const response = await disasterTypeApi.getDisasterTypes()
    if (response.code === 200) {
      disasterTypes.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取灾害类型列表失败')
  } finally {
    disasterTypesLoading.value = false
  }
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = 'create'
  currentId.value = null
  formData.value = {
    type_name: '',
    type_code: '',
    description: '',
    warning_criteria: {
      severe: [],
      moderate: [],
      light: []
    }
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (disasterType) => {
  dialogType.value = 'edit'
  currentId.value = disasterType.id
  formData.value = {
    type_name: disasterType.type_name,
    type_code: disasterType.type_code,
    description: disasterType.description,
    warning_criteria: disasterType.warning_criteria || {
      severe: [],
      moderate: [],
      light: []
    }
  }
  dialogVisible.value = true
}

// 添加条件
const addCriteria = (level) => {
  formData.value.warning_criteria[level].push({
    type: '',
    operator: '',
    value: ''
  })
}

// 移除条件
const removeCriteria = (level, index) => {
  formData.value.warning_criteria[level].splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        if (dialogType.value === 'create') {
          response = await disasterTypeApi.createDisasterType(formData.value)
        } else {
          response = await disasterTypeApi.updateDisasterType(currentId.value, formData.value)
        }
        
        if (response.code === 200) {
          ElMessage.success(dialogType.value === 'create' ? '创建灾害类型成功' : '更新灾害类型成功')
          dialogVisible.value = false
          await loadDisasterTypes()
        }
      } catch (error) {
        ElMessage.error(dialogType.value === 'create' ? '创建灾害类型失败' : '更新灾害类型失败')
      }
    }
  })
}

// 删除灾害类型
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个灾害类型吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await disasterTypeApi.deleteDisasterType(id)
      if (response.code === 200) {
        ElMessage.success('删除灾害类型成功')
        await loadDisasterTypes()
      }
    } catch (error) {
      ElMessage.error('删除灾害类型失败')
    }
  }).catch(() => {
    // 取消删除
  })
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

.disaster-types-management {
  margin-top: 20px;
}

.criteria-section {
  margin-top: 15px;
}

.criteria-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.criteria-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
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
</style>