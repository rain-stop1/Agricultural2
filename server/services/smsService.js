/**
 * 短信服务
 * 
 * 当前为模拟模式，不实际发送短信
 * 如需真实发送，可替换为阿里云、腾讯云等短信服务
 */

const sequelize = require('../config/database')

// 短信模板
const SMS_TEMPLATES = {
  EMERGENCY_PLAN: {
    code: 'EMERGENCY_PLAN',
    content: '【农业预警】紧急通知：{plan_name}已启动，灾害类型：{disaster_type}，请及时查看系统并采取应对措施。'
  },
  EMERGENCY_CANCEL: {
    code: 'EMERGENCY_CANCEL',
    content: '【农业预警】通知：{plan_name}已取消。取消原因：{reason}。'
  },
  EMERGENCY_COMMAND: {
    code: 'EMERGENCY_COMMAND',
    content: '【农业预警】紧急指令：{content}。请立即执行。'
  },
  DISASTER_WARNING: {
    code: 'DISASTER_WARNING',
    content: '【农业预警】您的地块所在区域发布{disaster_type}预警，请注意防范。'
  }
}

/**
 * 发送短信（模拟）
 * @param {string} phone - 手机号
 * @param {string} templateCode - 模板代码
 * @param {object} params - 模板参数
 * @returns {Promise<object>} 发送结果
 */
async function sendSMS(phone, templateCode, params = {}) {
  try {
    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('手机号格式不正确')
    }

    // 获取模板
    const template = SMS_TEMPLATES[templateCode]
    if (!template) {
      throw new Error(`短信模板不存在: ${templateCode}`)
    }

    // 替换模板参数
    let content = template.content
    Object.keys(params).forEach(key => {
      content = content.replace(`{${key}}`, params[key])
    })

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    // 记录到数据库
    const [result] = await sequelize.query(`
      INSERT INTO sms_records 
      (phone, template_code, content, params, status, send_time, created_at)
      VALUES (?, ?, ?, ?, 'success', NOW(), NOW())
    `, {
      replacements: [
        phone,
        templateCode,
        content,
        JSON.stringify(params),
      ]
    })

    console.log(`[短信模拟] 发送成功`)
    console.log(`  手机号: ${phone}`)
    console.log(`  内容: ${content}`)

    return {
      success: true,
      messageId: `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      content,
      recordId: result
    }
  } catch (error) {
    console.error('[短信模拟] 发送失败:', error.message)
    
    // 记录失败
    try {
      await sequelize.query(`
        INSERT INTO sms_records 
        (phone, template_code, content, params, status, error_message, send_time, created_at)
        VALUES (?, ?, ?, ?, 'failed', ?, NOW(), NOW())
      `, {
        replacements: [
          phone,
          templateCode,
          '',
          JSON.stringify(params),
          error.message
        ]
      })
    } catch (dbError) {
      console.error('[短信模拟] 记录失败日志出错:', dbError.message)
    }

    return {
      success: false,
      error: error.message,
      phone
    }
  }
}

/**
 * 批量发送短信
 * @param {Array<string>} phones - 手机号列表
 * @param {string} templateCode - 模板代码
 * @param {object} params - 模板参数
 * @returns {Promise<object>} 发送结果统计
 */
async function sendBatchSMS(phones, templateCode, params = {}) {
  const results = {
    total: phones.length,
    success: 0,
    failed: 0,
    details: []
  }

  for (const phone of phones) {
    const result = await sendSMS(phone, templateCode, params)
    
    if (result.success) {
      results.success++
    } else {
      results.failed++
    }
    
    results.details.push(result)
  }

  console.log(`[短信批量发送] 总计: ${results.total}, 成功: ${results.success}, 失败: ${results.failed}`)

  return results
}

/**
 * 发送应急方案通知短信
 * @param {Array<object>} farmers - 农户列表 [{phone, real_name}]
 * @param {object} plan - 应急方案信息
 * @returns {Promise<object>} 发送结果
 */
async function sendEmergencyPlanSMS(farmers, plan) {
  const phones = farmers.filter(f => f.phone).map(f => f.phone)
  
  if (phones.length === 0) {
    console.log('[短信通知] 没有有效的手机号')
    return { total: 0, success: 0, failed: 0 }
  }

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

  return await sendBatchSMS(phones, 'EMERGENCY_PLAN', {
    plan_name: plan.plan_name,
    disaster_type: disasterTypeMap[plan.disaster_type] || plan.disaster_type
  })
}

/**
 * 发送应急方案取消通知短信
 * @param {Array<object>} farmers - 农户列表
 * @param {object} plan - 应急方案信息
 * @returns {Promise<object>} 发送结果
 */
async function sendEmergencyCancelSMS(farmers, plan) {
  const phones = farmers.filter(f => f.phone).map(f => f.phone)
  
  if (phones.length === 0) {
    return { total: 0, success: 0, failed: 0 }
  }

  return await sendBatchSMS(phones, 'EMERGENCY_CANCEL', {
    plan_name: plan.plan_name,
    reason: plan.cancel_reason || '情况已解除'
  })
}

/**
 * 发送区域指令短信
 * @param {Array<object>} farmers - 农户列表
 * @param {object} command - 指令信息
 * @returns {Promise<object>} 发送结果
 */
async function sendCommandSMS(farmers, command) {
  const phones = farmers.filter(f => f.phone).map(f => f.phone)
  
  if (phones.length === 0) {
    return { total: 0, success: 0, failed: 0 }
  }

  return await sendBatchSMS(phones, 'EMERGENCY_COMMAND', {
    content: command.command_content
  })
}

module.exports = {
  sendSMS,
  sendBatchSMS,
  sendEmergencyPlanSMS,
  sendEmergencyCancelSMS,
  sendCommandSMS,
  SMS_TEMPLATES
}
