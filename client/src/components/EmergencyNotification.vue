<template>
  <!-- 这是一个无界面组件，只负责检查和显示通知 -->
  <div style="display: none;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getEmergencyPlans, getCommands } from '@/api/emergency'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const userStore = useUserStore()
const router = useRouter()

// 检查间隔（30秒）
const CHECK_INTERVAL = 10000

// 上次检查的时间戳
const lastCheckTime = ref(new Date())

// 上次检查时的方案状态
const lastPlansStatus = ref(new Map())

// 定时器
let timer = null

// 检查新的应急方案
const checkNewEmergencyPlans = async () => {
  try {
    // 获取所有状态的方案（包括已取消的）
    const response = await fetch('/api/emergency/plans?includeAll=true', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    const data = await response.json()
    
    if (data.code === 200 && data.data) {
      const plans = data.data
      
      // 筛选出在上次检查后创建的方案
      const newPlans = plans.filter(plan => {
        const createdAt = new Date(plan.created_at)
        return createdAt > lastCheckTime.value && plan.status === 'active'
      })

      // 筛选出在上次检查后状态变为取消的方案
      const statusChangedCancelledPlans = plans.filter(plan => {
        const lastStatus = lastPlansStatus.value.get(plan.id)
        return lastStatus === 'active' && plan.status === 'cancelled'
      })

      // 显示新方案通知
      newPlans.forEach(plan => {
        showEmergencyPlanNotification(plan)
      })

      // 显示取消通知
      statusChangedCancelledPlans.forEach(plan => {
        showCancelNotification(plan)
      })

      // 更新方案状态映射
      const currentPlansStatus = new Map()
      plans.forEach(plan => {
        currentPlansStatus.set(plan.id, plan.status)
      })
      lastPlansStatus.value = currentPlansStatus

      // 如果有新消息，触发应急响应页面刷新
      if (newPlans.length > 0 || statusChangedCancelledPlans.length > 0) {
        userStore.triggerEmergencyRefresh()
      }
    }
  } catch (error) {
    console.error('检查应急方案失败:', error)
  }
}

// 检查新的指令和反馈
const checkNewCommands = async () => {
  try {
    const [commandsRes, feedbacksRes] = await Promise.all([
      getCommands(),
      fetch('/api/emergency/feedbacks', {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }).then(res => res.json())
    ])
    
    // 检查新的指令
    if (commandsRes.code === 200 && commandsRes.data) {
      const commands = commandsRes.data
      
      // 筛选出在上次检查后创建的指令
      const newCommands = commands.filter(command => {
        const createdAt = new Date(command.created_at)
        return createdAt > lastCheckTime.value
      })

      // 显示通知
      newCommands.forEach(command => {
        showCommandNotification(command)
      })

      // 如果有新指令，触发应急响应页面刷新
      if (newCommands.length > 0) {
        userStore.triggerEmergencyRefresh()
      }
    }
    
    // 检查新的反馈（管理员端）
    if (userStore.user?.user_type === 'admin' && feedbacksRes.code === 200 && feedbacksRes.data) {
      const feedbacks = feedbacksRes.data
      
      // 筛选出在上次检查后创建的反馈
      const newFeedbacks = feedbacks.filter(feedback => {
        const createdAt = new Date(feedback.created_at)
        return createdAt > lastCheckTime.value
      })

      // 如果有新反馈，触发应急响应页面刷新
      if (newFeedbacks.length > 0) {
        userStore.triggerEmergencyRefresh()
      }
    }
  } catch (error) {
    console.error('检查指令和反馈失败:', error)
  }
}

// 显示应急方案通知
const showEmergencyPlanNotification = (plan) => {
  const disasterTypeMap = {
    drought: '干旱',
    flood: '洪涝',
    freeze: '冻害',
    heat: '高温',
    wind: '大风',
    pest: '病虫害',
    typhoon: '台风',
    hail: '冰雹'
  }

  const priorityMap = {
    urgent: '紧急',
    important: '重要',
    normal: '普通'
  }

  // 检查是否为农户用户
  const isFarmer = userStore.user?.user_type === 'farmer'

  // 构建通知内容
  let messageContent = `
    <div style="line-height: 1.8;">
      <p style="margin: 8px 0; font-size: 15px; font-weight: bold; color: #303133;">
        ${plan.plan_name}
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">灾害类型：</span>
        <span style="color: #f56c6c; font-weight: bold;">${disasterTypeMap[plan.disaster_type] || plan.disaster_type}</span>
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">优先级：</span>
        <span style="color: ${plan.priority === 'urgent' ? '#f56c6c' : '#e6a23c'}; font-weight: bold;">
          ${priorityMap[plan.priority] || plan.priority}
        </span>
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">目标区域：</span>${plan.target_area}
      </p>
      <p style="margin: 8px 0 4px; font-size: 13px; color: #909399;">
        请及时查看详情并采取相应措施
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #c0c4cc;">
        ${dayjs(plan.created_at).format('YYYY-MM-DD HH:mm:ss')}
      </p>
  `

  // 如果是农户，添加确认按钮
  if (isFarmer) {
    messageContent += `
      <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
        <button style="background-color: #67c23a; color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 12px; cursor: pointer;" id="confirm-btn-plan-${plan.id}">
          确认
        </button>
      </div>
    `
  }

  messageContent += `</div>`

  // 显示通知
  const notification = ElNotification({
    title: '🚨 新的应急方案',
    dangerouslyUseHTMLString: true,
    message: messageContent,
    type: plan.priority === 'urgent' ? 'error' : 'warning',
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: !isFarmer, // 农户端不显示关闭按钮，只能通过确认按钮关闭
    onClick: () => {
      // 点击通知跳转到应急响应页面
      router.push('/emergency')
    }
  })

  // 如果是农户，添加确认按钮的点击事件
  if (isFarmer) {
    // 延迟执行，确保DOM已经渲染
    setTimeout(() => {
      const confirmBtn = document.getElementById(`confirm-btn-plan-${plan.id}`)
      if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
          e.stopPropagation() // 阻止事件冒泡，避免触发通知的点击事件
          notification.close() // 关闭通知
        })
      }
    }, 100)
  }

  // 播放提示音（可选）
  playNotificationSound()
}

