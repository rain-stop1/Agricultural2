const { WeatherData, WarningRecord, DisasterType } = require('./models')

// 测试天气数据同步和预警生成
async function testWeatherSync() {
  try {
    console.log('=== 测试天气数据同步和预警生成 ===')
    
    // 1. 检查灾害类型配置
    console.log('\n1. 检查灾害类型配置')
    const disasterTypes = await DisasterType.findAll()
    console.log(`灾害类型数量: ${disasterTypes.length}`)
    disasterTypes.forEach(type => {
      console.log(`  - ${type.type_name} (${type.type_code}): 阈值配置存在: ${!!type.warning_criteria}`)
    })
    
    // 2. 模拟天气数据
    const testWeatherData = [
      {
        region: '北京',
        temperature: 32,
        humidity: 35,
        rainfall: 0,
        wind_speed: 5,
        wind_direction: '西北风',
        air_pressure: 1010
      },
      {
        region: '上海',
        temperature: 28,
        humidity: 80,
        rainfall: 20,
        wind_speed: 8,
        wind_direction: '东南风',
        air_pressure: 1005
      },
      {
        region: '广州',
        temperature: 35,
        humidity: 25,
        rainfall: 0,
        wind_speed: 3,
        wind_direction: '南风',
        air_pressure: 1008
      }
    ]
    
    console.log('\n2. 模拟天气数据')
    testWeatherData.forEach(data => {
      console.log(`  - ${data.region}: 温度 ${data.temperature}°C, 湿度 ${data.humidity}%, 降雨量 ${data.rainfall}mm`)
    })
    
    // 3. 同步天气数据
    console.log('\n3. 同步天气数据')
    for (const weatherData of testWeatherData) {
      try {
        const createdData = await WeatherData.create(weatherData)
        console.log(`  ✅ ${weatherData.region} 天气数据创建成功: ${createdData.id}`)
        
        // 4. 分析天气数据，生成预警
        console.log(`  🔍 分析 ${weatherData.region} 天气数据...`)
        for (const disasterType of disasterTypes) {
          // 模拟后端的分析逻辑
          const criteria = disasterType.warning_criteria || {}
          
          // 将字符串转换为数值
          const temp = parseFloat(weatherData.temperature || 0)
          const humidity = parseFloat(weatherData.humidity || 0)
          const rainfall = parseFloat(weatherData.rainfall || 0)
          const windSpeed = parseFloat(weatherData.wind_speed || 0)
          const airPressure = parseFloat(weatherData.air_pressure || 0)
          
          // 按严重程度顺序检查：severe > moderate > light
          const levels = ['severe', 'moderate', 'light']
          let warningGenerated = false
          
          for (const level of levels) {
            if (criteria[level] && Array.isArray(criteria[level])) {
              const levelCriteria = criteria[level]
              let allConditionsMet = true
              
              for (const condition of levelCriteria) {
                const { type, operator, value } = condition
                let actualValue = null
                
                switch (type) {
                  case 'temperature':
                    actualValue = temp
                    break
                  case 'humidity':
                    actualValue = humidity
                    break
                  case 'rainfall':
                    actualValue = rainfall
                    break
                  case 'wind_speed':
                    actualValue = windSpeed
                    break
                  case 'air_pressure':
                    actualValue = airPressure
                    break
                  default:
                    actualValue = null
                }
                
                if (actualValue === null) {
                  allConditionsMet = false
                  break
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
                
                if (!conditionMet) {
                  allConditionsMet = false
                  break
                }
              }
              
              if (allConditionsMet) {
                // 生成预警内容
                let warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险`
                
                // 根据灾害类型添加详细信息
                switch (disasterType.type_code) {
                  case 'drought':
                    warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，24小时降雨量${rainfall}mm，请做好防旱准备。`
                    break
                  case 'flood':
                    warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险：24小时降雨量${rainfall}mm，湿度${humidity}%，请做好防汛准备。`
                    break
                  case 'typhoon':
                    warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险：风速${windSpeed}m/s，风向${weatherData.wind_direction}，请做好防台准备。`
                    break
                  case 'hail':
                    warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，请做好防护准备。`
                    break
                  case 'pest':
                    warningContent = `检测到${weatherData.region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，请做好病虫害防治。`
                    break
                }
                
                // 创建预警记录
                const warning = await WarningRecord.create({
                  disaster_type_id: disasterType.id,
                  region: weatherData.region,
                  warning_level: level,
                  warning_content: warningContent,
                  start_time: new Date(),
                  status: 'active'
                })
                
                console.log(`  ⚠️  ${weatherData.region} 生成${disasterType.type_name}预警 (${level}): ${warning.id}`)
                warningGenerated = true
                break // 找到最高风险等级后停止检查
              }
            }
          }
          
          if (!warningGenerated) {
            console.log(`  ✅ ${weatherData.region} 未触发${disasterType.type_name}预警`)
          }
        }
      } catch (error) {
        console.error(`  ❌ ${weatherData.region} 天气数据处理失败:`, error.message)
      }
    })
    
    // 5. 检查预警记录
    console.log('\n4. 检查预警记录')
    const warnings = await WarningRecord.findAll({
      where: {
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    })
    console.log(`活跃预警记录数量: ${warnings.length}`)
    warnings.forEach(warning => {
      console.log(`  - ${warning.region}: ${warning.warning_level} 级别预警`)
    })
    
    console.log('\n=== 测试完成 ===')
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testWeatherSync()
