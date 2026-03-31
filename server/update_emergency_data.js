const sequelize = require('./config/database')

async function updateEmergencyData() {
  try {
    console.log('开始更新应急方案数据...')
    
    // 连接数据库
    await sequelize.authenticate()
    console.log('✓ 数据库连接成功')
    
    // 获取所有应急方案
    const [plans] = await sequelize.query(`
      SELECT id
      FROM emergency_plans
    `)
    
    console.log(`\n找到 ${plans.length} 个应急方案，开始更新...`)
    
    let updatedCount = 0
    
    for (const plan of plans) {
      // 计算该方案下所有指令的最大目标人数和最大完成人数
      const [commandStats] = await sequelize.query(`
        SELECT 
          MAX(target_count) as max_target,
          MAX(completed_count) as max_completed
        FROM emergency_commands
        WHERE plan_id = ?
      `, {
        replacements: [plan.id]
      })
      
      const maxTarget = commandStats[0].max_target || 0
      const maxCompleted = commandStats[0].max_completed || 0
      let progress = 0
      
      if (maxTarget > 0) {
        progress = Math.round((maxCompleted / maxTarget) * 100)
      }
      
      // 更新应急方案数据
      await sequelize.query(`
        UPDATE emergency_plans 
        SET progress = ?, response_count = ?, target_count = ?
        WHERE id = ?
      `, {
        replacements: [progress, maxCompleted, maxTarget, plan.id]
      })
      
      updatedCount++
      console.log(`  更新方案 ${plan.id}: 目标人数 ${maxTarget}, 响应人数 ${maxCompleted}, 进度 ${progress}%`)
    }
    
    console.log(`\n✅ 成功更新 ${updatedCount} 个应急方案的数据`)
    
    // 关闭数据库连接
    await sequelize.close()
    console.log('\n✅ 更新完成，数据库连接已关闭')
  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error.message)
    await sequelize.close()
  }
}

// 运行脚本
updateEmergencyData()
