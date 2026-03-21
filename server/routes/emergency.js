const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const sequelize = require('../config/database')
const { sendEmergencyPlanSMS, sendEmergencyCancelSMS, sendCommandSMS } = require('../services/smsService')

const router = express.Router()

// 获取应急方案列表
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    const includeAll = req.query.includeAll === 'true' // 是否包含所有状态
    
    let whereClause = ''
    const replacements = []
    
    // 农户只能看到目标区域匹配自己地区的应急方案
    if (userType === 'farmer') {
      // 获取农户的地区信息
      const [users] = await sequelize.query(`
        SELECT region FROM users WHERE id = ?
      `, {
        replacements: [userId]
      })
      
      if (users.length > 0 && users[0].region) {
        const userRegion = users[0].region
        // 双向匹配：目标区域包含用户地区 OR 用户地区包含目标区域
        if (includeAll) {
          // 包含所有状态（用于通知检测）
          whereClause = 'WHERE (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        } else {
          // 只显示状态为 active 的方案
          whereClause = 'WHERE (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%")) AND status = "active"'
        }
        replacements.push(`%${userRegion}%`, userRegion)
      } else {
        // 如果农户没有地区信息，不显示任何方案
        whereClause = 'WHERE 1=0'
      }
    } else {
      // 管理员
      if (includeAll) {
        // 包含所有状态
        whereClause = ''
      } else {
        // 只显示状态为 active 的方案
        whereClause = 'WHERE status = "active"'
      }
    }
    
    const [plans] = await sequelize.query(`
      SELECT 
        id,
        user_id,
        disaster_type,
        plan_name,
        target_area,
        priority,
        status,
        response_count,
        progress,
        start_time,
        cancel_reason,
        cancel_time,
        created_at
      FROM emergency_plans
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      replacements
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: plans
    })
  } catch (error) {
    console.error('获取应急方案失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取应急方案失败'
    })
  }
})

// 启动应急方案
router.post('/plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { disaster_type, plan_name, target_area, priority, description } = req.body

    // 插入应急方案
    const [result] = await sequelize.query(`
      INSERT INTO emergency_plans 
      (user_id, disaster_type, plan_name, target_area, priority, description, status, response_count, progress, start_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', 0, 0, NOW(), NOW(), NOW())
    `, {
      replacements: [userId, disaster_type, plan_name, target_area, priority, description]
    })

    const planId = result

    // 查询目标地区的农户
    // 支持省级和市级匹配
    const [targetFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region
      FROM users
      WHERE user_type = 'farmer' 
      AND region LIKE ?
    `, {
      replacements: [`%${target_area}%`]
    })

    // 为每个目标农户创建通知记录（可以扩展为通知表）
    let notifiedCount = 0
    let smsResult = { total: 0, success: 0, failed: 0 }
    
    if (targetFarmers.length > 0) {
      // 这里可以创建通知记录或发送消息
      // 暂时只统计数量，后续可以扩展通知功能
      notifiedCount = targetFarmers.length
      
      // 发送短信通知
      try {
        smsResult = await sendEmergencyPlanSMS(targetFarmers, {
          plan_name,
          disaster_type
        })
        console.log(`短信发送结果: 成功${smsResult.success}条, 失败${smsResult.failed}条`)
      } catch (smsError) {
        console.error('发送短信失败:', smsError.message)
      }
      
      // 尝试更新方案的目标人数（如果字段存在）
      try {
        await sequelize.query(`
          UPDATE emergency_plans 
          SET target_count = ?
          WHERE id = ?
        `, {
          replacements: [notifiedCount, planId]
        })
      } catch (updateError) {
        // 如果 target_count 字段不存在，忽略错误
        console.warn('更新 target_count 失败（字段可能不存在）:', updateError.message)
      }
    }

    res.json({
      code: 200,
      message: `应急方案启动成功，已通知 ${notifiedCount} 位农户${smsResult.total > 0 ? `，短信发送${smsResult.success}条` : ''}`,
      data: { 
        id: planId,
        notified_count: notifiedCount,
        sms_sent: smsResult.success,
        target_farmers: targetFarmers.map(f => ({
          id: f.id,
          name: f.real_name,
          region: f.region,
          phone: f.phone
        }))
      }
    })
  } catch (error) {
    console.error('启动应急方案失败:', error)
    res.status(500).json({
      code: 500,
      message: '启动应急方案失败',
      error: error.message
    })
  }
})

// 获取指令列表
router.get('/commands', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    
    let whereClause = ''
    const replacements = []
    
    // 农户只能看到目标区域匹配自己地区的指令
    if (userType === 'farmer') {
      // 获取农户的地区信息
      const [users] = await sequelize.query(`
        SELECT region FROM users WHERE id = ?
      `, {
        replacements: [userId]
      })
      
      if (users.length > 0 && users[0].region) {
        const userRegion = users[0].region
        // 双向匹配：目标区域包含用户地区 OR 用户地区包含目标区域
        whereClause = 'WHERE (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        replacements.push(`%${userRegion}%`, userRegion)
      } else {
        // 如果农户没有地区信息，不显示任何指令
        whereClause = 'WHERE 1=0'
      }
    }
    
    const [commands] = await sequelize.query(`
      SELECT 
        id,
        plan_id,
        target_area,
        priority,
        command_content,
        status,
        publish_time,
        created_at
      FROM emergency_commands
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `, {
      replacements
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: commands
    })
  } catch (error) {
    console.error('获取指令列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取指令列表失败'
    })
  }
})

