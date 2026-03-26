const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// 安全中间件
app.use(helmet())
app.use(compression())

// 跨域配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000'] // 生产环境需要配置实际域名
    : ['http://localhost:3000', 'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 请求限制 - 开发环境禁用限流
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
    message: {
      code: 429,
      message: '请求过于频繁，请稍后再试'
    }
  })
  app.use('/api/', limiter)
  console.log('生产环境：已启用请求限流')
} else {
  console.log('开发环境：已禁用请求限流')
}

// 日志中间件
app.use(morgan('combined'))

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// API路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/warning', require('./routes/warning'))
app.use('/api/disaster-types', require('./routes/disaster-types'))
app.use('/api/emergency', require('./routes/emergency'))
app.use('/api/resources', require('./routes/resources'))
app.use('/api/loss', require('./routes/loss'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/weather', require('./routes/weather'))
app.use('/api/farmer', require('./routes/farmer'))
app.use('/api/fields', require('./routes/field'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/notification', require('./routes/notification'))

// 数据库连接
const sequelize = require('./config/database')

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  })
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err)
  
  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }))
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors
    })
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌'
    })
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '访问令牌已过期'
    })
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    code: err.code || 500,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 手动创建notifications表
    try {
      const createTableSQL = "CREATE TABLE IF NOT EXISTS `notifications` (`id` INT NOT NULL AUTO_INCREMENT, `title` VARCHAR(100) NOT NULL COMMENT '通知标题', `content` TEXT NOT NULL COMMENT '通知内容', `type` VARCHAR(20) NOT NULL DEFAULT 'info' COMMENT '通知类型：info, success, warning, error', `user_id` INT NULL COMMENT '接收用户ID，null表示所有管理员', `read_status` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '阅读状态', `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), INDEX `idx_user_id` (`user_id`), INDEX `idx_read_status` (`read_status`), INDEX `idx_created_at` (`created_at`), CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表'"
      await sequelize.query(createTableSQL)
      console.log('notifications表创建成功')
    } catch (createError) {
      console.error('创建notifications表失败:', createError.message)
    }
    
    // 启动天气数据同步定时任务
    if (process.env.ENABLE_WEATHER_SYNC !== 'false') {
      const weatherSync = require('./cron/weatherSync')
      weatherSync.start()
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://${process.env.HOST || 'localhost'}:${PORT}`)
      console.log(`环境: ${process.env.NODE_ENV}`)
      console.log(`天气同步: ${process.env.ENABLE_WEATHER_SYNC !== 'false' ? '启用' : '禁用'}`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...')
  
  // 停止天气同步任务
  if (process.env.ENABLE_WEATHER_SYNC !== 'false') {
    const weatherSync = require('./cron/weatherSync')
    weatherSync.stop()
  }
  
  await sequelize.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('正在关闭服务器...')
  
  // 停止天气同步任务
  if (process.env.ENABLE_WEATHER_SYNC !== 'false') {
    const weatherSync = require('./cron/weatherSync')
    weatherSync.stop()
  }
  
  await sequelize.close()
  process.exit(0)
})

startServer()

module.exports = app