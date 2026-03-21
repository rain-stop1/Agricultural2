<template>
  <div class="warning-notification">
    <!-- 实时预警通知弹窗 -->
    <transition-group name="notification" tag="div" class="notification-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="notification.level"
      >
        <div class="notification-content">
          <div class="notification-header">
            <el-icon class="notification-icon">
              <WarningFilled v-if="notification.level === 'severe'" />
              <Warning v-else-if="notification.level === 'moderate'" />
              <InfoFilled v-else />
            </el-icon>
            <span class="notification-title">{{ getLevelText(notification.level) }}预警</span>
            <el-button 
              text 
              size="small" 
              @click="closeNotification(notification.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          
          <div class="notification-body">
            <p class="notification-message">{{ notification.message }}</p>
            <p class="notification-location">{{ notification.location }}</p>
          </div>
          
          <div class="notification-actions">
            <el-button size="small" @click="viewDetail(notification)">查看详情</el-button>
            <el-button size="small" type="primary" @click="viewMap(notification)">查看地图</el-button>
          </div>
        </div>
        
        <!-- 自动关闭进度条 -->
        <div 
          class="notification-progress"
          :style="{ animationDuration: notification.duration + 'ms' }"
        ></div>
      </div>
    </transition-group>

    <!-- 右下角通知汇总 -->
    <div v-if="unreadCount > 0" class="notification-summary">
      <el-badge :value="unreadCount" :max="99" type="danger">
        <el-button 
          circle 
          type="danger" 
          @click="showNotificationPanel"
          class="summary-btn"
        >
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
    </div>

    <!-- 通知历史面板 -->
    <el-drawer
      v-model="showPanel"
      title="预警通知历史"
      size="400px"
      direction="rtl"
    >
      <div class="notification-history">
        <div class="history-header">
          <el-button size="small" @click="clearAllHistory">清空历史</el-button>
          <el-button size="small" @click="markAllAsRead">全部已读</el-button>
        </div>
        
        <div class="history-list">
          <div 
            v-for="item in notificationHistory" 
            :key="item.id"
            class="history-item"
            :class="{ 'unread': !item.read, [item.level]: true }"
            @click="viewHistoryDetail(item)"
          >
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            <div class="history-content">
              <div class="history-level">{{ getLevelText(item.level) }}</div>
              <div class="history-message">{{ item.message }}</div>
            </div>
            <div class="history-actions">
              <el-button 
                v-if="!item.read" 
                size="small" 
                text 
                @click.stop="markAsRead(item.id)"
              >
                标记已读
              </el-button>
              <el-button 
                size="small" 
                text 
                type="danger"
                @click.stop="removeFromHistory(item.id)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <el-empty v-if="notificationHistory.length === 0" description="暂无通知历史" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  WarningFilled, 
  Warning, 
  InfoFilled, 
  Close, 
  Bell 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const notifications = ref([])
const notificationHistory = ref([])
const showPanel = ref(false)
let notificationIdCounter = 1
let websocket = null
let reconnectTimer = null

// 未读数量
const unreadCount = computed(() => {
  return notificationHistory.value.filter(item => !item.read).length
})

// WebSocket 连接
const initWebSocket = () => {
  try {
    // 这里需要根据实际的 WebSocket 服务器地址进行调整
    const wsUrl = `ws://localhost:3001/ws/notifications`
    websocket = new WebSocket(wsUrl)
    
    websocket.onopen = () => {
      console.log('WebSocket 连接已建立')
      clearReconnectTimer()
    }
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'warning') {
        handleNewWarning(data.payload)
      }
    }
    
    websocket.onclose = () => {
      console.log('WebSocket 连接已关闭')
      scheduleReconnect()
    }
    
    websocket.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      scheduleReconnect()
    }
  } catch (error) {
    console.error('WebSocket 初始化失败:', error)
    // 如果 WebSocket 不可用，使用模拟数据
    initMockNotifications()
  }
}

// 重连机制
const scheduleReconnect = () => {
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      console.log('尝试重新连接 WebSocket...')
      initWebSocket()
    }, 5000)
  }
}

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

// 处理新预警
const handleNewWarning = (warningData) => {
  const notification = {
    id: notificationIdCounter++,
    level: warningData.warning_level,
    message: warningData.warning_content,
    location: warningData.region,
    data: warningData,
    duration: 5000, // 5秒后自动关闭
    timestamp: new Date()
  }
  
  notifications.value.push(notification)
  
  // 添加到历史记录
  notificationHistory.value.unshift({
    ...notification,
    read: false
  })
  
  // 播放提示音（可选）
  playNotificationSound()
  
  // 浏览器通知
  showBrowserNotification(notification)
}

