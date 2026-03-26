const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const sequelize = require('../config/database')

const router = express.Router()

// 获取资源列表
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    const { type } = req.query

    let whereClause = 'WHERE 1=1'
    const replacements = []

    // 农户只能看到自己添加的资源
    if (userType === 'farmer') {
      whereClause += ' AND owner = ?'
      replacements.push(userId)
    }

    if (type && type !== 'all') {
      whereClause += ' AND type = ?'
      replacements.push(type)
    }

    const [resources] = await sequelize.query(`
      SELECT 
        id,
        owner as user_id,
        type,
        name,
        owner,
        location,
        quantity,
        unit,
        status,
        remark,
        created_at
      FROM resources
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      replacements
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: resources
    })
  } catch (error) {
    console.error('获取资源列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取资源列表失败'
    })
  }
})

// 添加资源
router.post('/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { type, name, owner, location, quantity, unit, remark } = req.body

    const [result] = await sequelize.query(`
      INSERT INTO resources 
      (type, name, owner, location, quantity, unit, status, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'available', ?, NOW(), NOW())
    `, {
      replacements: [type, name, owner, location, quantity, unit, remark]
    })

    res.json({
      code: 200,
      message: '资源添加成功',
      data: { id: result }
    })
  } catch (error) {
    console.error('添加资源失败:', error)
    res.status(500).json({
      code: 500,
      message: '添加资源失败'
    })
  }
})

// 获取需求列表
router.get('/demands', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type

    let whereClause = 'WHERE 1=1'
    const replacements = []

    // 农户只能看到自己发布的需求
    if (userType === 'farmer') {
      whereClause += ' AND requester = ?'
      replacements.push(userId)
    }

    const [demands] = await sequelize.query(`
      SELECT 
        id,
        requester as user_id,
        resource_type,
        title,
        requester,
        location,
        quantity,
        unit,
        urgency,
        description,
        matched,
        created_at
      FROM resource_demands
      ${whereClause}
      ORDER BY urgency DESC, created_at DESC
    `, {
      replacements
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: demands
    })
  } catch (error) {
    console.error('获取需求列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取需求列表失败'
    })
  }
})

// 发布需求
router.post('/demands', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { resource_type, title, requester, location, quantity, unit, urgency, description } = req.body

    const [result] = await sequelize.query(`
      INSERT INTO resource_demands 
      (resource_type, title, requester, location, quantity, unit, urgency, description, matched, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `, {
      replacements: [resource_type, title, requester, location, quantity, unit, urgency, description]
    })

    res.json({
      code: 200,
      message: '需求发布成功',
      data: { id: result }
    })
  } catch (error) {
    console.error('发布需求失败:', error)
    res.status(500).json({
      code: 500,
      message: '发布需求失败'
    })
  }
})

// 匹配资源（仅管理员）
router.post('/demands/:id/match', authenticateToken, async (req, res) => {
  try {
    const userType = req.user.user_type
    
    // 只有管理员可以匹配资源
    if (userType !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '只有管理员可以匹配资源'
      })
    }

    const { id } = req.params
    const { resource_id } = req.body

    // 更新需求状态
    await sequelize.query(`
      UPDATE resource_demands 
      SET matched = 1, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [id]
    })

    // 可选：更新资源状态为使用中
    await sequelize.query(`
      UPDATE resources 
      SET status = 'in_use', updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [resource_id]
    })

    res.json({
      code: 200,
      message: '匹配成功'
    })
  } catch (error) {
    console.error('匹配资源失败:', error)
    res.status(500).json({
      code: 500,
      message: '匹配资源失败'
    })
  }
})

// 获取统计数据
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM resources) as total_resources,
        (SELECT COUNT(*) FROM resources WHERE status = 'available') as available_resources,
        (SELECT COUNT(*) FROM resource_demands WHERE matched = 0) as pending_demands,
        (SELECT COUNT(*) FROM resource_demands WHERE matched = 1) as matched_count
    `)

    res.json({
      code: 200,
      message: '获取成功',
      data: stats[0]
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败'
    })
  }
})

module.exports = router