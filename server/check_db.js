const { sequelize, WeatherData, WarningRecord, DisasterType } = require('./models')

// 检查数据库状态
async function checkDatabase() {
  try {
    console.log('=== 数据库状态检查 ===')
    
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
    
    // 检查灾害类型配置
    console.log('\n1. 灾害类型配置')
    const disasterTypes = await DisasterType.findAll()
    console.log(`灾害类型数量: ${disasterTypes.length}`)
    disasterTypes.forEach(type => {
      console.log(`  - ${type.type_name} (${type.type_code}): 阈值配置存在: ${!!type.warning_criteria}`)
    })
    
    // 检查天气数据
    console.log('\n2. 天气数据')
    const weatherData = await WeatherData.findAll({
      limit: 10,
      order: [['created_at', 'DESC']]
    })
    console.log(`天气数据记录数: ${weatherData.length}`)
    weatherData.forEach(data => {
      console.log(`  - ${data.region}: 温度 ${data.temperature}°C, 湿度 ${data.humidity}%, 时间: ${data.created_at}`)
    })
    
    // 检查预警记录
    console.log('\n3. 预警记录')
    const warningRecords = await WarningRecord.findAll({
      limit: 10,
      order: [['created_at', 'DESC']]
    })
    console.log(`预警记录数: ${warningRecords.length}`)
    warningRecords.forEach(record => {
      console.log(`  - ${record.region}: ${record.warning_level} 级别, 时间: ${record.created_at}`)
    })
    
    console.log('\n=== 检查完成 ===')
  } catch (error) {
    console.error('检查失败:', error)
  } finally {
    await sequelize.close()
  }
}

checkDatabase()
