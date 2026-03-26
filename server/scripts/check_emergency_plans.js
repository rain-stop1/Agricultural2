const { Sequelize } = require('sequelize')

// 数据库配置
const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'agricultural_disaster_db',
  username: 'root',
  password: '8022',
  dialect: 'mysql',
  timezone: '+08:00',
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true
  }
})

// 检查应急方案数据
async function checkEmergencyPlans() {
  try {
    // 连接数据库
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 获取所有应急方案
    const [plans] = await sequelize.query(`
      SELECT id, plan_name, target_area, response_count, target_count, status
      FROM emergency_plans
      ORDER BY id DESC
    `)
    
    console.log(`\n找到 ${plans.length} 个应急方案：`)
    console.log('-' * 80)
    console.log('ID | 方案名称 | 目标区域 | 响应人数 | 目标人数 | 状态')
    console.log('-' * 80)
    
    plans.forEach(plan => {
      console.log(`${plan.id} | ${plan.plan_name} | ${plan.target_area} | ${plan.response_count} | ${plan.target_count} | ${plan.status}`)
    })
    
    console.log('-' * 80)
    
    // 关闭数据库连接
    await sequelize.close()
    console.log('\n数据库连接已关闭')
  } catch (error) {
    console.error('操作失败:', error)
    await sequelize.close()
  }
}

// 运行脚本
checkEmergencyPlans()
