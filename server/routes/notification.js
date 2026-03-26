const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const sequelize = require('../config/database')

const router = express.Router()

// 获取通知列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    
    let whereClause = ''
    const replacements = []
    
    // 管理员可以看到所有通知（user_id为null的通知），也可以看到发给自己的通知
    if (userType === 'admin') {
      whereClause = 'WHERE user_id IS NULL OR user_id = ?'
      replacements.push(userId)
    } else {
      // 普通用户只能看到发给自己的通知
      whereClause = 'WHERE user_id = ?'
      replacements.push(userId)
    }
    
    const [notifications] = await sequelize.query(`
      SELECT 
        id, 
        title, 
        content, 
        type, 
        user_id, 
        read_status, 
        created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `, {
      replacements
    })
    
    res.json({
      code: 200,
      message: '获取通知成功',
      data: notifications || []
    })
  } catch (error) {
    console.error('获取通知失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取通知失败'
    })
  }
})

// 标记通知为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id
    const userId = req.user.id
    const userType = req.user.user_type
    
    // 验证通知是否存在且用户有权限
    const [notifications] = await sequelize.query(`
      SELECT id
      FROM notifications
      WHERE id = ? AND (user_id IS NULL OR user_id = ?)
    `, {
      replacements: [notificationId, userId]
    })
    
    if (notifications.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '通知不存在或无权限'
      })
    }
    
    // 标记为已读
    await sequelize.query(`
      UPDATE notifications
      SET read_status = TRUE
      WHERE id = ?
    `, {
      replacements: [notificationId]
    })
    
    res.json({
      code: 200,
      message: '标记已读成功'
    })
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({
      code: 500,
      message: '标记已读失败'
    })
  }
})

// 删除通知
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id
    const userId = req.user.id
    const userType = req.user.user_type
    
    // 验证通知是否存在且用户有权限
    const [notifications] = await sequelize.query(`
      SELECT id
      FROM notifications
      WHERE id = ? AND (user_id IS NULL OR user_id = ?)
    `, {
      replacements: [notificationId, userId]
    })
    
    if (notifications.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '通知不存在或无权限'
      })
    }
    
    // 删除通知
    await sequelize.query(`
      DELETE FROM notifications
      WHERE id = ?
    `, {
      replacements: [notificationId]
    })
    
    res.json({
      code: 200,
      message: '删除通知成功'
    })
  } catch (error) {
    console.error('删除通知失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除通知失败'
    })
  }
})

// 获取未读通知数量
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    
    let whereClause = ''
    const replacements = []
    
    // 管理员可以看到所有通知（user_id为null的通知），也可以看到发给自己的通知
    if (userType === 'admin') {
      whereClause = 'WHERE read_status = FALSE AND (user_id IS NULL OR user_id = ?)'
      replacements.push(userId)
    } else {
      // 普通用户只能看到发给自己的通知
      whereClause = 'WHERE read_status = FALSE AND user_id = ?'
      replacements.push(userId)
    }
    
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM notifications
      ${whereClause}
    `, {
      replacements
    })
    
    res.json({
      code: 200,
      message: '获取未读数量成功',
      data: {
        count: result && result[0] ? result[0].count : 0
      }
    })
  } catch (error) {
    console.error('获取未读数量失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取未读数量失败'
    })
  }
})

module.exports = router