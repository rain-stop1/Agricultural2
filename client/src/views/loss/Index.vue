<template>
  <div class="loss-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <el-button type="danger" @click="showReportDialog = true">
        <el-icon><DocumentAdd /></el-icon>
        上报损失
      </el-button>
      <el-button type="primary" @click="exportReport">
        <el-icon><Download /></el-icon>
        导出报告
      </el-button>
    </div>

    <!-- 统计卡片 - 仅管理员可见 -->
    <el-row v-if="isAdmin" :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_reports }}</div>
              <div class="stat-label">总上报数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
              <el-icon size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pending_reports }}</div>
              <div class="stat-label">待审核</div>
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
              <div class="stat-value">{{ statistics.approved_reports }}</div>
              <div class="stat-label">已审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.total_loss.toLocaleString() }}</div>
              <div class="stat-label">总损失金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 损失上报列表 -->
    <el-card class="report-card">
      <template #header>
        <div class="card-header">
          <div>
            <h3>损失上报记录</h3>
            <el-tag v-if="isFarmer" type="warning" size="small" style="margin-left: 8px;">仅显示我的上报</el-tag>
          </div>
          <div class="filter-bar">
            <el-select v-model="statusFilter" size="small" style="width: 120px; margin-right: 12px;">
              <el-option label="全部状态" value="all" />
              <el-option label="待审核" value="pending" />
              <el-option label="已审核" value="approved" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
            <el-select v-model="disasterFilter" size="small" style="width: 120px;">
              <el-option label="全部灾害" value="all" />
              <el-option label="洪涝" value="flood" />
              <el-option label="干旱" value="drought" />
              <el-option label="冰雹" value="hail" />
              <el-option label="病虫害" value="pest" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredReports" stripe style="width: 100%">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="reporter" label="上报人" width="100" />
        <el-table-column label="灾害类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDisasterTypeTag(row.disaster_type)" size="small">
              {{ getDisasterTypeName(row.disaster_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="受灾地块" width="180" />
        <el-table-column prop="crop_type" label="作物类型" width="100" />
        <el-table-column label="损失面积" width="100">
          <template #default="{ row }">
            {{ row.loss_area }} 亩
          </template>
        </el-table-column>
        <el-table-column label="损失程度" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.loss_rate" 
              :color="getLossColor(row.loss_rate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="损失金额" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 500;">
              ¥{{ row.loss_amount.toLocaleString() }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="report_time" label="上报时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <!-- 只有管理员可以审核 -->
            <el-button 
              v-if="isAdmin && row.status === 'pending'" 
              size="small" 
              type="success"
              @click="approveReport(row)"
            >
              审核
            </el-button>
            <!-- 农户只能删除自己待审核的报告 -->
            <el-button 
              v-if="isFarmer && row.status === 'pending'" 
              size="small" 
              type="danger"
              @click="deleteReport(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上报损失对话框 -->
    <el-dialog
      v-model="showReportDialog"
      title="上报损失"
      width="700px"
    >
      <el-form :model="reportForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="灾害类型">
              <el-select v-model="reportForm.disaster_type" placeholder="选择灾害类型">
                <el-option label="洪涝" value="flood" />
                <el-option label="干旱" value="drought" />
                <el-option label="冰雹" value="hail" />
                <el-option label="病虫害" value="pest" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作物类型">
              <el-input v-model="reportForm.crop_type" placeholder="如：小麦、水稻" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="受灾地块">
          <el-input v-model="reportForm.location" placeholder="输入地块位置" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="地块面积">
              <el-input-number 
                v-model="reportForm.total_area" 
                :min="0.1" 
                :step="0.1"
                placeholder="亩"
              />
              <span style="margin-left: 8px;">亩</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="损失面积">
              <el-input-number 
                v-model="reportForm.loss_area" 
                :min="0.1" 
                :step="0.1"
                :max="reportForm.total_area"
                placeholder="亩"
              />
              <span style="margin-left: 8px;">亩</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="损失程度">
          <div style="display: flex; align-items: center; gap: 16px; width: 100%;">
            <el-slider 
              v-model="reportForm.loss_rate" 
              :marks="{ 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' }"
              style="flex: 1;"
            />
            <el-input-number 
              v-model="reportForm.loss_rate" 
              :min="0" 
              :max="100"
              style="width: 120px;"
            />
            <span>%</span>
          </div>
        </el-form-item>

        <el-form-item label="预估损失">
          <el-input-number 
            v-model="reportForm.loss_amount" 
            :min="0" 
            :step="100"
            placeholder="元"
            style="width: 200px;"
          />
          <span style="margin-left: 8px;">元</span>
        </el-form-item>

        <el-form-item label="损失描述">
          <el-input 
            v-model="reportForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="详细描述受灾情况、损失详情等"
          />
        </el-form-item>

        <el-form-item label="现场照片">
          <el-upload
            v-model:file-list="fileList"
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            list-type="picture-card"
            accept="image/*"
            :limit="3"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传3张照片，支持 JPG、PNG、GIF 格式</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="reportLoading">
          提交上报
        </el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="showApproveDialog"
      title="审核损失上报"
      width="600px"
    >
      <div v-if="currentReport" class="approve-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="上报人">{{ currentReport.reporter }}</el-descriptions-item>
          <el-descriptions-item label="灾害类型">
            <el-tag :type="getDisasterTypeTag(currentReport.disaster_type)" size="small">
              {{ getDisasterTypeName(currentReport.disaster_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="受灾地块">{{ currentReport.location }}</el-descriptions-item>
          <el-descriptions-item label="作物类型">{{ currentReport.crop_type }}</el-descriptions-item>
          <el-descriptions-item label="地块面积">{{ currentReport.total_area }} 亩</el-descriptions-item>
          <el-descriptions-item label="损失面积">{{ currentReport.loss_area }} 亩</el-descriptions-item>
          <el-descriptions-item label="损失程度">{{ currentReport.loss_rate }}%</el-descriptions-item>
          <el-descriptions-item label="损失金额">
            <span style="color: #f56c6c; font-weight: 500;">
              ¥{{ currentReport.loss_amount.toLocaleString() }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="上报时间" :span="2">
            {{ currentReport.report_time }}
          </el-descriptions-item>
          <el-descriptions-item label="损失描述" :span="2">
            {{ currentReport.description }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 调试信息 -->
        <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; font-size: 12px;">
          <div>调试信息：</div>
          <div>images存在: {{ !!currentReport.images }}</div>
          <div>images类型: {{ typeof currentReport.images }}</div>
          <div>是否为数组: {{ Array.isArray(currentReport.images) }}</div>
          <div>images长度: {{ currentReport.images ? currentReport.images.length : 'N/A' }}</div>
          <div>images内容: {{ JSON.stringify(currentReport.images) }}</div>
        </div>

        <!-- 现场照片 -->
        <div v-if="currentReport.images && currentReport.images.length > 0" style="margin-top: 20px;">
          <el-divider content-position="left">现场照片</el-divider>
          <div class="image-gallery">
            <el-image 
              v-for="(img, index) in currentReport.images" 
              :key="index"
              :src="img" 
              :preview-src-list="currentReport.images"
              :initial-index="index"
              fit="cover"
              class="gallery-image"
            />
          </div>
        </div>
        
        <!-- 如果没有图片，显示提示 -->
        <div v-else style="margin-top: 20px;">
          <el-divider content-position="left">现场照片</el-divider>
          <el-empty description="暂无照片" :image-size="80" />
        </div>

        <el-divider />

        <el-form :model="approveForm" label-width="100px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="approveForm.result">
              <el-radio value="approved">通过</el-radio>
              <el-radio value="rejected">驳回</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审核意见">
            <el-input 
              v-model="approveForm.comment" 
              type="textarea" 
              :rows="3"
              placeholder="填写审核意见"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">
          确认审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentAdd,
  Download,
  Document,
  Clock,
  CircleCheck,
  Money,
  Plus
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { 
  getLossReports, 
  submitLossReport, 
  approveLossReport, 
  deleteLossReport,
  getLossStatistics 
} from '@/api/loss'

// 用户信息
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.user_type === 'admin')
const isFarmer = computed(() => userStore.user?.user_type === 'farmer')

// 是否使用模拟数据（如果API失败则使用）
const useMockData = ref(false)

// 响应式数据
const showReportDialog = ref(false)
const showApproveDialog = ref(false)
const reportLoading = ref(false)
const statusFilter = ref('all')
const disasterFilter = ref('all')
const reports = ref([])
const currentReport = ref(null)
const fileList = ref([])

// 统计数据
const statistics = ref({
  total_reports: 0,
  pending_reports: 0,
  approved_reports: 0,
  total_loss: 0
})

// 上报表单
const reportForm = reactive({
  disaster_type: '',
  location: '',
  crop_type: '',
  total_area: 10,
  loss_area: 5,
  loss_rate: 50,
  loss_amount: 5000,
  description: '',
  images: []
})

// 审核表单
const approveForm = reactive({
  result: 'approved',
  comment: ''
})

// 计算属性：过滤上报记录
const filteredReports = computed(() => {
  let filtered = reports.value

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter.value)
  }

  if (disasterFilter.value !== 'all') {
    filtered = filtered.filter(r => r.disaster_type === disasterFilter.value)
  }

  return filtered
})

// 加载数据（优先使用API，失败则使用模拟数据）
const loadData = async () => {
  try {
    // 尝试从API加载数据
    const [reportsRes, statsRes] = await Promise.all([
      getLossReports({
        status: statusFilter.value === 'all' ? undefined : statusFilter.value,
        disaster_type: disasterFilter.value === 'all' ? undefined : disasterFilter.value
      }),
      getLossStatistics()
    ])

    if (reportsRes.code === 200) {
      reports.value = reportsRes.data
      useMockData.value = false
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
  reports.value = [
    {
      id: 1,
      reporter: '张三',
      disaster_type: 'flood',
      location: '江苏省南京市江宁区东山街道1号地块',
      crop_type: '水稻',
      total_area: 50,
      loss_area: 30,
      loss_rate: 60,
      loss_amount: 45000,
      description: '连续暴雨导致地块积水严重，水稻大面积倒伏',
      images: [
        'https://via.placeholder.com/400x300/409EFF/FFFFFF?text=现场照片1',
        'https://via.placeholder.com/400x300/67C23A/FFFFFF?text=现场照片2'
      ],
      status: 'pending',
      report_time: '2024-01-15 09:30:00'
    },
    {
      id: 2,
      reporter: '李四',
      disaster_type: 'drought',
      location: '河北省石家庄市藁城区2号地块',
      crop_type: '小麦',
      total_area: 80,
      loss_area: 50,
      loss_rate: 40,
      loss_amount: 32000,
      description: '持续干旱，小麦出现枯萎现象',
      images: [
        'https://via.placeholder.com/400x300/E6A23C/FFFFFF?text=现场照片1'
      ],
      status: 'approved',
      report_time: '2024-01-14 14:20:00'
    },
    {
      id: 3,
      reporter: '王五',
      disaster_type: 'hail',
      location: '山东省济南市历城区3号地块',
      crop_type: '玉米',
      total_area: 60,
      loss_area: 45,
      loss_rate: 75,
      loss_amount: 67500,
      description: '突发冰雹，玉米叶片严重受损',
      images: [],
      status: 'approved',
      report_time: '2024-01-13 16:45:00'
    },
    {
      id: 4,
      reporter: '赵六',
      disaster_type: 'pest',
      location: '浙江省杭州市余杭区4号地块',
      crop_type: '蔬菜',
      total_area: 30,
      loss_area: 20,
      loss_rate: 50,
      loss_amount: 25000,
      description: '病虫害爆发，蔬菜大量枯萎',
      images: [
        'https://via.placeholder.com/400x300/F56C6C/FFFFFF?text=现场照片1',
        'https://via.placeholder.com/400x300/909399/FFFFFF?text=现场照片2',
        'https://via.placeholder.com/400x300/303133/FFFFFF?text=现场照片3'
      ],
      status: 'pending',
      report_time: '2024-01-12 10:15:00'
    }
  ]

  updateStatistics()
}

// 更新统计数据（本地计算，用于模拟数据）
const updateStatistics = () => {
  statistics.value = {
    total_reports: reports.value.length,
    pending_reports: reports.value.filter(r => r.status === 'pending').length,
    approved_reports: reports.value.filter(r => r.status === 'approved').length,
    total_loss: reports.value.reduce((sum, r) => sum + r.loss_amount, 0)
  }
}

// 上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 图片压缩函数
const compressImage = (file, maxSizeKB = 300) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 计算压缩后的尺寸（最大宽度1200px）
        let width = img.width
        let height = img.height
        const maxWidth = 1200
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 尝试不同的质量级别进行压缩
        let quality = 0.8
        let base64 = canvas.toDataURL('image/jpeg', quality)
        
        // 如果还是太大，继续降低质量
        while (base64.length * 0.75 / 1024 > maxSizeKB && quality > 0.1) {
          quality -= 0.1
          base64 = canvas.toDataURL('image/jpeg', quality)
        }
        
        console.log(`图片压缩完成: 原始${(file.size/1024).toFixed(2)}KB -> ${(base64.length * 0.75 / 1024).toFixed(2)}KB, 质量${(quality*100).toFixed(0)}%`)
        
        resolve(base64)
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

// 处理文件上传
const handleFileChange = async (file) => {
  console.log('开始处理文件:', file.name, '大小:', (file.size/1024).toFixed(2), 'KB')
  
  // 验证文件类型
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件！')
    const index = fileList.value.findIndex(f => f.uid === file.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
    return false
  }

  // 验证文件大小
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB！')
    const index = fileList.value.findIndex(f => f.uid === file.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
    return false
  }

  // 显示加载提示
  const loading = ElMessage.info('正在压缩图片...')
  
  try {
    // 压缩图片到最大300KB
    const compressedBase64 = await compressImage(file.raw, 300)
    
    console.log('压缩后Base64长度:', compressedBase64.length)
    console.log('压缩后大小约:', (compressedBase64.length * 0.75 / 1024).toFixed(2), 'KB')
    
    reportForm.images.push(compressedBase64)
    console.log('已添加到reportForm.images，当前数量:', reportForm.images.length)
    
    loading.close()
    ElMessage.success('图片处理完成')
  } catch (error) {
    console.error('图片处理失败:', error)
    loading.close()
    ElMessage.error('图片处理失败: ' + error.message)
    
    // 移除失败的文件
    const index = fileList.value.findIndex(f => f.uid === file.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
  
  return false
}

// 移除文件
const handleRemove = (file) => {
  // 从fileList中找到对应的索引
  const fileIndex = fileList.value.findIndex(f => f.uid === file.uid)
  
  // 从images数组中移除对应的图片
  if (fileIndex > -1 && fileIndex < reportForm.images.length) {
    reportForm.images.splice(fileIndex, 1)
  }
}

// 提交上报
const submitReport = async () => {
  if (!reportForm.disaster_type || !reportForm.location || !reportForm.crop_type) {
    ElMessage.warning('请填写完整信息')
    return
  }

  // 检查图片是否都已转换完成
  console.log('提交时的images:', reportForm.images)
  console.log('fileList数量:', fileList.value.length)
  console.log('images数量:', reportForm.images.length)
  
  if (fileList.value.length > 0 && reportForm.images.length === 0) {
    ElMessage.warning('图片正在处理中，请稍后再试')
    return
  }

  reportLoading.value = true

  try {
    if (useMockData.value) {
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newReport = {
        id: Date.now(),
        reporter: '当前用户',
        ...reportForm,
        images: [...reportForm.images],
        status: 'pending',
        report_time: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')
      }

      reports.value.unshift(newReport)
      updateStatistics()
    } else {
      // 使用真实API
      const response = await submitLossReport(reportForm)
      
      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    ElMessage.success('损失上报提交成功')
    showReportDialog.value = false
    fileList.value = []

    // 重置表单
    Object.assign(reportForm, {
      disaster_type: '',
      location: '',
      crop_type: '',
      total_area: 10,
      loss_area: 5,
      loss_rate: 50,
      loss_amount: 5000,
      description: '',
      images: []
    })
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    reportLoading.value = false
  }
}

// 查看详情（简化版，不显示图片）
const viewDetail = (report) => {
  ElMessageBox.alert(
    `
      <div style="padding: 10px; line-height: 1.8;">
        <p><strong>上报人：</strong>${report.reporter}</p>
        <p><strong>灾害类型：</strong>${getDisasterTypeName(report.disaster_type)}</p>
        <p><strong>受灾地块：</strong>${report.location}</p>
        <p><strong>作物类型：</strong>${report.crop_type}</p>
        <p><strong>地块面积：</strong>${report.total_area} 亩</p>
        <p><strong>损失面积：</strong>${report.loss_area} 亩</p>
        <p><strong>损失程度：</strong>${report.loss_rate}%</p>
        <p><strong>损失金额：</strong><span style="color: #f56c6c; font-weight: 500;">¥${report.loss_amount.toLocaleString()}</span></p>
        <p><strong>状态：</strong>${getStatusName(report.status)}</p>
        <p><strong>上报时间：</strong>${report.report_time}</p>
        <p><strong>损失描述：</strong>${report.description}</p>
        ${report.images && report.images.length > 0 ? `<p><strong>现场照片：</strong>${report.images.length} 张（点击"审核"查看）</p>` : '<p><strong>现场照片：</strong>无</p>'}
      </div>
    `,
    '损失详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 审核上报
const approveReport = (report) => {
  currentReport.value = report
  approveForm.result = 'approved'
  approveForm.comment = ''
  
  // 调试：查看images数据
  console.log('审核报告:', report)
  console.log('images字段:', report.images)
  console.log('images类型:', typeof report.images)
  console.log('是否为数组:', Array.isArray(report.images))
  
  showApproveDialog.value = true
}

// 确认审核
const confirmApprove = async () => {
  if (!approveForm.comment) {
    ElMessage.warning('请填写审核意见')
    return
  }

  try {
    if (useMockData.value) {
      // 使用模拟数据
      currentReport.value.status = approveForm.result
      updateStatistics()
    } else {
      // 使用真实API
      const response = await approveLossReport(currentReport.value.id, {
        result: approveForm.result,
        comment: approveForm.comment
      })

      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    ElMessage.success('审核完成')
    showApproveDialog.value = false
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败，请重试')
  }
}

// 删除上报
const deleteReport = async (report) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条上报记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (useMockData.value) {
      // 使用模拟数据
      const index = reports.value.findIndex(r => r.id === report.id)
      if (index > -1) {
        reports.value.splice(index, 1)
        updateStatistics()
      }
    } else {
      // 使用真实API
      const response = await deleteLossReport(report.id)
      
      if (response.code === 200) {
        await loadData() // 重新加载数据
      }
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

// 导出报告
const exportReport = () => {
  ElMessage.success('报告导出功能开发中...')
}

// 工具函数
const getDisasterTypeName = (type) => {
  const map = {
    flood: '洪涝',
    drought: '干旱',
    hail: '冰雹',
    pest: '病虫害',
    other: '其他'
  }
  return map[type] || type
}

const getDisasterTypeTag = (type) => {
  const map = {
    flood: 'primary',
    drought: 'warning',
    hail: 'danger',
    pest: 'success',
    other: 'info'
  }
  return map[type] || 'info'
}

const getStatusName = (status) => {
  const map = {
    pending: '待审核',
    approved: '已审核',
    rejected: '已驳回'
  }
  return map[status] || status
}

const getStatusTag = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getLossColor = (rate) => {
  if (rate < 30) return '#67c23a'
  if (rate < 60) return '#e6a23c'
  return '#f56c6c'
}

// 监听筛选条件变化
watch([statusFilter, disasterFilter], () => {
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
.loss-page {
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

.filter-bar {
  display: flex;
  align-items: center;
}

/* 表格样式 */
.report-card {
  margin-bottom: 20px;
}

/* 上传提示 */
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 审核内容 */
.approve-content {
  padding: 10px 0;
}

/* 图片画廊 */
.image-gallery {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.gallery-image {
  width: 150px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
  object-fit: cover;
}

/* 响应式 */
@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
