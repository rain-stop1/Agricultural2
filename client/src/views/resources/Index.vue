<template>
  <div class="resources-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showAddResourceDialog = true">
        <el-icon><Plus /></el-icon>
        添加资源
      </el-button>
      <el-button type="warning" @click="showAddDemandDialog = true">
        <el-icon><DocumentAdd /></el-icon>
        发布需求
      </el-button>
    </div>

    <!-- 统计卡片 - 仅管理员可见 -->
    <el-row v-if="isAdmin" :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
              <el-icon size="32"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_resources }}</div>
              <div class="stat-label">总资源数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f0f9ff; color: #67c23a;">
              <el-icon size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.available_resources }}</div>
              <div class="stat-label">可用资源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pending_demands }}</div>
              <div class="stat-label">待满足需求</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
              <el-icon size="32"><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.matched_count }}</div>
              <div class="stat-label">已匹配次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧：资源库 -->
      <el-col :span="12">
        <el-card class="resource-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>资源库</h3>
                <el-tag v-if="isFarmer" type="warning" size="small" style="margin-left: 8px;">仅显示我的资源</el-tag>
              </div>
              <el-select v-model="resourceFilter" size="small" style="width: 120px;">
                <el-option label="全部" value="all" />
                <el-option label="农机" value="machinery" />
                <el-option label="农资" value="material" />
                <el-option label="农技服务" value="service" />
              </el-select>
            </div>
          </template>

          <div class="resource-list">
            <div 
              v-for="resource in filteredResources" 
              :key="resource.id"
              class="resource-item"
            >
              <div class="resource-header">
                <div class="resource-title">
                  <el-tag :type="getResourceTypeTag(resource.type)" size="small">
                    {{ getResourceTypeName(resource.type) }}
                  </el-tag>
                  <span class="resource-name">{{ resource.name }}</span>
                </div>
                <el-tag :type="resource.status === 'available' ? 'success' : 'info'" size="small">
                  {{ resource.status === 'available' ? '可用' : '使用中' }}
                </el-tag>
              </div>

              <div class="resource-info">
                <div class="info-row">
                  <span class="label">所有者：</span>
                  <span class="value">{{ resource.owner }}</span>
                </div>
                <div class="info-row">
                  <span class="label">位置：</span>
                  <span class="value">{{ resource.location }}</span>
                </div>
                <div class="info-row">
                  <span class="label">数量/规格：</span>
                  <span class="value">{{ resource.quantity }} {{ resource.unit }}</span>
                </div>
              </div>

              <div class="resource-actions">
                <el-button size="small" @click="viewResourceDetail(resource)">详情</el-button>
                <!-- 农户可以申请使用资源 -->
                <el-button 
                  v-if="isFarmer && resource.status === 'available'" 
                  size="small" 
                  type="primary"
                  @click="applyResource(resource)"
                >
                  申请使用
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：需求列表 -->
      <el-col :span="12">
        <el-card class="demand-card">
          <template #header>
            <div class="card-header">
              <h3>需求列表</h3>
              <el-tag type="warning">{{ demands.length }} 条需求</el-tag>
            </div>
          </template>

          <div class="demand-list">
            <div 
              v-for="demand in demands" 
              :key="demand.id"
              class="demand-item"
              :class="{ matched: demand.matched }"
            >
              <div class="demand-header">
                <div class="demand-title">
                  <el-tag :type="getResourceTypeTag(demand.resource_type)" size="small">
                    {{ getResourceTypeName(demand.resource_type) }}
                  </el-tag>
                  <span class="demand-name">{{ demand.title }}</span>
                </div>
                <el-tag :type="demand.matched ? 'success' : 'warning'" size="small">
                  {{ demand.matched ? '已匹配' : '待匹配' }}
                </el-tag>
              </div>

              <div class="demand-info">
                <div class="info-row">
                  <span class="label">需求方：</span>
                  <span class="value">{{ demand.requester }}</span>
                </div>
                <div class="info-row">
                  <span class="label">位置：</span>
                  <span class="value">{{ demand.location }}</span>
                </div>
                <div class="info-row">
                  <span class="label">需求量：</span>
                  <span class="value">{{ demand.quantity }} {{ demand.unit }}</span>
                </div>
                <div class="info-row">
                  <span class="label">紧急程度：</span>
                  <el-rate v-model="demand.urgency" disabled size="small" />
                </div>
              </div>

              <div class="demand-actions">
                <el-button size="small" @click="viewDemandDetail(demand)">详情</el-button>
                <!-- 只有管理员可以匹配资源 -->
                <el-button 
                  v-if="isAdmin && !demand.matched" 
                  size="small" 
                  type="success"
                  @click="matchDemand(demand)"
                >
                  匹配资源
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加资源对话框 -->
    <el-dialog
      v-model="showAddResourceDialog"
      title="添加资源"
      width="600px"
    >
      <el-form :model="resourceForm" label-width="100px">
        <el-form-item label="资源类型">
          <el-select v-model="resourceForm.type" placeholder="选择资源类型">
            <el-option label="农机" value="machinery" />
            <el-option label="农资" value="material" />
            <el-option label="农技服务" value="service" />
          </el-select>
        </el-form-item>

        <el-form-item label="资源名称">
          <el-input v-model="resourceForm.name" placeholder="输入资源名称" />
        </el-form-item>

        <el-form-item label="所有者">
          <el-input v-model="resourceForm.owner" placeholder="输入所有者姓名" />
        </el-form-item>

        <el-form-item label="位置">
          <el-input v-model="resourceForm.location" placeholder="输入资源位置" />
        </el-form-item>

        <el-form-item label="数量">
          <el-input-number v-model="resourceForm.quantity" :min="1" />
        </el-form-item>

        <el-form-item label="单位">
          <el-input v-model="resourceForm.unit" placeholder="如：台、吨、次" style="width: 120px;" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input 
            v-model="resourceForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddResourceDialog = false">取消</el-button>
        <el-button type="primary" @click="addResource" :loading="resourceLoading">
          添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 发布需求对话框 -->
    <el-dialog
      v-model="showAddDemandDialog"
      title="发布需求"
      width="600px"
    >
      <el-form :model="demandForm" label-width="100px">
        <el-form-item label="资源类型">
          <el-select v-model="demandForm.resource_type" placeholder="选择资源类型">
            <el-option label="农机" value="machinery" />
            <el-option label="农资" value="material" />
            <el-option label="农技服务" value="service" />
          </el-select>
        </el-form-item>

        <el-form-item label="需求标题">
          <el-input v-model="demandForm.title" placeholder="输入需求标题" />
        </el-form-item>

        <el-form-item label="需求方">
          <el-input v-model="demandForm.requester" placeholder="输入需求方姓名" />
        </el-form-item>

        <el-form-item label="位置">
          <el-input v-model="demandForm.location" placeholder="输入位置" />
        </el-form-item>

        <el-form-item label="需求量">
          <el-input-number v-model="demandForm.quantity" :min="1" />
        </el-form-item>

        <el-form-item label="单位">
          <el-input v-model="demandForm.unit" placeholder="如：台、吨、次" style="width: 120px;" />
        </el-form-item>

        <el-form-item label="紧急程度">
          <el-rate v-model="demandForm.urgency" />
        </el-form-item>

        <el-form-item label="需求描述">
          <el-input 
            v-model="demandForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="详细描述需求"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDemandDialog = false">取消</el-button>
        <el-button type="primary" @click="addDemand" :loading="demandLoading">
          发布
        </el-button>
      </template>
    </el-dialog>

    <!-- 匹配资源对话框 -->
    <el-dialog
      v-model="showMatchDialog"
      title="匹配资源"
      width="700px"
    >
      <div v-if="currentDemand" class="match-dialog-content">
        <div class="demand-summary">
          <h4>需求信息</h4>
          <div class="summary-item">
            <span class="label">需求标题：</span>
            <span class="value">{{ currentDemand.title }}</span>
          </div>
          <div class="summary-item">
            <span class="label">需求方：</span>
            <span class="value">{{ currentDemand.requester }}</span>
          </div>
          <div class="summary-item">
            <span class="label">需求量：</span>
            <span class="value">{{ currentDemand.quantity }} {{ currentDemand.unit }}</span>
          </div>
        </div>

        <el-divider />

        <div class="available-resources">
          <h4>可用资源（{{ availableResources.length }} 个）</h4>
          <el-radio-group v-model="selectedResourceId" class="resource-radio-group">
            <div 
              v-for="resource in availableResources" 
              :key="resource.id"
              class="resource-radio-item"
              :class="{ selected: selectedResourceId === resource.id }"
              @click="selectedResourceId = resource.id"
            >
              <el-radio :label="resource.id">
                <div class="resource-radio-content">
                  <div class="resource-radio-header">
                    <span class="resource-radio-name">{{ resource.name }}</span>
                    <el-tag size="small" type="success">可用</el-tag>
                  </div>
                  <div class="resource-radio-info">
                    <div class="info-item">
                      <el-icon><User /></el-icon>
                      <span>{{ resource.owner }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Location /></el-icon>
                      <span>{{ resource.location }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Box /></el-icon>
                      <span>{{ resource.quantity }} {{ resource.unit }}</span>
                    </div>
                  </div>
                  <div v-if="resource.remark" class="resource-radio-remark">
                    备注：{{ resource.remark }}
                  </div>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="showMatchDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMatch">
          确认匹配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  DocumentAdd,
  Box,
  CircleCheck,
  Warning,
  Connection,
  User,
  Location
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { 
  getResources, 
  addResource as addResourceAPI, 
  getDemands, 
  addDemand as addDemandAPI, 
  matchDemand as matchDemandAPI,
  getResourceStatistics 
} from '@/api/resources'

// 用户信息
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.user_type === 'admin')
const isFarmer = computed(() => userStore.user?.user_type === 'farmer')

// 是否使用模拟数据
const useMockData = ref(false)

// 响应式数据
const showAddResourceDialog = ref(false)
const showAddDemandDialog = ref(false)
const showMatchDialog = ref(false)
const resourceLoading = ref(false)
const demandLoading = ref(false)
const resourceFilter = ref('all')
const resources = ref([])
const demands = ref([])
const currentDemand = ref(null)
const availableResources = ref([])
const selectedResourceId = ref(null)

// 统计数据
const statistics = ref({
  total_resources: 0,
  available_resources: 0,
  pending_demands: 0,
  matched_count: 0
})

// 表单数据
const resourceForm = reactive({
  type: '',
  name: '',
  owner: '',
  location: '',
  quantity: 1,
  unit: '',
  remark: ''
})

const demandForm = reactive({
  resource_type: '',
  title: '',
  requester: '',
  location: '',
  quantity: 1,
  unit: '',
  urgency: 3,
  description: ''
})

// 计算属性：过滤资源
const filteredResources = computed(() => {
  if (resourceFilter.value === 'all') {
    return resources.value
  }
  return resources.value.filter(r => r.type === resourceFilter.value)
})

// 加载数据（优先使用API，失败则使用模拟数据）
const loadData = async () => {
  try {
    // 尝试从API加载数据
    const [resourcesRes, demandsRes, statsRes] = await Promise.all([
      getResources({ type: resourceFilter.value === 'all' ? undefined : resourceFilter.value }),
      getDemands(),
      getResourceStatistics()
    ])

    if (resourcesRes.code === 200) {
      resources.value = resourcesRes.data
      useMockData.value = false
    }

    if (demandsRes.code === 200) {
      demands.value = demandsRes.data
    }

    if (statsRes.code === 200) {
      statistics.value = statsRes.data
    }
  } catch (error) {
    console.warn('API加载失败，使用模拟数据:', error)
    useMockData.value = true
    initMockData()
  }
}

// 模拟数据初始化
const initMockData = () => {
  // 模拟资源数据
  resources.value = [
    {
      id: 1,
      type: 'machinery',
      name: '拖拉机',
      owner: '张三',
      location: '江苏省南京市江宁区',
      quantity: 2,
      unit: '台',
      status: 'available',
      remark: '50马力，状态良好'
    },
    {
      id: 2,
      type: 'machinery',
      name: '收割机',
      owner: '李四',
      location: '江苏省苏州市吴中区',
      quantity: 1,
      unit: '台',
      status: 'in_use',
      remark: '联合收割机'
    },
    {
      id: 3,
      type: 'material',
      name: '化肥',
      owner: '王五',
      location: '河北省石家庄市藁城区',
      quantity: 500,
      unit: '公斤',
      status: 'available',
      remark: '复合肥'
    },
    {
      id: 4,
      type: 'material',
      name: '农药',
      owner: '赵六',
      location: '山东省济南市历城区',
      quantity: 100,
      unit: '升',
      status: 'available',
      remark: '杀虫剂'
    },
    {
      id: 5,
      type: 'service',
      name: '农技指导',
      owner: '农技站',
      location: '浙江省杭州市余杭区',
      quantity: 10,
      unit: '次',
      status: 'available',
      remark: '提供病虫害防治指导'
    }
  ]

  // 模拟需求数据
  demands.value = [
    {
      id: 1,
      resource_type: 'machinery',
      title: '急需拖拉机进行翻耕',
      requester: '孙七',
      location: '江苏省南京市浦口区',
      quantity: 1,
      unit: '台',
      urgency: 5,
      description: '50亩地需要翻耕，急需拖拉机',
      matched: false
    },
    {
      id: 2,
      resource_type: 'material',
      title: '需要化肥用于追肥',
      requester: '周八',
      location: '河北省石家庄市正定县',
      quantity: 200,
      unit: '公斤',
      urgency: 3,
      description: '小麦追肥期，需要复合肥',
      matched: false
    },
    {
      id: 3,
      resource_type: 'service',
      name: '病虫害防治咨询',
      requester: '吴九',
      location: '浙江省杭州市萧山区',
      quantity: 1,
      unit: '次',
      urgency: 4,
      description: '作物出现病虫害，需要专家指导',
      matched: true
    }
  ]

  // 更新统计数据
  updateStatistics()
}

// 更新统计数据（本地计算，用于模拟数据）
const updateStatistics = () => {
  statistics.value = {
    total_resources: resources.value.length,
    available_resources: resources.value.filter(r => r.status === 'available').length,
    pending_demands: demands.value.filter(d => !d.matched).length,
    matched_count: demands.value.filter(d => d.matched).length
  }
}

// 添加资源
const addResource = async () => {
  if (!resourceForm.type || !resourceForm.name || !resourceForm.owner) {
    ElMessage.warning('请填写完整信息')
    return
  }

  resourceLoading.value = true

  try {
    if (useMockData.value) {
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newResource = {
        id: Date.now(),
        ...resourceForm,
        status: 'available'
      }

      resources.value.unshift(newResource)
      updateStatistics()
    } else {
      // 使用真实API
      const response = await addResourceAPI(resourceForm)
      
      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    ElMessage.success('资源添加成功')
    showAddResourceDialog.value = false

    // 重置表单
    Object.assign(resourceForm, {
      type: '',
      name: '',
      owner: '',
      location: '',
      quantity: 1,
      unit: '',
      remark: ''
    })
  } catch (error) {
    console.error('添加资源失败:', error)
    ElMessage.error('添加资源失败，请重试')
  } finally {
    resourceLoading.value = false
  }
}

// 添加需求
const addDemand = async () => {
  if (!demandForm.resource_type || !demandForm.title || !demandForm.requester) {
    ElMessage.warning('请填写完整信息')
    return
  }

  demandLoading.value = true

  try {
    if (useMockData.value) {
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newDemand = {
        id: Date.now(),
        ...demandForm,
        matched: false
      }

      demands.value.unshift(newDemand)
      updateStatistics()
    } else {
      // 使用真实API
      const response = await addDemandAPI(demandForm)
      
      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    ElMessage.success('需求发布成功')
    showAddDemandDialog.value = false

    // 重置表单
    Object.assign(demandForm, {
      resource_type: '',
      title: '',
      requester: '',
      location: '',
      quantity: 1,
      unit: '',
      urgency: 3,
      description: ''
    })
  } catch (error) {
    console.error('发布需求失败:', error)
    ElMessage.error('发布需求失败，请重试')
  } finally {
    demandLoading.value = false
  }
}

// 查看资源详情
const viewResourceDetail = (resource) => {
  ElMessageBox.alert(
    `
      <div style="padding: 10px;">
        <p><strong>资源名称：</strong>${resource.name}</p>
        <p><strong>资源类型：</strong>${getResourceTypeName(resource.type)}</p>
        <p><strong>所有者：</strong>${resource.owner}</p>
        <p><strong>位置：</strong>${resource.location}</p>
        <p><strong>数量：</strong>${resource.quantity} ${resource.unit}</p>
        <p><strong>状态：</strong>${resource.status === 'available' ? '可用' : '使用中'}</p>
        <p><strong>备注：</strong>${resource.remark || '无'}</p>
      </div>
    `,
    '资源详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 申请资源
const applyResource = async (resource) => {
  try {
    await ElMessageBox.confirm(
      `确定要申请使用"${resource.name}"吗？`,
      '申请资源',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    ElMessage.success('申请已提交，等待所有者确认')
  } catch (error) {
    // 用户取消
  }
}

// 查看需求详情
const viewDemandDetail = (demand) => {
  ElMessageBox.alert(
    `
      <div style="padding: 10px;">
        <p><strong>需求标题：</strong>${demand.title}</p>
        <p><strong>资源类型：</strong>${getResourceTypeName(demand.resource_type)}</p>
        <p><strong>需求方：</strong>${demand.requester}</p>
        <p><strong>位置：</strong>${demand.location}</p>
        <p><strong>需求量：</strong>${demand.quantity} ${demand.unit}</p>
        <p><strong>紧急程度：</strong>${'★'.repeat(demand.urgency)}</p>
        <p><strong>描述：</strong>${demand.description || '无'}</p>
        <p><strong>状态：</strong>${demand.matched ? '已匹配' : '待匹配'}</p>
      </div>
    `,
    '需求详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 匹配需求
const matchDemand = (demand) => {
  // 查找可用的匹配资源
  const matchedResources = resources.value.filter(r => 
    r.type === demand.resource_type && 
    r.status === 'available' &&
    r.quantity >= demand.quantity
  )

  if (matchedResources.length === 0) {
    ElMessage.warning('暂无可匹配的资源')
    return
  }

  // 设置当前需求和可用资源
  currentDemand.value = demand
  availableResources.value = matchedResources
  selectedResourceId.value = null
  showMatchDialog.value = true
}

// 确认匹配
const confirmMatch = async () => {
  if (!selectedResourceId.value) {
    ElMessage.warning('请选择一个资源')
    return
  }

  try {
    if (useMockData.value) {
      // 使用模拟数据
      currentDemand.value.matched = true
      updateStatistics()
    } else {
      // 使用真实API
      const response = await matchDemandAPI(currentDemand.value.id, selectedResourceId.value)
      
      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    // 关闭对话框
    showMatchDialog.value = false
    
    ElMessage.success('匹配成功！已通知双方')
  } catch (error) {
    console.error('匹配失败:', error)
    ElMessage.error('匹配失败，请重试')
  }
}

// 工具函数
const getResourceTypeName = (type) => {
  const map = {
    machinery: '农机',
    material: '农资',
    service: '农技服务'
  }
  return map[type] || type
}

const getResourceTypeTag = (type) => {
  const map = {
    machinery: 'primary',
    material: 'success',
    service: 'warning'
  }
  return map[type] || 'info'
}

// 监听资源筛选条件变化
watch(resourceFilter, () => {
  if (!useMockData.value) {
    loadData()
  }
})

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.resources-page {
  padding: 0;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border: none;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  border-radius: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 卡片通用样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

/* 资源列表 */
.resource-card,
.demand-card {
  margin-bottom: 20px;
}

.resource-list,
.demand-list {
  max-height: 600px;
  overflow-y: auto;
}

.resource-item,
.demand-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.resource-item:hover,
.demand-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.demand-item.matched {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-left: 4px solid #67c23a;
}

.resource-header,
.demand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.resource-title,
.demand-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-name,
.demand-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.resource-info,
.demand-info {
  margin-bottom: 12px;
}

.info-row {
  font-size: 13px;
  margin-bottom: 6px;
}

.info-row .label {
  color: #909399;
}

.info-row .value {
  color: #303133;
}

.resource-actions,
.demand-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 匹配对话框样式 */
.match-dialog-content {
  padding: 10px 0;
}

.demand-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.demand-summary h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #303133;
}

.summary-item {
  font-size: 14px;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  color: #909399;
  margin-right: 8px;
}

.summary-item .value {
  color: #303133;
  font-weight: 500;
}

.available-resources h4 {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #303133;
}

.resource-radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-radio-group :deep(.el-radio) {
  width: 100%;
  height: auto;
  margin-right: 0;
  white-space: normal;
  display: flex;
  align-items: flex-start;
}

.resource-radio-group :deep(.el-radio__input) {
  margin-top: 2px;
  flex-shrink: 0;
}

.resource-radio-group :deep(.el-radio__label) {
  width: 100%;
  padding-left: 12px;
}

.resource-radio-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.resource-radio-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.resource-radio-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.resource-radio-content {
  width: 100%;
}

.resource-radio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.resource-radio-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.resource-radio-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
  font-size: 14px;
}

.resource-radio-remark {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

/* 响应式 */
@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
  }
  
  .resource-radio-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
