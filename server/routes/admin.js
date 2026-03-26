const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const models = require('../models')
const User = models.User

console.log('Models:', Object.keys(models))
console.log('User model:', User)

const router = express.Router()

// 获取用户列表
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'real_name', 'phone', 'email', 'user_type', 'region', 'created_at', 'updated_at'],
      order: [['id', 'ASC']]
    })
    
    res.json({
      code: 200,
      message: '获取用户列表成功',
      data: users
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败'
    })
  }
})

// 获取单个用户信息
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'real_name', 'phone', 'email', 'user_type', 'region', 'created_at', 'updated_at']
    })
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }
    
    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    })
  }
})

// 创建用户
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, real_name, phone, region, email, password, role } = req.body
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } })
    if (existingEmail) {
      return res.status(400).json({
        code: 400,
        message: '邮箱已存在'
      })
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      real_name,
      phone,
      region,
      email,
      password,
      user_type: role
    })
    
    res.json({
      code: 200,
      message: '创建用户成功',
      data: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        phone: user.phone,
        region: user.region,
        email: user.email,
        role: user.user_type,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    res.status(500).json({
      code: 500,
      message: '创建用户失败'
    })
  }
})

// 更新用户信息
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }
    
    const { username, real_name, phone, region, email, role, password } = req.body
    
    // 检查用户名是否已被其他用户使用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } })
      if (existingUser) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在'
        })
      }
    }
    
    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } })
      if (existingEmail) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已存在'
        })
      }
    }
    
    // 更新用户信息
    await user.update({
      username: username || user.username,
      real_name: real_name || user.real_name,
      phone: phone || user.phone,
      region: region || user.region,
      email: email || user.email,
      user_type: role || user.user_type,
      password: password || user.password
    })
    
    res.json({
      code: 200,
      message: '更新用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        phone: user.phone,
        region: user.region,
        email: user.email,
        role: user.user_type,
        updatedAt: user.updated_at
      }
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '更新用户信息失败'
    })
  }
})

// 删除用户
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }
    
    // 不能删除自己
    if (user.id === req.user.id) {
      return res.status(400).json({
        code: 400,
        message: '不能删除自己的账户'
      })
    }
    
    await user.destroy()
    
    res.json({
      code: 200,
      message: '删除用户成功'
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除用户失败'
    })
  }
})

// 获取系统信息
router.get('/system/info', authenticateToken, requireAdmin, (req, res) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      name: '农业灾害预警与管理系统',
      description: '用于监测、预警和管理农业灾害的系统',
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    }
    
    res.json({
      code: 200,
      message: '获取系统信息成功',
      data: systemInfo
    })
  } catch (error) {
    console.error('获取系统信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取系统信息失败'
    })
  }
})

// 获取系统日志
router.get('/system/logs', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 这里可以实现日志查询逻辑
    // 暂时返回模拟数据
    const logs = [
      {
        id: 1,
        level: 'info',
        message: '系统启动',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        level: 'info',
        message: '用户登录',
        timestamp: new Date().toISOString()
      },
      {
        id: 3,
        level: 'warning',
        message: 'API请求超时',
        timestamp: new Date().toISOString()
      }
    ]
    
    res.json({
      code: 200,
      message: '获取系统日志成功',
      data: logs
    })
  } catch (error) {
    console.error('获取系统日志失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取系统日志失败'
    })
  }
})

// 数据管理相关API
// 获取基础数据
router.get('/data/basic', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 模拟基础数据
    const basicData = {
      crops: [
        { id: 1, name: '小麦', growthCycle: 180, disasterCoefficient: 0.8 },
        { id: 2, name: '玉米', growthCycle: 120, disasterCoefficient: 0.7 },
        { id: 3, name: '水稻', growthCycle: 150, disasterCoefficient: 0.9 },
        { id: 4, name: '大豆', growthCycle: 100, disasterCoefficient: 0.6 }
      ],
      disasterTypes: [
        { id: 1, name: '干旱', level: '轻度', coefficient: 0.3 },
        { id: 2, name: '干旱', level: '中度', coefficient: 0.6 },
        { id: 3, name: '干旱', level: '重度', coefficient: 0.9 },
        { id: 4, name: '洪涝', level: '轻度', coefficient: 0.4 },
        { id: 5, name: '洪涝', level: '中度', coefficient: 0.7 },
        { id: 6, name: '洪涝', level: '重度', coefficient: 0.95 },
        { id: 7, name: '病虫害', level: '轻度', coefficient: 0.2 },
        { id: 8, name: '病虫害', level: '中度', coefficient: 0.5 },
        { id: 9, name: '病虫害', level: '重度', coefficient: 0.8 }
      ],
      assets: [
        { id: 1, name: '小麦', unitPrice: 2.5 },
        { id: 2, name: '玉米', unitPrice: 2.2 },
        { id: 3, name: '水稻', unitPrice: 2.8 },
        { id: 4, name: '大豆', unitPrice: 3.5 }
      ]
    }
    
    res.json({
      code: 200,
      message: '获取基础数据成功',
      data: basicData
    })
  } catch (error) {
    console.error('获取基础数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取基础数据失败'
    })
  }
})

// 更新基础数据
router.put('/data/basic', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { crops, disasterTypes, assets } = req.body
    
    // 这里可以实现数据更新逻辑
    console.log('更新基础数据:', { crops, disasterTypes, assets })
    
    res.json({
      code: 200,
      message: '更新基础数据成功'
    })
  } catch (error) {
    console.error('更新基础数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '更新基础数据失败'
    })
  }
})

module.exports = router