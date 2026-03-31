const { sequelize } = require('./models')

// 检查数据库表结构
async function checkDatabaseStructure() {
  try {
    console.log('检查 weather_data 表结构...')
    
    // 获取表结构信息
    const [rows, fields] = await sequelize.query('DESCRIBE weather_data')
    console.log('weather_data 表结构:')
    rows.forEach(row => {
      console.log(`${row.Field}: ${row.Type} ${row.Null} ${row.Default}`)
    })
    
    // 检查当前时间和30分钟前的时间
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    console.log('\n当前时间:', now.toLocaleString())
    console.log('30分钟前:', thirtyMinutesAgo.toLocaleString())
    
    // 检查最新一条数据的时间
    const [latestData] = await sequelize.query('SELECT region, record_time FROM weather_data ORDER BY record_time DESC LIMIT 1')
    if (latestData.length > 0) {
      console.log('\n最新数据时间:', latestData[0].record_time.toLocaleString())
      console.log('是否在30分钟内:', latestData[0].record_time >= thirtyMinutesAgo)
    }
    
  } catch (error) {
    console.error('检查数据库结构失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

checkDatabaseStructure()
