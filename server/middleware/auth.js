const jwt = require('jsonwebtoken')
const { User } = require('../models')

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 验证用户是否存在且启用
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    })

    if (!user || user.status === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('JWT验证错误:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期'
      })
    }
    
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
}

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    })
  }
  next()
}

// 可选认证中间件（不强制要求token）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      })
      
      if (user && user.status === 1) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next()
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
}