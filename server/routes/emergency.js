const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const sequelize = require('../config/database')
const { Notification } = require('../models')
const { sendEmergencyPlanSMS, sendEmergencyCancelSMS, sendCommandSMS, sendAdminNotificationSMS } = require('../services/smsService')

const router = express.Router()

// 获取应急方案列表
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    const includeAll = req.query.includeAll === 'true' // 是否包含所有状态
    const planType = req.query.planType // 方案类型：plan（预案）、active（进行中）
    
    let whereClause = ''
    const replacements = []
    
    // 构建基础条件
    if (planType) {
      whereClause = 'WHERE plan_type = ?'
      replacements.push(planType)
    }
    
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
        if (whereClause) {
          whereClause += ' AND (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        } else {
          whereClause = 'WHERE (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        }
        replacements.push(`%${userRegion}%`, userRegion)
      } else {
        // 如果农户没有地区信息，不显示任何方案
        whereClause = 'WHERE 1=0'
      }
    }
    
    // 状态过滤
    if (!includeAll) {
      if (whereClause) {
        whereClause += ' AND status = "active"'
      } else {
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
        description,
        status,
        response_count,
        COALESCE(target_count, 0) as target_count,
        progress,
        plan_type,
        start_time,
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

// 创建预案
router.post('/plans/template', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { disaster_type, plan_name, priority, description } = req.body
    
    console.log('创建预案请求数据:', req.body)

    // 插入预案
    const [result] = await sequelize.query(`
      INSERT INTO emergency_plans 
      (user_id, disaster_type, plan_name, target_area, priority, description, status, plan_type, response_count, progress, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', 'plan', 0, 0, NOW(), NOW())
    `, {
      replacements: [userId, disaster_type, plan_name, '', priority, description]
    })

    res.json({
      code: 200,
      message: '预案创建成功',
      data: { id: result }
    })
  } catch (error) {
    console.error('创建预案失败:', error)
    console.error('错误详情:', error.stack)
    res.status(500).json({
      code: 500,
      message: '创建预案失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// 激活预案
router.post('/plans/:id/activate', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id
    const userId = req.user.id
    const { target_area } = req.body

    // 验证预案是否存在
    const [plans] = await sequelize.query(`
      SELECT id, plan_name, disaster_type, plan_type, priority, description
      FROM emergency_plans
      WHERE id = ? AND plan_type = 'plan'
    `, {
      replacements: [planId]
    })

    if (plans.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '预案不存在'
      })
    }

    const plan = plans[0]

    // 复制为新的进行中方案
    const [result] = await sequelize.query(`
      INSERT INTO emergency_plans 
      (user_id, disaster_type, plan_name, target_area, priority, description, status, plan_type, response_count, progress, start_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', 'active', 0, 0, NOW(), NOW(), NOW())
    `, {
      replacements: [userId, plan.disaster_type, plan.plan_name, target_area, plan.priority, plan.description]
    })

    const activePlanId = result

    // 查询目标地区的农户
    const [targetFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region, phone
      FROM users
      WHERE user_type = 'farmer' 
      AND region LIKE ?
    `, {
      replacements: [`%${target_area}%`]
    })

    // 尝试更新方案的目标人数
    const notifiedCount = targetFarmers.length
    await sequelize.query(`
      UPDATE emergency_plans 
      SET target_count = ?
      WHERE id = ?
    `, {
      replacements: [notifiedCount, activePlanId]
    })

    res.json({
      code: 200,
      message: `预案激活成功，将通知 ${notifiedCount} 位农户`,
      data: { 
        id: activePlanId,
        notified_count: notifiedCount,
        target_farmers: targetFarmers.map(f => ({
          id: f.id,
          name: f.real_name,
          region: f.region,
          phone: f.phone
        }))
      }
    })
  } catch (error) {
    console.error('激活预案失败:', error)
    res.status(500).json({
      code: 500,
      message: '激活预案失败',
      error: error.message
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
    const planId = req.query.plan_id
    
    let whereClause = ''
    const replacements = []
    
    // 如果指定了方案ID，只获取该方案的指令
    if (planId) {
      whereClause = 'WHERE plan_id = ?'
      replacements.push(planId)
    }
    
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
        if (whereClause) {
          whereClause += ' AND (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        } else {
          whereClause = 'WHERE (target_area LIKE ? OR ? LIKE CONCAT("%", target_area, "%"))'
        }
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
        target_count,
        completed_count,
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
    if (!plan_id || !target_area || !priority || !command_content) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段'
      })
    }

    // 验证方案是否存在且为进行中状态
    const [plans] = await sequelize.query(`
      SELECT id, plan_name, status, plan_type
      FROM emergency_plans
      WHERE id = ? AND plan_type = 'active' AND status = 'active'
    `, {
      replacements: [plan_id]
    })

    if (plans.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '方案不存在或未激活'
      })
    }

    // 插入指令
    const [result] = await sequelize.query(`
      INSERT INTO emergency_commands 
      (plan_id, target_area, priority, command_content, status, publish_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'published', NOW(), NOW(), NOW())
    `, {
      replacements: [plan_id, target_area, priority, command_content]
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

    // 更新指令的目标人数
    const targetCount = targetFarmers.length
    await sequelize.query(`
      UPDATE emergency_commands 
      SET target_count = ?
      WHERE id = ?
    `, {
      replacements: [targetCount, commandId]
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

    // 更新方案的目标人数和进度
    const [commandStats] = await sequelize.query(`
      SELECT 
        MAX(target_count) as max_target,
        MAX(completed_count) as max_completed
      FROM emergency_commands
      WHERE plan_id = ?
    `, {
      replacements: [plan_id]
    })

    if (commandStats[0].max_target > 0) {
      const progress = Math.round((commandStats[0].max_completed / commandStats[0].max_target) * 100)
      
      // 更新方案进度和目标人数
      await sequelize.query(`
        UPDATE emergency_plans 
        SET progress = ?, response_count = ?, target_count = ?
        WHERE id = ?
      `, {
        replacements: [progress, commandStats[0].max_completed, commandStats[0].max_target, plan_id]
      })
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
        user_id,
        executor,
        feedback_content,
        status,
        attachment_url,
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
    const { command_id, feedback_content, status, attachment_url } = req.body
    const executor = req.user.real_name
    const userId = req.user.id

    // 验证指令是否存在
    const [commands] = await sequelize.query(`
      SELECT id, plan_id, target_count, completed_count
      FROM emergency_commands
      WHERE id = ?
    `, {
      replacements: [command_id]
    })

    if (commands.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '指令不存在'
      })
    }

    const command = commands[0]

    // 检查用户是否已经提交过反馈
    const [existingFeedbacks] = await sequelize.query(`
      SELECT id
      FROM emergency_feedbacks
      WHERE command_id = ? AND user_id = ?
    `, {
      replacements: [command_id, userId]
    })

    if (existingFeedbacks.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '您已经提交过反馈，请勿重复提交'
      })
    }

    // 插入反馈
    const [result] = await sequelize.query(`
      INSERT INTO emergency_feedbacks 
      (command_id, user_id, executor, feedback_content, status, attachment_url, feedback_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `, {
      replacements: [command_id, userId, executor, feedback_content, status, attachment_url]
    })

    // 更新指令的完成人数
    await sequelize.query(`
      UPDATE emergency_commands 
      SET completed_count = completed_count + 1
      WHERE id = ?
    `, {
      replacements: [command_id]
    })

    // 检查是否所有农户都已响应
    const [updatedCommand] = await sequelize.query(`
      SELECT target_count, completed_count
      FROM emergency_commands
      WHERE id = ?
    `, {
      replacements: [command_id]
    })

    if (updatedCommand[0] && updatedCommand[0].target_count > 0 && updatedCommand[0].completed_count >= updatedCommand[0].target_count) {
      // 所有农户都已响应，更新指令状态为已完成
      await sequelize.query(`
        UPDATE emergency_commands 
        SET status = 'completed'
        WHERE id = ?
      `, {
        replacements: [command_id]
      })
    }

    // 更新方案的进度
    if (command.plan_id) {
      // 计算方案下所有指令的完成情况
      const [commandStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_commands,
          MAX(target_count) as max_target,
          MAX(completed_count) as max_completed
        FROM emergency_commands
        WHERE plan_id = ?
      `, {
        replacements: [command.plan_id]
      })

      if (commandStats[0].max_target > 0) {
        const progress = Math.round((commandStats[0].max_completed / commandStats[0].max_target) * 100)
        
        // 更新方案进度和目标人数
        await sequelize.query(`
          UPDATE emergency_plans 
          SET progress = ?, response_count = ?, target_count = ?
          WHERE id = ?
        `, {
          replacements: [progress, commandStats[0].max_completed, commandStats[0].max_target, command.plan_id]
        })
      }
    }

    // 通知管理员
    try {
      // 查询系统中的管理员用户
      const [admins] = await sequelize.query(`
        SELECT id, username, real_name, phone
        FROM users
        WHERE user_type = 'admin'
      `)
      
      if (admins.length > 0) {
        // 发送短信通知管理员
        const smsResult = await sendAdminNotificationSMS(admins, {
          executor: executor,
          feedback_content: feedback_content
        })
        console.log(`通知管理员: ${admins.length} 位管理员已收到农户反馈通知，短信发送${smsResult.success}条`)
        
        // 创建系统通知
        await Notification.create({
          title: '农户完成指令通知',
          content: `农户${executor}已完成指令，反馈内容：${feedback_content}`,
          type: 'success',
          user_id: null, // 空值表示所有管理员都能看到
          read_status: false
        })
        console.log('系统通知创建成功')
      }
    } catch (notificationError) {
      console.error('通知管理员失败:', notificationError.message)
    }

    res.json({
      code: 200,
      message: '反馈提交成功，已通知管理员',
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
          updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [planId]
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

// 完成应急方案
router.post('/plans/:id/complete', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id
    const { feedback } = req.body
    const userType = req.user.user_type
    const executor = req.user.real_name

    // 农户和管理员都可以完成方案
    if (userType !== 'farmer' && userType !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权完成应急方案'
      })
    }

    // 获取方案信息
    const [plans] = await sequelize.query(`
      SELECT id, plan_name, target_area, disaster_type
      FROM emergency_plans
      WHERE id = ? AND status = 'active'
    `, {
      replacements: [planId]
    })

    if (plans.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '方案不存在或已完成'
      })
    }

    const plan = plans[0]

    // 更新方案状态为已完成
    await sequelize.query(`
      UPDATE emergency_plans
      SET status = 'completed',
          progress = 100,
          updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [planId]
    })

    // 记录完成反馈
    if (feedback) {
      await sequelize.query(`
        INSERT INTO emergency_feedbacks 
        (command_id, executor, feedback_content, status, feedback_time, created_at, updated_at)
        VALUES (?, ?, ?, 'completed', NOW(), NOW(), NOW())
      `, {
        replacements: [null, executor, feedback]
      })
    }

    // 创建通知给管理员
    await Notification.create({
      title: '应急方案完成通知',
      content: `农户 ${executor} 已完成应急方案：${plan.plan_name}`,
      type: 'emergency_plan',
      user_id: null, // 空值表示所有管理员都能看到
      read_status: false
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

    // 发送短信通知（可选）
    // 这里可以添加完成通知的短信发送逻辑

    const notifiedCount = targetFarmers.length

    res.json({
      code: 200,
      message: `方案已完成，已通知 ${notifiedCount} 位农户`,
      data: {
        id: planId,
        notified_count: notifiedCount,
        executor: executor
      }
    })
  } catch (error) {
    console.error('完成方案失败:', error)
    res.status(500).json({
      code: 500,
      message: '完成方案失败',
      error: error.message
    })
  }
})

module.exports = router