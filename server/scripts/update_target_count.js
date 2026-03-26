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

// 更新应急方案的 target_count 字段
async function updateTargetCount() {
  try {
    // 连接数据库
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 获取所有应急方案
    const [plans] = await sequelize.query(`
      SELECT id, target_area
      FROM emergency_plans
      WHERE status = 'active'
    `)
    
    console.log(`找到 ${plans.length} 个进行中的应急方案`)
    
    // 遍历每个方案，更新 target_count
    for (const plan of plans) {
      const { id, target_area } = plan
      
      // 查询目标地区的农户数量
      const [targetFarmers] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE user_type = 'farmer' AND region LIKE ?
      `, {
        replacements: [`%${target_area}%`]
      })
      
      const count = targetFarmers[0].count
      
      // 更新 target_count 字段
      await sequelize.query(`
        UPDATE emergency_plans
        SET target_count = ?
        WHERE id = ?
      `, {
        replacements: [count, id]
      })
      
      console.log(`方案 ID ${id}（目标区域：${target_area}）的目标人数已更新为 ${count}`)
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
updateTargetCount()