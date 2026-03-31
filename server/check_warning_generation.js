const { WeatherData, DisasterType, WarningRecord } = require('./models')

// 检查预警生成
async function checkWarningGeneration() {
  try {
    console.log('=== 预警生成检查 ===')
    
    // 获取最新的天气数据
    const latestWeather = await WeatherData.findOne({
      order: [['created_at', 'DESC']]
    })
    
    if (!latestWeather) {
      console.log('❌ 没有天气数据')
      return
    }
    
    console.log('最新天气数据:')
    console.log(`  地区: ${latestWeather.region}`)
    console.log(`  温度: ${latestWeather.temperature}°C`)
    console.log(`  湿度: ${latestWeather.humidity}%`)
    console.log(`  降雨量: ${latestWeather.rainfall}mm`)
    console.log(`  风速: ${latestWeather.wind_speed}m/s`)
    console.log(`  风向: ${latestWeather.wind_direction}`)
    console.log(`  气压: ${latestWeather.air_pressure}hPa`)
    console.log(`  时间: ${latestWeather.created_at}`)
    
    // 获取所有灾害类型
    const disasterTypes = await DisasterType.findAll()
    console.log('\n灾害类型和阈值:')
    
    // 检查每个灾害类型的预警条件
    for (const disasterType of disasterTypes) {
      console.log(`\n${disasterType.type_name} (${disasterType.type_code}):`)
      
      // 获取阈值配置
      const criteria = disasterType.warning_criteria || {}
      
      // 检查每个风险级别
      const levels = ['severe', 'moderate', 'light']
      
      for (const level of levels) {
        if (criteria[level] && Array.isArray(criteria[level])) {
          console.log(`  ${level} 级别条件:`)
          
          const levelCriteria = criteria[level]
          let allConditionsMet = true
          
          for (const condition of levelCriteria) {
            const { type, operator, value } = condition
            let actualValue = null
            
            switch (type) {
              case 'temperature':
                actualValue = parseFloat(latestWeather.temperature || 0)
                break
              case 'humidity':
                actualValue = parseFloat(latestWeather.humidity || 0)
                break
              case 'rainfall':
                actualValue = parseFloat(latestWeather.rainfall || 0)
                break
              case 'wind_speed':
                actualValue = parseFloat(latestWeather.wind_speed || 0)
                break
              case 'air_pressure':
                actualValue = parseFloat(latestWeather.air_pressure || 0)
                break
              default:
                actualValue = null
            }
            
            if (actualValue === null) {
              allConditionsMet = false
              console.log(`    ❌ 条件类型 ${type} 无效`)
              continue
            }
            
            // 检查条件
            let conditionMet = false
            switch (operator) {
              case '>':
                conditionMet = actualValue > value
                break
              case '<':
                conditionMet = actualValue < value
                break
              case '>=':
                conditionMet = actualValue >= value
                break
              case '<=':
                conditionMet = actualValue <= value
                break
              case '=':
              case '==':
                conditionMet = actualValue == value
                break
              default:
                conditionMet = false
            }
            
            console.log(`    ${type} ${operator} ${value}: ${actualValue} ${conditionMet ? '✅' : '❌'}`)
            
            if (!conditionMet) {
              allConditionsMet = false
            }
          }
          
          if (allConditionsMet) {
            console.log(`  ✅ 满足 ${level} 级别预警条件`)
          } else {
            console.log(`  ❌ 不满足 ${level} 级别预警条件`)
          }
        }
      }
    }
    
    // 检查最新的预警记录
    const latestWarnings = await WarningRecord.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    })
    
    console.log('\n最新的预警记录:')
    if (latestWarnings.length > 0) {
      latestWarnings.forEach(warning => {
        console.log(`  - ${warning.region}: ${warning.warning_level} 级别, 时间: ${warning.created_at}`)
      })
    } else {
      console.log('  ❌ 没有预警记录')
    }
    
    console.log('\n=== 检查完成 ===')
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkWarningGeneration()