// 发布指令
router.post('/commands', authenticateToken, async (req, res) => {
  try {
    const { plan_id, target_area, priority, command_content } = req.body

    // 验证必填字段
    if (!target_area || !priority || !command_content) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段'
      })
    }

    // 插入指令
    const [result] = await sequelize.query(`
      INSERT INTO emergency_commands 
      (plan_id, target_area, priority, command_content, status, publish_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'published', NOW(), NOW(), NOW())
    `, {
      replacements: [plan_id || null, target_area, priority, command_content]
    })

    const commandId = result

    // 查询目标地区的农户（包含手机号）
    const [targetFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region, phone
      FROM users
      WHERE user_type = 'farmer' 
      AND region LIKE ?
    `, {
      replacements: [`%${target_area}%`]
    })

    // 发送短信通知
    let smsResult = { total: 0, success: 0, failed: 0 }
    if (targetFarmers.length > 0) {
      try {
        smsResult = await sendCommandSMS(targetFarmers, {
          command_content
        })
        console.log(`指令通知短信发送结果: 成功${smsResult.success}条, 失败${smsResult.failed}条`)
      } catch (smsError) {
        console.error('发送指令通知短信失败:', smsError.message)
      }
    }

    const notifiedCount = targetFarmers.length

    res.json({
      code: 200,
      message: `指令发布成功，已通知 ${notifiedCount} 位农户${smsResult.total > 0 ? `，短信发送${smsResult.success}条` : ''}`,
      data: { 
        id: commandId,
        notified_count: notifiedCount,
        sms_sent: smsResult.success,
        target_farmers: targetFarmers.map(f => ({
          id: f.id,
          name: f.real_name,
          region: f.region,
          phone: f.phone
        }))
      }
    })
  } catch (error) {
    console.error('发布指令失败:', error)
    res.status(500).json({
      code: 500,
      message: '发布指令失败',
      error: error.message
    })
  }
})

// 获取执行反馈列表
router.get('/feedbacks', authenticateToken, async (req, res) => {
  try {
    const [feedbacks] = await sequelize.query(`
      SELECT 
        id,
        command_id,
        executor,
        feedback_content,
        status,
        feedback_time,
        created_at
      FROM emergency_feedbacks
      ORDER BY created_at DESC
      LIMIT 50
    `)

    res.json({
      code: 200,
      message: '获取成功',
      data: feedbacks
    })
  } catch (error) {
    console.error('获取执行反馈失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取执行反馈失败'
    })
  }
})

// 提交执行反馈
router.post('/feedbacks', authenticateToken, async (req, res) => {
  try {
    const { command_id, feedback_content, status } = req.body
    const executor = req.user.real_name

    const [result] = await sequelize.query(`
      INSERT INTO emergency_feedbacks 
      (command_id, executor, feedback_content, status, feedback_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())
    `, {
      replacements: [command_id, executor, feedback_content, status]
    })

    res.json({
      code: 200,
      message: '反馈提交成功',
      data: { id: result }
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    res.status(500).json({
      code: 500,
      message: '提交反馈失败'
    })
  }
})

// 取消应急方案
router.post('/plans/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id
    const { reason } = req.body
    const userType = req.user.user_type

    // 只有管理员可以取消方案
    if (userType !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '只有管理员可以取消应急方案'
      })
    }

    // 验证取消原因
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        code: 400,
        message: '请输入取消原因'
      })
    }

    // 获取方案信息
    const [plans] = await sequelize.query(`
      SELECT id, plan_name, target_area, disaster_type
      FROM emergency_plans
      WHERE id = ?
    `, {
      replacements: [planId]
    })

    if (plans.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '方案不存在'
      })
    }

    const plan = plans[0]

    // 更新方案状态为已取消
    await sequelize.query(`
      UPDATE emergency_plans
      SET status = 'cancelled',
          cancel_reason = ?,
          cancel_time = NOW(),
          updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [reason, planId]
    })

    // 查询目标区域的农户（包含手机号）
    const [targetFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region, phone
      FROM users
      WHERE user_type = 'farmer' 
      AND (region LIKE ? OR ? LIKE CONCAT("%", region, "%"))
    `, {
      replacements: [`%${plan.target_area}%`, plan.target_area]
    })

    // 发送短信通知
    let smsResult = { total: 0, success: 0, failed: 0 }
    if (targetFarmers.length > 0) {
      try {
        smsResult = await sendEmergencyCancelSMS(targetFarmers, {
          plan_name: plan.plan_name,
          cancel_reason: reason
        })
        console.log(`取消通知短信发送结果: 成功${smsResult.success}条, 失败${smsResult.failed}条`)
      } catch (smsError) {
        console.error('发送取消通知短信失败:', smsError.message)
      }
    }

    const notifiedCount = targetFarmers.length

    res.json({
      code: 200,
      message: `方案已取消，已通知 ${notifiedCount} 位农户${smsResult.total > 0 ? `，短信发送${smsResult.success}条` : ''}`,
      data: {
        id: planId,
        notified_count: notifiedCount,
        sms_sent: smsResult.success,
        cancel_reason: reason
      }
    })
  } catch (error) {
    console.error('取消方案失败:', error)
    res.status(500).json({
      code: 500,
      message: '取消方案失败',
      error: error.message
    })
  }
})

module.exports = router