// 显示指令通知
const showCommandNotification = (command) => {
  const priorityMap = {
    urgent: '紧急',
    important: '重要',
    normal: '普通'
  }

  // 检查是否为农户用户
  const isFarmer = userStore.user?.user_type === 'farmer'

  // 构建通知内容
  let messageContent = `
    <div style="line-height: 1.8;">
      <p style="margin: 8px 0; color: #606266;">
        <span style="color: #909399;">优先级：</span>
        <span style="color: ${command.priority === 'urgent' ? '#f56c6c' : '#e6a23c'}; font-weight: bold;">
          ${priorityMap[command.priority] || command.priority}
        </span>
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">目标区域：</span>${command.target_area}
      </p>
      <p style="margin: 8px 0; padding: 12px; background: #f5f7fa; border-radius: 4px; color: #303133; font-size: 14px;">
        ${command.command_content}
      </p>
      <p style="margin: 8px 0 4px; font-size: 13px; color: #909399;">
        请立即查看并执行
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #c0c4cc;">
        ${dayjs(command.created_at).format('YYYY-MM-DD HH:mm:ss')}
      </p>
  `

  // 如果是农户，添加确认按钮
  if (isFarmer) {
    messageContent += `
      <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
        <button style="background-color: #67c23a; color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 12px; cursor: pointer;" id="confirm-btn-${command.id}">
          确认
        </button>
      </div>
    `
  }

  messageContent += `</div>`

  // 显示通知
  const notification = ElNotification({
    title: '📢 新的区域指令',
    dangerouslyUseHTMLString: true,
    message: messageContent,
    type: command.priority === 'urgent' ? 'error' : 'warning',
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: !isFarmer, // 农户端不显示关闭按钮，只能通过确认按钮关闭
    onClick: () => {
      // 点击通知跳转到应急响应页面
      router.push('/emergency')
    }
  })

  // 如果是农户，添加确认按钮的点击事件
  if (isFarmer) {
    // 延迟执行，确保DOM已经渲染
    setTimeout(() => {
      const confirmBtn = document.getElementById(`confirm-btn-${command.id}`)
      if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
          e.stopPropagation() // 阻止事件冒泡，避免触发通知的点击事件
          notification.close() // 关闭通知
        })
      }
    }, 100)
  }

  // 播放提示音（可选）
  playNotificationSound()
}

