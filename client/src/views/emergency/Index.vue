<template>
  <div class="emergency-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showPlanDialog = true">
        <el-icon><DocumentAdd /></el-icon>
        启动应急方案
      </el-button>
      <!-- 只有管理员可以发布区域指令 -->
      <el-button v-if="isAdmin" type="warning" @click="showCommandDialog = true">
        <el-icon><Bell /></el-icon>
        发布区域指令
      </el-button>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧：进行中的应急方案 -->
      <el-col :span="16">
        <el-card class="plan-card">
          <template #header>
            <div class="card-header">
              <h3>进行中的应急方案</h3>
              <div>
                <el-tag type="info">{{ activePlans.length }} 个方案</el-tag>
                <el-tag v-if="isFarmer" type="warning" style="margin-left: 8px;">仅显示我的方案</el-tag>
              </div>
            </div>
          </template>

          <div v-if="activePlans.length === 0" class="empty-state">
            <el-empty description="暂无进行中的应急方案" />
          </div>

          <div v-else class="plans-list">
            <div 
              v-for="plan in activePlans" 
              :key="plan.id"
              class="plan-item"
              :class="plan.disaster_type"
            >
              <div class="plan-header">
                <div class="plan-title">
                  <el-tag :type="getDisasterTypeTag(plan.disaster_type)" size="large">
                    {{ getDisasterTypeName(plan.disaster_type) }}
                  </el-tag>
                  <h4>{{ plan.plan_name }}</h4>
                </div>
                <div class="plan-status">
                  <el-progress 
                    :percentage="plan.progress" 
                    :color="getProgressColor(plan.progress)"
                  />
                </div>
              </div>

              <div class="plan-info">
                <div class="info-item">
                  <span class="label">目标区域：</span>
                  <span class="value">{{ plan.target_area }}</span>
                </div>
                <div class="info-item">
                  <span class="label">启动时间：</span>
                  <span class="value">{{ formatTime(plan.start_time) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">响应人数：</span>
                  <span class="value">{{ plan.response_count }} / {{ plan.target_count || 0 }} 人</span>
                </div>
              </div>

              <div class="plan-actions">
                <el-button size="small" @click="viewPlanDetail(plan)">查看详情</el-button>
                <el-button size="small" type="primary" @click="viewProgress(plan)">执行进度</el-button>
                <el-button size="small" type="success" @click="completePlan(plan)">完成方案</el-button>
                <el-button v-if="isAdmin" size="small" type="danger" @click="cancelPlan(plan)">取消方案</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：最新指令和反馈 -->
      <el-col :span="8">
        <!-- 最新指令 -->
        <el-card class="command-card">
          <template #header>
            <h3>最新指令</h3>
          </template>

          <div class="commands-list">
            <div 
              v-for="command in recentCommands" 
              :key="command.id"
              class="command-item"
            >
              <div class="command-header">
                <el-tag :type="command.priority === 'urgent' ? 'danger' : 'warning'" size="small">
                  {{ command.priority === 'urgent' ? '紧急' : '重要' }}
                </el-tag>
                <span class="command-time">{{ formatTime(command.created_at) }}</span>
              </div>
              <div class="command-content">{{ command.command_content }}</div>
              <div class="command-region">
                <el-icon><Location /></el-icon>
                {{ command.target_area }}
              </div>
            </div>
          </div>
        </el-card>

        <!-- 执行反馈 -->
        <el-card class="feedback-card">
          <template #header>
            <h3>执行反馈</h3>
          </template>

          <div class="feedback-list">
            <div 
              v-for="feedback in recentFeedback" 
              :key="feedback.id"
              class="feedback-item"
            >
              <div class="feedback-header">
                <span class="user-name">{{ feedback.executor }}</span>
                <el-tag :type="getFeedbackStatusTag(feedback.status)" size="small">
                  {{ getFeedbackStatusText(feedback.status) }}
                </el-tag>
              </div>
              <div class="feedback-content">{{ feedback.feedback_content }}</div>
              <div class="feedback-time">{{ formatTime(feedback.created_at) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 启动应急方案对话框 -->
    <el-dialog
      v-model="showPlanDialog"
      title="启动应急方案"
      width="600px"
    >
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="灾害类型">
          <el-select v-model="planForm.disaster_type" placeholder="选择灾害类型">
            <el-option label="干旱" value="drought" />
            <el-option label="洪涝" value="flood" />
            <el-option label="冻害" value="freeze" />
            <el-option label="高温" value="heat" />
            <el-option label="大风" value="wind" />
            <el-option label="病虫害" value="pest" />
          </el-select>
        </el-form-item>

        <el-form-item label="方案名称">
          <el-input v-model="planForm.plan_name" placeholder="输入方案名称" />
        </el-form-item>

        <el-form-item label="目标区域">
          <el-cascader
            v-model="planForm.target_area_array"
            :options="regionOptions"
            placeholder="请选择目标区域"
            style="width: 100%"
            clearable
            :props="{ expandTrigger: 'hover' }"
          />
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="planForm.priority">
            <el-radio label="urgent">紧急</el-radio>
            <el-radio label="important">重要</el-radio>
            <el-radio label="normal">普通</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="方案描述">
          <el-input 
            v-model="planForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="输入方案描述和应急措施"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPlanDialog = false">取消</el-button>
        <el-button type="primary" @click="startPlan" :loading="planLoading">
          启动方案
        </el-button>
      </template>
    </el-dialog>

    <!-- 发布区域指令对话框 -->
    <el-dialog
      v-model="showCommandDialog"
      title="发布区域指令"
      width="600px"
    >
      <el-form :model="commandForm" label-width="100px">
        <el-form-item label="目标区域">
          <el-cascader
            v-model="commandForm.target_area_array"
            :options="regionOptions"
            placeholder="请选择目标区域"
            style="width: 100%"
            clearable
            :props="{ expandTrigger: 'hover' }"
          />
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="commandForm.priority">
            <el-radio label="urgent">紧急</el-radio>
            <el-radio label="important">重要</el-radio>
            <el-radio label="normal">普通</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="指令内容">
          <el-input 
            v-model="commandForm.command_content" 
            type="textarea" 
            :rows="5"
            placeholder="输入指令内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCommandDialog = false">取消</el-button>
        <el-button type="primary" @click="publishCommand" :loading="commandLoading">
          发布指令
        </el-button>
      </template>
    </el-dialog>

    <!-- 执行进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      :title="`${selectedPlan?.plan_name} - 执行进度`"
      width="800px"
    >
      <div v-if="selectedPlan" class="progress-detail">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in progressList"
            :key="index"
            :timestamp="formatTime(item.time)"
            :type="item.type"
          >
            <div class="timeline-content">
              <div class="timeline-user">{{ item.executor }}</div>
              <div class="timeline-action">{{ item.action }}</div>
              <div v-if="item.remark" class="timeline-remark">{{ item.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- 取消方案对话框 -->
    <el-dialog
      v-model="showCancelDialog"
      title="取消应急方案"
      width="500px"
    >
      <el-alert
        title="取消后将通知目标区域的所有农户"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <el-form label-width="100px">
        <el-form-item label="方案名称">
          <span>{{ cancelForm.plan?.plan_name }}</span>
        </el-form-item>
        <el-form-item label="目标区域">
          <span>{{ cancelForm.plan?.target_area }}</span>
        </el-form-item>
        <el-form-item label="取消原因" required>
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入取消原因（将通知给农户）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCancelDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmCancelPlan" :loading="planLoading">
          确认取消方案
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentAdd,
  Bell,
  Location
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { regions } from '@/utils/regions'
import {
  getEmergencyPlans,
  startEmergencyPlan,
  getCommands,
  publishCommand as publishCommandAPI,
  getFeedbacks,
  cancelEmergencyPlan
} from '@/api/emergency'

// 用户信息
const userStore = useUserStore()

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
const isAdmin = computed(() => userStore.user?.user_type === 'admin')
const isFarmer = computed(() => userStore.user?.user_type === 'farmer')

// 响应式数据
const showPlanDialog = ref(false)
const showCommandDialog = ref(false)
const showProgressDialog = ref(false)
const showCancelDialog = ref(false)
const planLoading = ref(false)
const commandLoading = ref(false)
const activePlans = ref([])
const recentCommands = ref([])
const recentFeedback = ref([])
const selectedPlan = ref(null)
const progressList = ref([])
const useMockData = ref(false) // 标记是否使用模拟数据

// 表单数据
const planForm = reactive({
  disaster_type: '',
  plan_name: '',
  target_area: '',
  target_area_array: [],
  priority: 'important',
  description: ''
})

const commandForm = reactive({
  target_area: '',
  target_area_array: [],
  priority: 'important',
  command_content: ''
})

const cancelForm = reactive({
  plan: null,
  reason: ''
})

// 模拟数据
const initMockData = () => {
  // 模拟进行中的应急方案
  activePlans.value = [
    {
      id: 1,
      disaster_type: 'flood',
      plan_name: '洪涝灾害应急响应方案',
      target_area: '江苏省南京市、苏州市',
      priority: 'urgent',
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      progress: 65,
      response_count: 13,
      target_count: 20
    },
    {
      id: 2,
      disaster_type: 'drought',
      plan_name: '干旱灾害应急灌溉方案',
      target_area: '河北省石家庄市',
      priority: 'important',
      start_time: new Date(Date.now() - 5 * 60 * 60 * 1000),
      progress: 40,
      response_count: 8,
      target_count: 15
    }
  ]

  // 模拟最新指令
  recentCommands.value = [
    {
      id: 1,
      priority: 'urgent',
      command_content: '立即组织排水设备，清理田间积水，防止作物根系腐烂',
      target_area: '南京市江宁区',
      created_at: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 2,
      priority: 'important',
      command_content: '启动应急灌溉系统，优先保障小麦生长关键期用水',
      target_area: '石家庄市藁城区',
      created_at: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      id: 3,
      priority: 'important',
      command_content: '加强田间巡查，及时上报作物受灾情况',
      target_area: '苏州市吴中区',
      created_at: new Date(Date.now() - 90 * 60 * 1000)
    }
  ]

  // 模拟执行反馈
  recentFeedback.value = [
    {
      id: 1,
      executor: '张三',
      status: 'completed',
      feedback_content: '已完成排水沟清理，田间积水基本排除',
      created_at: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: 2,
      executor: '李四',
      status: 'in_progress',
      feedback_content: '正在组织灌溉设备，预计1小时内完成',
      created_at: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      id: 3,
      executor: '王五',
      status: 'pending',
      feedback_content: '收到指令，准备开始执行',
      created_at: new Date(Date.now() - 40 * 60 * 1000)
    }
  ]
}

// 加载数据（优先使用API，失败则使用模拟数据）
const loadData = async () => {
  try {
    // 尝试从API加载数据
    const [plansRes, commandsRes, feedbacksRes] = await Promise.all([
      getEmergencyPlans(),
      getCommands(),
      getFeedbacks()
    ])
    
    activePlans.value = plansRes.data || []
    recentCommands.value = commandsRes.data || []
    recentFeedback.value = feedbacksRes.data || []
    useMockData.value = false
  } catch (error) {
    console.warn('API加载失败，使用模拟数据:', error)
    initMockData()
    useMockData.value = true
  }
}

// 启动应急方案
const startPlan = async () => {
  if (!planForm.disaster_type || !planForm.plan_name || planForm.target_area_array.length === 0) {
    ElMessage.warning('请填写完整信息')
    return
  }

  // 将 target_area_array 转换为字符串
  const target_area = planForm.target_area_array.length === 2
    ? `${planForm.target_area_array[0]}${planForm.target_area_array[1]}`
    : ''

  planLoading.value = true
  
  try {
    const submitData = {
      disaster_type: planForm.disaster_type,
      plan_name: planForm.plan_name,
      target_area: target_area,
      priority: planForm.priority,
      description: planForm.description
    }

    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newPlan = {
        id: Date.now(),
        ...submitData,
        affected_region: target_area, // 兼容显示
        start_time: new Date(),
        progress: 0,
        response_count: 0,
        target_count: 10
      }
      activePlans.value.unshift(newPlan)
    } else {
      // API模式
      await startEmergencyPlan(submitData)
      await loadData() // 重新加载数据
    }
    
    ElMessage.success(`应急方案已启动，将通知 ${target_area} 的农户`)
    showPlanDialog.value = false
    
    // 重置表单
    Object.assign(planForm, {
      disaster_type: '',
      plan_name: '',
      target_area: '',
      target_area_array: [],
      priority: 'important',
      description: ''
    })
  } catch (error) {
    console.error('启动方案失败:', error)
    ElMessage.error('启动方案失败')
  } finally {
    planLoading.value = false
  }
}

// 发布区域指令
const publishCommand = async () => {
  if (commandForm.target_area_array.length === 0 || !commandForm.command_content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  // 将 target_area_array 转换为字符串
  const target_area = commandForm.target_area_array.length === 2
    ? `${commandForm.target_area_array[0]}${commandForm.target_area_array[1]}`
    : ''

  commandLoading.value = true
  
  try {
    const submitData = {
      target_area: target_area,
      priority: commandForm.priority,
      command_content: commandForm.command_content
    }

    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newCommand = {
        id: Date.now(),
        ...submitData,
        created_at: new Date()
      }
      recentCommands.value.unshift(newCommand)
    } else {
      // API模式
      await publishCommandAPI(submitData)
      await loadData() // 重新加载数据
    }
    
    ElMessage.success(`指令已发布，将通知 ${target_area} 的农户`)
    showCommandDialog.value = false
    
    // 重置表单
    Object.assign(commandForm, {
      target_area: '',
      target_area_array: [],
      priority: 'important',
      command_content: ''
    })
  } catch (error) {
    console.error('发布指令失败:', error)
    ElMessage.error('发布指令失败')
  } finally {
    commandLoading.value = false
  }
}

// 查看方案详情
const viewPlanDetail = (plan) => {
  ElMessageBox.alert(
    `
      <div style="padding: 10px;">
        <p><strong>方案名称：</strong>${plan.plan_name}</p>
        <p><strong>灾害类型：</strong>${getDisasterTypeName(plan.disaster_type)}</p>
        <p><strong>目标区域：</strong>${plan.target_area}</p>
        <p><strong>启动时间：</strong>${formatTime(plan.start_time)}</p>
        <p><strong>执行进度：</strong>${plan.progress}%</p>
        <p><strong>响应情况：</strong>${plan.response_count}/${plan.target_count || 0} 人</p>
      </div>
    `,
    '方案详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 查看执行进度
const viewProgress = (plan) => {
  selectedPlan.value = plan
  
  // 模拟进度数据
  progressList.value = [
    {
      executor: '张三',
      action: '已确认收到指令',
      time: new Date(Date.now() - 120 * 60 * 1000),
      type: 'success'
    },
    {
      executor: '张三',
      action: '开始执行应急措施',
      time: new Date(Date.now() - 100 * 60 * 1000),
      type: 'primary'
    },
    {
      executor: '李四',
      action: '已确认收到指令',
      time: new Date(Date.now() - 90 * 60 * 1000),
      type: 'success'
    },
    {
      executor: '张三',
      action: '完成排水沟清理',
      remark: '田间积水已基本排除',
      time: new Date(Date.now() - 60 * 60 * 1000),
      type: 'success'
    },
    {
      executor: '李四',
      action: '正在组织灌溉设备',
      remark: '预计1小时内完成',
      time: new Date(Date.now() - 30 * 60 * 1000),
      type: 'primary'
    }
  ]
  
  showProgressDialog.value = true
}

// 完成方案
const completePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成"${plan.plan_name}"吗？`,
      '确认完成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    const index = activePlans.value.findIndex(p => p.id === plan.id)
    if (index > -1) {
      activePlans.value.splice(index, 1)
      ElMessage.success('方案已完成')
    }
  } catch (error) {
    // 用户取消
  }
}

// 取消方案
const cancelPlan = (plan) => {
  cancelForm.plan = plan
  cancelForm.reason = ''
  showCancelDialog.value = true
}

// 确认取消方案
const confirmCancelPlan = async () => {
  if (!cancelForm.reason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }

  planLoading.value = true
  
  try {
    const response = await cancelEmergencyPlan(cancelForm.plan.id, {
      reason: cancelForm.reason
    })

    if (response.code === 200) {
      ElMessage.success(`方案已取消，已通知 ${response.data.notified_count || 0} 位农户`)
      showCancelDialog.value = false
      
      // 从列表中移除
      const index = activePlans.value.findIndex(p => p.id === cancelForm.plan.id)
      if (index > -1) {
        activePlans.value.splice(index, 1)
      }
      
      // 重新加载数据
      await loadData()
    } else {
      ElMessage.error(response.message || '取消失败')
    }
  } catch (error) {
    console.error('取消方案失败:', error)
    ElMessage.error('取消方案失败')
  } finally {
    planLoading.value = false
  }
}

// 工具函数
const getDisasterTypeName = (type) => {
  const map = {
    drought: '干旱',
    flood: '洪涝',
    freeze: '冻害',
    heat: '高温',
    wind: '大风',
    pest: '病虫害'
  }
  return map[type] || type
}

const getDisasterTypeTag = (type) => {
  const map = {
    drought: 'warning',
    flood: 'danger',
    freeze: 'info',
    heat: 'danger',
    wind: 'warning',
    pest: 'success'
  }
  return map[type] || 'info'
}

const getProgressColor = (progress) => {
  if (progress < 30) return '#f56c6c'
  if (progress < 70) return '#e6a23c'
  return '#67c23a'
}

const getFeedbackStatusTag = (status) => {
  const map = {
    completed: 'success',
    in_progress: 'primary',
    pending: 'info'
  }
  return map[status] || 'info'
}

const getFeedbackStatusText = (status) => {
  const map = {
    completed: '已完成',
    in_progress: '进行中',
    pending: '待执行'
  }
  return map[status] || status
}

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

// 初始化
onMounted(() => {
  loadData()
})

// 监听刷新标记，自动刷新数据
watch(() => userStore.emergencyRefreshFlag, () => {
  console.log('检测到应急响应更新，自动刷新数据')
  loadData()
})
</script>

<style scoped>
.emergency-page {
  padding: 0;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
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

/* 应急方案列表 */
.plan-card {
  margin-bottom: 20px;
}

.empty-state {
  padding: 40px 0;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-item {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.plan-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-item.flood {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
}

.plan-item.drought {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
}

.plan-item.freeze {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-title h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.plan-status {
  width: 200px;
}

.plan-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  font-size: 13px;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.plan-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 指令列表 */
.command-card {
  margin-bottom: 20px;
}

.commands-list {
  max-height: 300px;
  overflow-y: auto;
}

.command-item {
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
  margin-bottom: 12px;
}

.command-item:last-child {
  margin-bottom: 0;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.command-time {
  font-size: 12px;
  color: #909399;
}

.command-content {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.6;
}

.command-region {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

/* 反馈列表 */
.feedback-card {
  margin-bottom: 20px;
}

.feedback-list {
  max-height: 300px;
  overflow-y: auto;
}

.feedback-item {
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
  margin-bottom: 12px;
}

.feedback-item:last-child {
  margin-bottom: 0;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.feedback-content {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  line-height: 1.5;
}

.feedback-time {
  font-size: 12px;
  color: #909399;
}

/* 进度详情 */
.progress-detail {
  padding: 20px 0;
}

.timeline-content {
  padding: 8px 0;
}

.timeline-user {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-action {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.timeline-remark {
  font-size: 13px;
  color: #909399;
  font-style: italic;
}

/* 响应式 */
@media (max-width: 768px) {
  .plan-info {
    grid-template-columns: 1fr;
  }
  
  .plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .plan-status {
    width: 100%;
  }
}
</style>
