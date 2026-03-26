<template>
  <div class="ai-chat-page">
    <el-card class="page-card">
      <template #header>
        <div class="flex-between">
          <h3>AI 智能助手</h3>
          <el-button type="warning" @click="clearChat">
            <el-icon><Delete /></el-icon>
            清空对话
          </el-button>
        </div>
      </template>
      
      <!-- 对话区域 -->
      <div class="chat-container">
        <div class="chat-messages">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
          >
            <div class="message-avatar">
              <el-avatar :size="32">
                {{ message.role === 'user' ? '我' : 'AI' }}
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ message.timestamp }}</div>
            </div>
          </div>
          <div v-if="loading" class="loading-message">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>AI 正在思考...</span>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            placeholder="请输入您的问题..."
            :rows="3"
            :disabled="loading"
          />
          <div class="input-actions">
            <el-button 
              type="primary" 
              @click="sendMessage"
              :loading="loading"
              :disabled="!inputMessage.trim() || loading"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Loading } from '@element-plus/icons-vue'
import { aiApi } from '@/api/ai'

const messages = ref([
  {
    role: 'ai',
    content: '你好！我是农业灾害预警系统的AI助手，有什么可以帮助你的吗？',
    timestamp: new Date().toLocaleTimeString()
  }
])
const inputMessage = ref('')
const loading = ref(false)

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return
  
  // 添加用户消息到对话
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date().toLocaleTimeString()
  })
  
  inputMessage.value = ''
  loading.value = true
  
  try {
    const response = await aiApi.sendMessage({ message })
    if (response.code === 200) {
      // 添加AI回复到对话
      messages.value.push({
        role: 'ai',
        content: response.data,
        timestamp: new Date().toLocaleTimeString()
      })
    }
  } catch (error) {
    ElMessage.error('AI回复失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

// 清空对话
const clearChat = () => {
  messages.value = [
    {
      role: 'ai',
      content: '你好！我是农业灾害预警系统的AI助手，有什么可以帮助你的吗？',
      timestamp: new Date().toLocaleTimeString()
    }
  ]
}

// 页面挂载时的初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})
</script>

<style scoped>
.ai-chat-page {
  padding: 0;
}

.page-card {
  border-radius: 12px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #f5f7fa;
  position: relative;
}

.user-message .message-content {
  background-color: #409eff;
  color: #fff;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.loading-message {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #f5f7fa;
  font-size: 14px;
  color: #606266;
}

.chat-input-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>