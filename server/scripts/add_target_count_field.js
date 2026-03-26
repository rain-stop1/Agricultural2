const { Sequelize } = require('sequelize')

// 直接配置数据库连接
const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'agricultural_disaster_db',
  username: 'root',
  password: '8022', // 直接使用密码
  dialect: 'mysql',
  timezone: '+08:00',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log
})

// 检查并添加 target_count 字段
async function addTargetCountField() {
  try {
    // 连接数据库
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 检查 emergency_plans 表结构
    const [rows] = await sequelize.query(`
      SHOW COLUMNS FROM emergency_plans
    `)
    
    // 检查是否存在 target_count 字段
    const hasTargetCount = rows.some(row => row.Field === 'target_count')
    
    if (hasTargetCount) {
      console.log('target_count 字段已存在')
    } else {
      // 添加 target_count 字段
      await sequelize.query(`
        ALTER TABLE emergency_plans
        ADD COLUMN target_count INT DEFAULT 0 COMMENT '目标人数'
      `)
      console.log('target_count 字段添加成功')
    }
    
    // 关闭数据库连接
    await sequelize.close()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('操作失败:', error)
    await sequelize.close()
  }
}

// 运行脚本
addTargetCountField()