// 显示取消通知
const showCancelNotification = (plan) => {
  const disasterTypeMap = {
    drought: '干旱',
    flood: '洪涝',
    freeze: '冻害',
    heat: '高温',
    wind: '大风',
    pest: '病虫害',
    typhoon: '台风',
    hail: '冰雹'
  }

  // 检查是否为农户用户
  const isFarmer = userStore.user?.user_type === 'farmer'

  // 构建通知内容
  let messageContent = `
    <div style="line-height: 1.8;">
      <p style="margin: 8px 0; font-size: 15px; font-weight: bold; color: #303133;">
        ${plan.plan_name}
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">灾害类型：</span>
        <span style="color: #67c23a; font-weight: bold;">${disasterTypeMap[plan.disaster_type] || plan.disaster_type}</span>
      </p>
      <p style="margin: 4px 0; color: #606266;">
        <span style="color: #909399;">目标区域：</span>${plan.target_area}
      </p>
      ${plan.cancel_reason ? `
        <p style="margin: 8px 0; padding: 12px; background: #f0f9ff; border-left: 3px solid #409eff; color: #303133; font-size: 13px;">
          <strong>取消原因：</strong>${plan.cancel_reason}
        </p>
      ` : ''}
      <p style="margin: 8px 0 4px; font-size: 13px; color: #67c23a;">
        该应急方案已取消，无需继续执行
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #c0c4cc;">
        ${dayjs(plan.updated_at || plan.created_at).format('YYYY-MM-DD HH:mm:ss')}
      </p>
  `

  // 如果是农户，添加确认按钮
  if (isFarmer) {
    messageContent += `
      <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
        <button style="background-color: #67c23a; color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 12px; cursor: pointer;" id="confirm-btn-cancel-${plan.id}">
          确认
        </button>
      </div>
    `
  }

  messageContent += `</div>`

  // 显示通知
  const notification = ElNotification({
    title: '✅ 应急方案已取消',
    dangerouslyUseHTMLString: true,
    message: messageContent,
    type: 'success',
    duration: 0, // 不自动关闭
    position: 'top-right',
    showClose: !isFarmer, // 农户端不显示关闭按钮，只能通过确认按钮关闭
    onClick: () => {
      // 点击通知跳转到应急响应页面
      router.push('/emergency')
    }
  })

  // 如果是农户，添加确认按钮的点击事件
  if (isFarmer) {
    // 延迟执行，确保DOM已经渲染
    setTimeout(() => {
      const confirmBtn = document.getElementById(`confirm-btn-cancel-${plan.id}`)
      if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
          e.stopPropagation() // 阻止事件冒泡，避免触发通知的点击事件
          notification.close() // 关闭通知
        })
      }
    }, 100)
  }

  // 播放提示音（可选）
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

// 执行检查
const performCheck = async () => {
  await Promise.all([
    checkNewEmergencyPlans(),
    checkNewCommands()
  ])
  
  // 更新最后检查时间
  lastCheckTime.value = new Date()
}

// 启动定时检查
const startPolling = async () => {
  // 立即执行一次检查（但不显示通知，只更新时间戳和状态）
  await initializePlanStatus()
  
  // 设置定时器
  timer = setInterval(performCheck, CHECK_INTERVAL)
  
  console.log('应急通知轮询已启动，检查间隔:', CHECK_INTERVAL / 1000, '秒')
}

// 初始化方案状态
const initializePlanStatus = async () => {
  try {
    // 获取所有状态的方案（包括已取消的）
    const response = await fetch('/api/emergency/plans?includeAll=true', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    const data = await response.json()
    
    if (data.code === 200 && data.data) {
      const plans = data.data
      
      // 初始化方案状态映射
      const currentPlansStatus = new Map()
      plans.forEach(plan => {
        currentPlansStatus.set(plan.id, plan.status)
      })
      lastPlansStatus.value = currentPlansStatus
      
      // 更新最后检查时间
      lastCheckTime.value = new Date()
      
      console.log('方案状态初始化完成，共记录', plans.length, '个方案')
    }
  } catch (error) {
    console.error('初始化方案状态失败:', error)
  }
}

// 停止定时检查
const stopPolling = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
    console.log('应急通知轮询已停止')
  }
}

// 组件挂载时启动
onMounted(async () => {
  // 农户和管理员都启动轮询
  if (userStore.user?.user_type === 'farmer' || userStore.user?.user_type === 'admin') {
    await startPolling()
  }
})

// 组件卸载时停止
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
/* 无样式 */
</style>
