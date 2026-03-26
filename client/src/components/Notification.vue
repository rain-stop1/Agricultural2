<template>
  <div class="notification-container">
    <el-dropdown trigger="click" @command="handleCommand">
      <div class="notification-header">
        <el-icon class="notification-icon"><Bell /></el-icon>
        <el-badge v-if="unreadCount > 0" :value="unreadCount" type="danger" />
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <div class="notification-dropdown">
            <div class="notification-header">
              <h3>通知中心</h3>
              <el-button size="small" @click="markAllAsRead" v-if="unreadCount > 0">
                全部已读
              </el-button>
            </div>
            <div class="notification-list">
              <div v-if="notifications.length === 0" class="empty-notification">
                <el-empty description="暂无通知" :image-size="60" />
              </div>
              <el-dropdown-item
                v-for="notification in notifications"
                :key="notification.id"
                :command="notification"
                class="notification-item"
                :class="{ 'unread': !notification.read_status }"
              >
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-message">{{ notification.content }}</div>
                  <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
                </div>
              </el-dropdown-item>
            </div>
            <div class="notification-footer">
              <el-button size="small" @click="showAllNotifications">查看全部</el-button>
            </div>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getNotifications,
  markNotificationAsRead,
  getUnreadCount
} from '@/api/notification'

const emit = defineEmits(['new-notification'])

const notifications = ref([])
const unreadCount = ref(0)
// 使用localStorage持久化存储lastNotificationId
const lastNotificationId = ref(0)

// 初始化lastNotificationId
if (typeof window !== 'undefined') {
  lastNotificationId.value = parseInt(localStorage.getItem('lastNotificationId') || '0')
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 显示弹出通知
const showPopupNotification = (notification) => {
  const typeMap = {
    'loss_report': 'warning',
    'emergency_plan': 'info',
    'success': 'success',
    'error': 'error',
    'info': 'info'
  }
  
  const type = typeMap[notification.type] || 'info'
  
  ElNotification({
    title: notification.title,
    dangerouslyUseHTMLString: true,
    message: `
      <div style="line-height: 1.8;">
        <p style="margin: 8px 0; font-size: 14px; color: #303133;">
          ${notification.content}
        </p>
        <p style="margin: 8px 0 4px; font-size: 12px; color: #909399;">
          ${formatTime(notification.created_at)}
        </p>
      </div>
    `,
    type: type,
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: true
  })
  
  // 播放提示音
  playNotificationSound()
}

// 播放通知提示音
const playNotificationSound = () => {
  // 确保只在客户端执行
  if (typeof window !== 'undefined') {
    try {
      // 使用 Web Audio API 播放简单的提示音
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('播放提示音失败:', error)
    }
  }
}

// 加载通知
const loadNotifications = async () => {
  try {
    const response = await getNotifications()
    const newNotifications = response.data || []
    
    // 检查是否有新通知
    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0]
      if (latestNotification.id > lastNotificationId.value) {
        // 显示新通知的弹出
        showPopupNotification(latestNotification)
        lastNotificationId.value = latestNotification.id
        // 保存到localStorage，确保只在客户端执行
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastNotificationId', latestNotification.id.toString())
        }
        // 触发新通知事件
        emit('new-notification', latestNotification)
      }
    }
    
    notifications.value = newNotifications
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const response = await getUnreadCount()
    unreadCount.value = response.data.count || 0
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

// 标记全部已读
const markAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.value.filter(n => !n.read_status)
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification.id)
    }
    ElMessage.success('全部标记为已读')
    await loadNotifications()
    await loadUnreadCount()
  } catch (error) {
    console.error('标记全部已读失败:', error)
    ElMessage.error('标记失败')
  }
}

// 处理通知点击
const handleCommand = async (command) => {
  try {
    if (!command.read_status) {
      await markNotificationAsRead(command.id)
      await loadUnreadCount()
    }
    // 这里可以添加点击通知后的处理逻辑，比如跳转到相关页面
  } catch (error) {
    console.error('处理通知失败:', error)
  }
}

// 查看全部通知
const showAllNotifications = () => {
  // 这里可以跳转到通知列表页面
  console.log('查看全部通知')
}

// 轮询检查新通知
let pollingInterval = null

const startPolling = () => {
  // 每30秒检查一次新通知
  pollingInterval = setInterval(() => {
    loadNotifications()
    loadUnreadCount()
  }, 30000)
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// 初始化
onMounted(() => {
  loadNotifications()
  loadUnreadCount()
  startPolling()
})

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})

// 监听通知变化
const refreshNotifications = () => {
  loadNotifications()
  loadUnreadCount()
}

// 暴露刷新方法
defineExpose({
  refreshNotifications
})
</script>

<style scoped>
.notification-container {
  position: relative;
}

.notification-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.notification-header:hover {
  background-color: #f5f7fa;
}

.notification-icon {
  font-size: 20px;
  color: #606266;
}

.notification-dropdown {
  min-width: 300px;
  max-width: 400px;
  padding: 10px;
}

.notification-dropdown .notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0;
}

.notification-dropdown .notification-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9eb;
  font-weight: 500;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.notification-message {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.notification-footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.empty-notification {
  padding: 20px 0;
  text-align: center;
}
</style>