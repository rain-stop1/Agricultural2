const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// 管理员路由占位符
// 这里将在后续实现具体功能

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    code: 200,
    message: '管理员模块',
    data: {
      message: '功能开发中...'
    }
  })
})

module.exports = router