const { sequelize } = require('./models')

async function debugWarnings() {
  try {
    console.log('=== 调试预警匹配逻辑 ===')
    
    // 1. 查询用户 farmer1 的地块
    const [fields] = await sequelize.query(
      `SELECT id, field_name, location FROM fields WHERE user_id = (SELECT id FROM users WHERE username = 'farmer1')`
    )
    console.log('用户地块:', fields)
    
    // 2. 提取城市名
    const locationConditions = []
    fields.forEach(field => {
      if (field.location) {
        // 从地块位置中提取城市名
        const cityMatch = field.location.match(/([\u4e00-\u9fa5]+[市县区])/)
        console.log(`地块 ${field.field_name} 位置: ${field.location}, 匹配结果:`, cityMatch)
        if (cityMatch) {
          // 提取城市名（去掉"市"等后缀）
          const cityName = cityMatch[1].replace(/[市县区]$/, '')
          console.log(`提取的城市名: ${cityName}`)
          locationConditions.push(cityName)
        }
      }
    })
    console.log('提取的城市条件:', locationConditions)
    
    // 3. 查询深圳的预警
    const [shenzhenWarnings] = await sequelize.query(
      `SELECT id, region, status, warning_level FROM warning_records WHERE region LIKE '%深圳%' AND status = 'active'`
    )
    console.log('深圳活跃预警:', shenzhenWarnings)
    
    // 4. 测试匹配
    locationConditions.forEach(city => {
      console.log(`\n测试城市: ${city}`)
      shenzhenWarnings.forEach(warning => {
        const match = warning.region.includes(city)
        console.log(`  预警地区: ${warning.region}, 匹配: ${match}`)
      })
    })
    
    process.exit(0)
  } catch (error) {
    console.error('调试失败:', error)
    process.exit(1)
  }
}

debugWarnings()
