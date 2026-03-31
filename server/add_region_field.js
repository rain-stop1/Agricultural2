const sequelize = require('./config/database')

async function addRegionField() {
  try {
    // 检查 region 字段是否存在
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM users LIKE 'region'
    `)
    
    if (results.length === 0) {
      // 添加 region 字段
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN region VARCHAR(100) NULL COMMENT '所在地区'
      `)
      console.log('✅ 成功添加 region 字段到 users 表')
    } else {
      console.log('ℹ️ region 字段已存在')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 添加 region 字段失败:', error.message)
    process.exit(1)
  }
}

addRegionField()