// 模拟通知数据（用于测试）
const initMockNotifications = () => {
  // 每30秒模拟一个新预警
  setInterval(() => {
    const levels = ['light', 'moderate', 'severe']
    const locations = ['北京市海淀区', '河北省石家庄市', '山东省济南市', '江苏省南京市']
    const messages = [
      '预计未来24小时将出现强降雨',
      '气温骤降，请注意防寒保暖',
      '台风即将登陆，请做好防护准备',
      '干旱持续，请节约用水'
    ]
    
    const mockData = {
      warning_level: levels[Math.floor(Math.random() * levels.length)],
      warning_content: messages[Math.floor(Math.random() * messages.length)],
      region: locations[Math.floor(Math.random() * locations.length)]
    }
    
    handleNewWarning(mockData)
  }, 30000)
}

// 播放提示音
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // 忽略播放失败（用户可能禁用了自动播放）
    })
  } catch (error) {
    console.log('提示音播放失败:', error)
  }
}

// 浏览器通知
const showBrowserNotification = (notification) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const browserNotification = new Notification('农业灾害预警系统', {
      body: notification.message,
      icon: '/warning-icon.png',
      tag: notification.id
    })
    
    browserNotification.onclick = () => {
      window.focus()
      viewDetail(notification)
    }
    
    setTimeout(() => {
      browserNotification.close()
    }, 5000)
  }
}

// 关闭通知
const closeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 查看详情
const viewDetail = (notification) => {
  closeNotification(notification.id)
  router.push('/warning')
  ElMessage.info('跳转到预警详情页面')
}

// 查看地图
const viewMap = (notification) => {
  closeNotification(notification.id)
  router.push('/warning/enhanced')
  ElMessage.info('跳转到预警地图页面')
}

// 显示通知面板
const showNotificationPanel = () => {
  showPanel.value = true
}

// 标记已读
const markAsRead = (id) => {
  const item = notificationHistory.value.find(h => h.id === id)
  if (item) {
    item.read = true
  }
}

// 标记全部已读
const markAllAsRead = () => {
  notificationHistory.value.forEach(item => {
    item.read = true
  })
  ElMessage.success('已标记全部为已读')
}

// 从历史记录中删除
const removeFromHistory = (id) => {
  const index = notificationHistory.value.findIndex(h => h.id === id)
  if (index > -1) {
    notificationHistory.value.splice(index, 1)
  }
}

// 清空历史
const clearAllHistory = () => {
  notificationHistory.value = []
  ElMessage.success('已清空通知历史')
}

// 查看历史详情
const viewHistoryDetail = (item) => {
  markAsRead(item.id)
  viewDetail(item)
}

// 获取等级文本
const getLevelText = (level) => {
  const textMap = {
    light: '轻度',
    moderate: '中度',
    severe: '重度'
  }
  return textMap[level] || '未知'
}

// 格式化时间
const formatTime = (timestamp) => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 请求浏览器通知权限
const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// 组件挂载
onMounted(() => {
  requestNotificationPermission()
  initWebSocket()
  
  // 从 localStorage 加载历史记录
  const savedHistory = localStorage.getItem('warning_notifications')
  if (savedHistory) {
    try {
      notificationHistory.value = JSON.parse(savedHistory)
    } catch (error) {
      console.error('加载通知历史失败:', error)
    }
  }
})

// 组件卸载前
onBeforeUnmount(() => {
  if (websocket) {
    websocket.close()
  }
  clearReconnectTimer()
  
  // 保存历史记录到 localStorage
  try {
    localStorage.setItem('warning_notifications', JSON.stringify(notificationHistory.value))
  } catch (error) {
    console.error('保存通知历史失败:', error)
  }
})
</script>

<style scoped>
.warning-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.notification-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  position: relative;
  width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
}

.notification-item.severe {
  border-left: 4px solid #f56c6c;
}

.notification-item.moderate {
  border-left: 4px solid #e6a23c;
}

.notification-item.light {
  border-left: 4px solid #409eff;
}

.notification-content {
  padding: 16px;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification-icon {
  font-size: 20px;
}

.notification-icon.severe {
  color: #f56c6c;
}

.notification-icon.moderate {
  color: #e6a23c;
}

.notification-icon.light {
  color: #409eff;
}

.notification-title {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.notification-body {
  margin-bottom: 12px;
}

.notification-message {
  margin: 0 0 4px 0;
  color: #303133;
  line-height: 1.4;
}

.notification-location {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #409eff;
  animation: progressShrink linear forwards;
}

.notification-summary {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.summary-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-history {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-item.unread {
  background: #f0f9ff;
  border-color: #bfdbfe;
}

.history-item.severe {
  border-left: 3px solid #f56c6c;
}

.history-item.moderate {
  border-left: 3px solid #e6a23c;
}

.history-item.light {
  border-left: 3px solid #409eff;
}

.history-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.history-level {
  font-weight: 600;
  color: #303133;
}

.history-message {
  flex: 1;
  margin: 0 8px;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.history-actions {
  display: flex;
  gap: 4px;
}

/* 动画效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes progressShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-item {
    width: calc(100vw - 40px);
  }
  
  .notification-summary {
    bottom: 80px;
  }
}
</style>