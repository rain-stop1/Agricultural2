<template>
  <div class="emergency-page">
    <!-- 顶部操作栏 -->
  <div class="action-bar">
    <!-- 预案管理 -->
    <el-button type="primary" @click="showTemplateDialog = true">
      <el-icon><DocumentAdd /></el-icon>
      配置预案
    </el-button>
    <!-- 激活预案 -->
    <el-button type="success" @click="showActivateDialog = true">
      <el-icon><Check /></el-icon>
      激活预案
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
                <el-button v-if="isAdmin" size="small" type="warning" @click="openCommandDialog(plan)">发布区域指令</el-button>
                <el-button size="small" @click="toggleCommands(plan)">
                  <el-icon v-if="plan.expanded"><ArrowUp /></el-icon>
                  <el-icon v-else><ArrowDown /></el-icon>
                  {{ plan.expanded ? '收起指令' : '查看指令' }}
                </el-button>
                <el-button size="small" type="success" @click="completePlan(plan)">完成方案</el-button>
                <el-button v-if="isAdmin" size="small" type="danger" @click="cancelPlan(plan)">取消方案</el-button>
              </div>

              <!-- 区域指令列表（展开/收缩） -->
              <div v-if="plan.expanded" class="commands-list">
                <h4 style="margin: 16px 0 10px 0; font-size: 14px; font-weight: 600;">区域指令</h4>
                <div v-if="plan.commands && plan.commands.length > 0" class="commands-container">
                  <div 
                    v-for="command in plan.commands" 
                    :key="command.id"
                    class="command-item"
                  >
                    <div class="command-header">
                      <div class="command-tags">
                        <el-tag :type="command.priority === 'urgent' ? 'danger' : 'warning'" size="small">
                          {{ command.priority === 'urgent' ? '紧急' : '重要' }}
                        </el-tag>
                        <el-tag v-if="command.status === 'completed'" type="success" size="small">
                          已完成
                        </el-tag>
                      </div>
                      <div class="command-info">
                        <span class="command-time">{{ formatTime(command.created_at) }}</span>
                        <span class="command-response">
                          响应: {{ command.completed_count || 0 }}/{{ command.target_count || 0 }}
                        </span>
                      </div>
                    </div>
                    <div class="command-content">{{ command.command_content }}</div>
                    <div class="command-region-actions">
                      <div class="command-region">
                        <el-icon><Location /></el-icon>
                        {{ command.target_area }}
                      </div>
                      <div class="command-actions">
                        <el-tag v-if="isFarmer && hasCompletedCommand(command.id)" type="success" size="small">
                          已完成
                        </el-tag>
                        <el-button v-else-if="isFarmer && command.status !== 'completed'" size="small" type="primary" @click="completeCommand(command)">
                          完成指令
                        </el-button>
                        <el-button v-if="isAdmin" size="small" type="info" @click="viewCommandFeedback(command)">
                          <el-icon><View /></el-icon>
                          查看反馈
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-commands">
                  <el-empty description="暂无区域指令" :image-size="60" />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：执行反馈 -->
      <el-col :span="8">
        <!-- 执行反馈 -->
        <el-card class="feedback-card">
          <template #header>
            <div class="card-header">
              <h3>执行反馈</h3>
              <div>
                <el-button v-if="isAdmin" type="info" size="small" @click="loadData">
                  <el-icon><Refresh /></el-icon>
                  刷新反馈
                </el-button>
                <el-button v-if="isFarmer" type="primary" size="small" @click="showFeedbackDialog = true" style="margin-left: 8px;">
                  <el-icon><Edit /></el-icon>
                  提交反馈
                </el-button>
              </div>
            </div>
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
              <div v-if="feedback.attachment_url" class="feedback-image">
                <el-image
                  :src="feedback.attachment_url"
                  fit="cover"
                  :preview-src-list="[feedback.attachment_url]"
                  style="width: 100px; height: 100px;"
                />
              </div>
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

    <!-- 配置预案对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="配置预案"
      width="600px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="灾害类型">
          <el-select v-model="templateForm.disaster_type" placeholder="选择灾害类型">
            <el-option label="干旱" value="drought" />
            <el-option label="洪涝" value="flood" />
            <el-option label="冻害" value="freeze" />
            <el-option label="高温" value="heat" />
            <el-option label="大风" value="wind" />
            <el-option label="病虫害" value="pest" />
          </el-select>
        </el-form-item>

        <el-form-item label="预案名称">
          <el-input v-model="templateForm.plan_name" placeholder="输入预案名称" />
        </el-form-item>



        <el-form-item label="优先级">
          <el-radio-group v-model="templateForm.priority">
            <el-radio label="urgent">紧急</el-radio>
            <el-radio label="important">重要</el-radio>
            <el-radio label="normal">普通</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="预案描述">
          <el-input 
            v-model="templateForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="输入预案描述和应急措施"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTemplate" :loading="templateLoading">
          保存预案
        </el-button>
      </template>
    </el-dialog>

    <!-- 激活预案对话框 -->
    <el-dialog
      v-model="showActivateDialog"
      title="激活预案"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择预案">
          <el-select v-model="activateForm.plan_id" placeholder="选择要激活的预案">
            <el-option 
              v-for="plan in templates" 
              :key="plan.id" 
              :label="plan.plan_name" 
              :value="plan.id"
            >
              <div class="option-content">
                <div>{{ plan.plan_name }}</div>
                <div class="option-desc">{{ getDisasterTypeName(plan.disaster_type) }} - {{ plan.target_area }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="目标区域">
          <el-cascader
            v-model="activateForm.target_area_array"
            :options="regionOptions"
            placeholder="请选择地区"
            style="width: 100%"
            clearable
            :props="{ expandTrigger: 'hover' }"
          />
        </el-form-item>
        <el-form-item label="详细区域">
          <el-input v-model="activateForm.target_area_detail" placeholder="输入详细区域信息（如乡镇、村庄等）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showActivateDialog = false">取消</el-button>
        <el-button type="primary" @click="activatePlan" :loading="activateLoading">
          激活预案
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
        <el-form-item label="应急方案">
          <el-select v-model="commandForm.plan_id" placeholder="选择应急方案">
            <el-option 
              v-for="plan in activePlans" 
              :key="plan.id" 
              :label="plan.plan_name" 
              :value="plan.id"
            >
              <div class="option-content">
                <div>{{ plan.plan_name }}</div>
                <div class="option-desc">{{ getDisasterTypeName(plan.disaster_type) }} - {{ plan.target_area }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="目标区域">
          <el-cascader
            v-model="commandForm.target_area_array"
            :options="regionOptions"
            placeholder="请选择地区"
            style="width: 100%"
            clearable
            :props="{ expandTrigger: 'hover' }"
          />
        </el-form-item>
        <el-form-item label="详细区域">
          <el-input v-model="commandForm.target_area_detail" placeholder="输入详细区域信息（如乡镇、村庄等）" />
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

    <!-- 提交反馈对话框 -->
    <el-dialog
      v-model="showFeedbackDialog"
      title="提交执行反馈"
      width="600px"
    >
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="指令选择" required>
          <el-select v-model="feedbackForm.command_id" placeholder="选择要反馈的指令">
            <el-option 
              v-for="command in recentCommands" 
              :key="command.id" 
              :label="command.command_content" 
              :value="command.id"
            >
              <div class="option-content">
                <div>{{ command.command_content }}</div>
                <div class="option-desc">{{ command.target_area }} - {{ formatTime(command.created_at) }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="执行状态" required>
          <el-radio-group v-model="feedbackForm.status">
            <el-radio label="completed">已完成</el-radio>
            <el-radio label="in_progress">进行中</el-radio>
            <el-radio label="pending">待执行</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="反馈内容" required>
          <el-input 
            v-model="feedbackForm.feedback_content" 
            type="textarea" 
            :rows="5"
            placeholder="请描述执行情况和结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传凭证">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="feedbackForm.files"
            :limit="1"
            :on-exceed="handleExceed"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            list-type="picture"
            :preview-src-list="feedbackForm.files.map(file => file.url)"
          >
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              点击上传
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传现场处理完毕的照片作为凭证（支持 JPG、PNG 格式，最大 5MB）
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFeedbackDialog = false">取消</el-button>
        <el-button type="primary" @click="submitFeedbackForm" :loading="feedbackLoading">
          提交反馈
        </el-button>
      </template>
    </el-dialog>

    <!-- 完成指令对话框 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="完成指令"
      width="600px"
    >
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="指令内容">
          <el-input v-model="completeForm.command_content" readonly />
        </el-form-item>

        <el-form-item label="目标区域">
          <el-input v-model="completeForm.target_area" readonly />
        </el-form-item>

        <el-form-item label="完成描述" required>
          <el-input 
            v-model="completeForm.feedback_content" 
            type="textarea" 
            :rows="5"
            placeholder="请描述执行情况和结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传凭证">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleCompleteFileChange"
            :file-list="completeForm.files"
            :limit="1"
            :on-exceed="handleExceed"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            list-type="picture"
            :preview-src-list="completeForm.files.map(file => file.url)"
          >
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              点击上传
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传现场处理完毕的照片作为凭证（支持 JPG、PNG 格式，最大 5MB）
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCompleteForm" :loading="completeLoading">
          提交完成
        </el-button>
      </template>
    </el-dialog>

    <!-- 反馈详情对话框 -->
    <el-dialog
      v-model="showFeedbackDetailDialog"
      :title="`${selectedCommand?.command_content} - 反馈详情`"
      width="800px"
    >
      <div v-if="commandFeedbacks.length > 0" class="feedback-detail-list">
        <div 
          v-for="feedback in commandFeedbacks" 
          :key="feedback.id"
          class="feedback-detail-item"
        >
          <div class="feedback-detail-header">
            <div class="feedback-detail-user">
              <span class="user-name">{{ feedback.executor }}</span>
              <el-tag :type="getFeedbackStatusTag(feedback.status)" size="small" style="margin-left: 8px;">
                {{ getFeedbackStatusText(feedback.status) }}
              </el-tag>
            </div>
            <div class="feedback-detail-time">{{ formatTime(feedback.created_at) }}</div>
          </div>
          <div class="feedback-detail-content">{{ feedback.feedback_content }}</div>
          <div v-if="feedback.attachment_url" class="feedback-detail-image">
            <el-image
              :src="feedback.attachment_url"
              fit="cover"
              :preview-src-list="[feedback.attachment_url]"
              style="width: 200px; height: 200px;"
            />
          </div>
          <el-divider v-if="!$last" />
        </div>
      </div>
      <div v-else class="empty-feedback">
        <el-empty description="暂无反馈信息" />
      </div>

      <template #footer>
        <el-button @click="showFeedbackDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentAdd,
  Bell,
  Location,
  ArrowUp,
  ArrowDown,
  View
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { regions } from '@/utils/regions'
import request from '@/api/request'
import {
  getEmergencyPlans,
  startEmergencyPlan,
  createEmergencyTemplate,
  activateEmergencyPlan,
  getCommands,
  publishCommand as publishCommandAPI,
  getFeedbacks,
  submitFeedback as submitFeedbackAPI,
  cancelEmergencyPlan,
  completeEmergencyPlan
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
const showTemplateDialog = ref(false)
const showActivateDialog = ref(false)
const showCommandDialog = ref(false)
const showProgressDialog = ref(false)
const showCancelDialog = ref(false)
const showFeedbackDialog = ref(false)
const showCompleteDialog = ref(false)
const showFeedbackDetailDialog = ref(false)
const planLoading = ref(false)
const templateLoading = ref(false)
const activateLoading = ref(false)
const commandLoading = ref(false)
const feedbackLoading = ref(false)
const completeLoading = ref(false)
const activePlans = ref([])
const templates = ref([])
const recentCommands = ref([])
const recentFeedback = ref([])
const selectedPlan = ref(null)
const selectedCommand = ref(null)
const commandFeedbacks = ref([])
const progressList = ref([])
const useMockData = ref(false) // 标记是否使用模拟数据

// 检查用户是否已完成指令
const hasCompletedCommand = (commandId) => {
  const userId = userStore.user?.id
  if (!userId) return false
  
  // 检查recentFeedback中是否有该用户对该指令的反馈
  return recentFeedback.value.some(feedback => 
    feedback.command_id === commandId && 
    feedback.user_id === userId &&
    feedback.status === 'completed'
  )
}

// 表单数据
const templateForm = reactive({
  disaster_type: '',
  plan_name: '',
  target_area: '',
  target_area_array: [],
  priority: 'important',
  description: ''
})

const activateForm = reactive({
  plan_id: '',
  target_area_array: [],
  target_area_detail: '',
  target_area: ''
})

const commandForm = reactive({
  plan_id: '',
  target_area: '',
  target_area_array: [],
  target_area_detail: '',
  priority: 'important',
  command_content: ''
})

// 监听应急方案选择变化，自动更新目标区域
watch(() => commandForm.plan_id, (newPlanId) => {
  if (newPlanId) {
    const selectedPlan = activePlans.value.find(plan => plan.id === newPlanId)
    if (selectedPlan) {
      // 自动设置目标区域为应急方案的目标区域
      commandForm.target_area = selectedPlan.target_area
      
      // 尝试解析目标区域为数组格式
      // 优先处理单个区域的情况，例如："北京市昌平区" -> ["北京市", "昌平区"]
      const regionMatch = selectedPlan.target_area.match(/^(\S+[省市自治区])([^、，,]+)$/)
      if (regionMatch && regionMatch.length === 3) {
        const province = regionMatch[1]
        const city = regionMatch[2].trim()
        
        // 验证解析出的省和市是否在regions数据中
        const provinceObj = regions.find(r => r.province === province)
        if (provinceObj && provinceObj.cities.includes(city)) {
          commandForm.target_area_array = [province, city]
        } else {
          // 如果解析失败，保持空数组
          commandForm.target_area_array = []
        }
      } else {
        commandForm.target_area_array = []
      }
    }
  }
})

const cancelForm = reactive({
  plan: null,
  reason: ''
})

const feedbackForm = reactive({
  command_id: '',
  status: 'completed',
  feedback_content: '',
  files: [],
  attachment_url: ''
})

const completeForm = reactive({
  command_id: '',
  command_content: '',
  target_area: '',
  feedback_content: '',
  files: [],
  attachment_url: ''
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
      command_id: 1,
      user_id: 1,
      executor: '张三',
      status: 'completed',
      feedback_content: '已完成排水沟清理，田间积水基本排除',
      created_at: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: 2,
      command_id: 2,
      user_id: 2,
      executor: '李四',
      status: 'in_progress',
      feedback_content: '正在组织灌溉设备，预计1小时内完成',
      created_at: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      id: 3,
      command_id: 3,
      user_id: 3,
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
    const [plansRes, templatesRes, commandsRes, feedbacksRes] = await Promise.all([
      getEmergencyPlans({ planType: 'active' }),
      getEmergencyPlans({ planType: 'plan' }),
      getCommands(),
      getFeedbacks()
    ])
    
    // 保存当前展开的方案ID
    const expandedPlanIds = activePlans.value
      .filter(plan => plan.expanded)
      .map(plan => plan.id)
    
    activePlans.value = plansRes.data || []
    templates.value = templatesRes.data || []
    recentCommands.value = commandsRes.data || []
    recentFeedback.value = feedbacksRes.data || []
    useMockData.value = false
    
    // 重新加载展开的方案的指令列表
    for (const plan of activePlans.value) {
      if (expandedPlanIds.includes(plan.id)) {
        plan.expanded = true
        try {
          const commandsRes = await getCommands({ plan_id: plan.id })
          plan.commands = commandsRes.data || []
        } catch (error) {
          console.error('获取方案指令失败:', error)
          plan.commands = []
        }
      }
    }
  } catch (error) {
    console.warn('API加载失败，使用模拟数据:', error)
    initMockData()
    useMockData.value = true
  }
}

// 创建预案
const createTemplate = async () => {
  if (!templateForm.disaster_type || !templateForm.plan_name) {
    ElMessage.warning('请填写完整信息')
    return
  }

  templateLoading.value = true
  
  try {
    const submitData = {
      disaster_type: templateForm.disaster_type,
      plan_name: templateForm.plan_name,
      priority: templateForm.priority,
      description: templateForm.description
    }

    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newTemplate = {
        id: Date.now(),
        ...submitData,
        plan_type: 'plan',
        status: 'active',
        progress: 0,
        created_at: new Date()
      }
      templates.value.unshift(newTemplate)
    } else {
      // API模式
      await createEmergencyTemplate(submitData)
      await loadData() // 重新加载数据
    }
    
    ElMessage.success('预案创建成功')
    showTemplateDialog.value = false
    
    // 重置表单
    Object.assign(templateForm, {
      disaster_type: '',
      plan_name: '',
      priority: 'important',
      description: ''
    })
  } catch (error) {
    console.error('创建预案失败:', error)
    ElMessage.error('创建预案失败')
  } finally {
    templateLoading.value = false
  }
}

// 激活预案
const activatePlan = async () => {
  if (!activateForm.plan_id || activateForm.target_area_array.length === 0) {
    ElMessage.warning('请选择要激活的预案和目标区域')
    return
  }

  // 组合目标区域
  let target_area = ''
  if (activateForm.target_area_array.length === 2) {
    target_area = activateForm.target_area_array.join('')
    if (activateForm.target_area_detail) {
      target_area += activateForm.target_area_detail
    }
  }

  activateLoading.value = true
  
  try {
    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const template = templates.value.find(t => t.id === activateForm.plan_id)
      if (template) {
        const newPlan = {
          id: Date.now(),
          disaster_type: template.disaster_type,
          plan_name: template.plan_name,
          target_area: target_area,
          priority: template.priority,
          description: template.description,
          plan_type: 'active',
          status: 'active',
          progress: 0,
          response_count: 0,
          target_count: 10,
          start_time: new Date(),
          created_at: new Date()
        }
        activePlans.value.unshift(newPlan)
      }
    } else {
      // API模式
      await activateEmergencyPlan(activateForm.plan_id, target_area)
      await loadData() // 重新加载数据
    }
    
    ElMessage.success('预案激活成功')
    showActivateDialog.value = false
    
    // 重置表单
    Object.assign(activateForm, {
      plan_id: '',
      target_area_array: [],
      target_area_detail: '',
      target_area: ''
    })
  } catch (error) {
    console.error('激活预案失败:', error)
    ElMessage.error('激活预案失败')
  } finally {
    activateLoading.value = false
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
  if (!commandForm.plan_id || commandForm.target_area_array.length === 0 || !commandForm.command_content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  // 组合目标区域
  let target_area = ''
  if (commandForm.target_area_array.length === 2) {
    target_area = commandForm.target_area_array.join('')
    if (commandForm.target_area_detail) {
      target_area += commandForm.target_area_detail
    }
  }

  commandLoading.value = true
  
  try {
    const submitData = {
      plan_id: commandForm.plan_id,
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
      plan_id: '',
      target_area: '',
      target_area_array: [],
      target_area_detail: '',
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
const viewPlanDetail = async (plan) => {
  try {
    // 获取该方案下的所有指令
    const commandsRes = await getCommands({ plan_id: plan.id })
    const planCommands = commandsRes.data || []
    
    // 构建指令列表HTML
    let commandsHtml = ''
    if (planCommands.length > 0) {
      commandsHtml = `
        <h4 style="margin-top: 20px; margin-bottom: 10px;">区域指令</h4>
        <div style="border: 1px solid #e4e7ed; border-radius: 4px; padding: 10px;">
          ${planCommands.map(cmd => `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;">
              <p><strong>指令内容：</strong>${cmd.command_content}</p>
              <p><strong>目标区域：</strong>${cmd.target_area}</p>
              <p><strong>优先级：</strong>${cmd.priority === 'urgent' ? '紧急' : cmd.priority === 'important' ? '重要' : '普通'}</p>
              <p><strong>发布时间：</strong>${formatTime(cmd.created_at)}</p>
            </div>
          `).join('')}
        </div>
      `
    }
    
    ElMessageBox.alert(
      `
        <div style="padding: 10px;">
          <p><strong>方案名称：</strong>${plan.plan_name}</p>
          <p><strong>灾害类型：</strong>${getDisasterTypeName(plan.disaster_type)}</p>
          <p><strong>目标区域：</strong>${plan.target_area}</p>
          <p><strong>方案描述：</strong>${plan.description || '无'}</p>
          <p><strong>启动时间：</strong>${formatTime(plan.start_time)}</p>
          <p><strong>执行进度：</strong>${plan.progress}%</p>
          <p><strong>响应情况：</strong>${plan.response_count}/${plan.target_count || 0} 人</p>
          ${commandsHtml}
        </div>
      `,
      '方案详情',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        customClass: 'plan-detail-dialog'
      }
    )
  } catch (error) {
    console.error('获取方案指令失败:', error)
    // 出错时显示基本信息
    ElMessageBox.alert(
      `
        <div style="padding: 10px;">
          <p><strong>方案名称：</strong>${plan.plan_name}</p>
          <p><strong>灾害类型：</strong>${getDisasterTypeName(plan.disaster_type)}</p>
          <p><strong>目标区域：</strong>${plan.target_area}</p>
          <p><strong>方案描述：</strong>${plan.description || '无'}</p>
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
    
    planLoading.value = true
    
    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const index = activePlans.value.findIndex(p => p.id === plan.id)
      if (index > -1) {
        activePlans.value.splice(index, 1)
        ElMessage.success('方案已完成')
      }
    } else {
      // API模式
      const response = await completeEmergencyPlan(plan.id, {})
      if (response.code === 200) {
        ElMessage.success(`方案已完成，已通知 ${response.data.notified_count || 0} 位农户`)
        await loadData() // 重新加载数据
      } else {
        ElMessage.error(response.message || '完成失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('完成方案失败:', error)
      ElMessage.error('完成方案失败')
    }
  } finally {
    planLoading.value = false
  }
}

// 取消方案
const cancelPlan = (plan) => {
  cancelForm.plan = plan
  cancelForm.reason = ''
  showCancelDialog.value = true
}

// 打开发布指令对话框
const openCommandDialog = (plan) => {
  if (plan) {
    // 设置为当前点击的应急方案
    commandForm.plan_id = plan.id
    
    // 自动设置目标区域为应急方案的目标区域
    commandForm.target_area = plan.target_area
    
    // 尝试解析目标区域为数组格式
    // 优先处理单个区域的情况，例如："北京市昌平区" -> ["北京市", "昌平区"]
    const regionMatch = plan.target_area.match(/^(\S+[省市自治区])([^、，,]+)$/)
    if (regionMatch && regionMatch.length === 3) {
      const province = regionMatch[1]
      const city = regionMatch[2].trim()
      
      // 验证解析出的省和市是否在regions数据中
      const provinceObj = regions.find(r => r.province === province)
      if (provinceObj && provinceObj.cities.includes(city)) {
        commandForm.target_area_array = [province, city]
      } else {
        // 如果解析失败，保持空数组
        commandForm.target_area_array = []
      }
    } else {
      commandForm.target_area_array = []
    }
    
    showCommandDialog.value = true
  } else {
    ElMessage.warning('请先激活应急方案')
  }
}

// 切换指令列表展开/收缩
const toggleCommands = async (plan) => {
  if (plan.expanded) {
    // 收起
    plan.expanded = false
  } else {
    // 展开并加载指令
    plan.expanded = true
    // 加载该方案下的指令
    try {
      const commandsRes = await getCommands({ plan_id: plan.id })
      plan.commands = commandsRes.data || []
    } catch (error) {
      console.error('获取方案指令失败:', error)
      plan.commands = []
      ElMessage.error('获取指令失败')
    }
  }
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

// 处理文件上传
const handleFileChange = async (file, fileList) => {
  // 验证文件格式
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  const fileExtension = file.name.split('.').pop().toLowerCase()
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif']
  
  if (!validTypes.includes(file.raw.type) || !validExtensions.includes(fileExtension)) {
    ElMessage.error('只支持上传 JPG、PNG、GIF 格式的图片')
    return
  }
  
  // 实现真实的文件上传
  if (file.raw) {
    const formData = new FormData()
    formData.append('file', file.raw)
    
    try {
      // 调用后端文件上传API，不手动设置Content-Type，让浏览器自动处理
      const response = await request.post('/upload', formData, {
        headers: {
          'Content-Type': undefined // 让浏览器自动设置
        }
      })
      
      // 更新文件列表，添加url属性用于预览
      const updatedFileList = fileList.map(f => {
        if (f.uid === file.uid) {
          return {
            ...f,
            url: response.data.url // 添加url属性
          }
        }
        return f
      })
      
      feedbackForm.files = updatedFileList
      feedbackForm.attachment_url = response.data.url
      ElMessage.success('图片上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error('上传失败，请重试')
      feedbackForm.files = []
      feedbackForm.attachment_url = ''
    }
  }
}

// 处理文件超出限制
const handleExceed = (files, fileList) => {
  ElMessage.warning('只能上传一个文件')
}

// 提交反馈
const submitFeedbackForm = async () => {
  if (!feedbackForm.command_id || !feedbackForm.feedback_content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  feedbackLoading.value = true
  
  try {
    const submitData = {
      command_id: feedbackForm.command_id,
      feedback_content: feedbackForm.feedback_content,
      status: feedbackForm.status,
      attachment_url: feedbackForm.attachment_url
    }

    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newFeedback = {
        id: Date.now(),
        ...submitData,
        executor: userStore.user?.real_name || '农户',
        created_at: new Date()
      }
      recentFeedback.value.unshift(newFeedback)
    } else {
      // API模式
      await submitFeedbackAPI(submitData)
      await loadData() // 重新加载数据
    }
    
    // 触发应急响应页面刷新，通知管理员端
    userStore.triggerEmergencyRefresh()
    
    ElMessage.success('反馈提交成功')
    showFeedbackDialog.value = false
    
    // 重置表单
    Object.assign(feedbackForm, {
      command_id: '',
      status: 'completed',
      feedback_content: '',
      files: [],
      attachment_url: ''
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交反馈失败')
  } finally {
    feedbackLoading.value = false
  }
}

// 打开发完成指令对话框
const completeCommand = (command) => {
  // 设置表单数据
  completeForm.command_id = command.id
  completeForm.command_content = command.command_content
  completeForm.target_area = command.target_area
  completeForm.feedback_content = ''
  completeForm.files = []
  completeForm.attachment_url = ''
  
  showCompleteDialog.value = true
}

// 查看指令反馈
const viewCommandFeedback = (command) => {
  selectedCommand.value = command
  // 从 recentFeedback 中筛选出与该命令相关的反馈
  commandFeedbacks.value = recentFeedback.value.filter(feedback => feedback.command_id === command.id)
  showFeedbackDetailDialog.value = true
}

// 处理完成指令的文件上传
const handleCompleteFileChange = async (file, fileList) => {
  // 验证文件格式
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  const fileExtension = file.name.split('.').pop().toLowerCase()
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif']
  
  if (!validTypes.includes(file.raw.type) || !validExtensions.includes(fileExtension)) {
    ElMessage.error('只支持上传 JPG、PNG、GIF 格式的图片')
    return
  }
  
  // 实现真实的文件上传
  if (file.raw) {
    const formData = new FormData()
    formData.append('file', file.raw)
    
    try {
      // 调用后端文件上传API，不手动设置Content-Type，让浏览器自动处理
      const response = await request.post('/upload', formData, {
        headers: {
          'Content-Type': undefined // 让浏览器自动设置
        }
      })
      
      // 更新文件列表，添加url属性用于预览
      const updatedFileList = fileList.map(f => {
        if (f.uid === file.uid) {
          return {
            ...f,
            url: response.data.url // 添加url属性
          }
        }
        return f
      })
      
      completeForm.files = updatedFileList
      completeForm.attachment_url = response.data.url
      ElMessage.success('图片上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error('上传失败，请重试')
      completeForm.files = []
      completeForm.attachment_url = ''
    }
  }
}

// 提交完成指令
const submitCompleteForm = async () => {
  if (!completeForm.command_id || !completeForm.feedback_content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  completeLoading.value = true
  
  try {
    const submitData = {
      command_id: completeForm.command_id,
      feedback_content: completeForm.feedback_content,
      status: 'completed',
      attachment_url: completeForm.attachment_url
    }

    if (useMockData.value) {
      // 模拟数据模式
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newFeedback = {
        id: Date.now(),
        ...submitData,
        executor: userStore.user?.real_name || '农户',
        created_at: new Date()
      }
      recentFeedback.value.unshift(newFeedback)
    } else {
      // API模式
      await submitFeedbackAPI(submitData)
      await loadData() // 重新加载数据
    }
    
    // 触发应急响应页面刷新，通知管理员端
    userStore.triggerEmergencyRefresh()
    
    ElMessage.success('指令完成成功')
    showCompleteDialog.value = false
    
    // 重置表单
    Object.assign(completeForm, {
      command_id: '',
      command_content: '',
      target_area: '',
      feedback_content: '',
      files: [],
      attachment_url: ''
    })
  } catch (error) {
    console.error('提交完成失败:', error)
    ElMessage.error('提交完成失败')
  } finally {
    completeLoading.value = false
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

/* 指令列表（展开/收缩） */
.commands-list {
  max-height: 300px;
  overflow-y: auto;
  position: relative;
  margin-top: 16px;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid #e4e7ed;
}

.commands-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding-left: 30px;
}

.commands-container::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e4e7ed;
  pointer-events: none;
}

.empty-commands {
  padding: 20px 0;
}

.command-item {
  position: relative;
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.command-item::before {
  content: '';
  position: absolute;
  left: -30px;
  top: 20px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #409eff;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #409eff;
  z-index: 1;
}

.command-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
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

.command-region-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.command-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 反馈详情样式 */
.feedback-detail-list {
  max-height: 500px;
  overflow-y: auto;
}

.feedback-detail-item {
  margin-bottom: 20px;
}

.feedback-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.feedback-detail-user {
  display: flex;
  align-items: center;
}

.feedback-detail-time {
  font-size: 12px;
  color: #909399;
}

.feedback-detail-content {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  color: #303133;
}

.feedback-detail-image {
  margin-top: 12px;
}

.empty-feedback {
  padding: 40px 0;
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

.feedback-image {
  margin: 8px 0;
}

.feedback-image img {
  border-radius: 4px;
  cursor: pointer;
}

.command-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.command-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.command-response {
  font-size: 12px;
  color: #606266;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 10px;
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

/* 选项内容样式 */
.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
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

/* 完成指令按钮样式 */
.command-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
</style>
