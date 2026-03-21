const weatherService = require('../services/weatherService')
const { WarningRecord, DisasterType } = require('../models')

class WeatherSyncCron {
  constructor() {
    this.syncInterval = 30 * 60 * 1000 // 30分钟同步一次
    this.isRunning = false
    this.cities = weatherService.getSupportedCities()
  }

  // 启动定时同步
  start() {
    console.log('🌤️  启动天气数据自动同步任务...')
    
    // 立即执行一次
    this.syncWeatherData()
    
    // 设置定时器
    this.timer = setInterval(() => {
      if (!this.isRunning) {
        this.syncWeatherData()
      }
    }, this.syncInterval)
  }

  // 停止同步
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      console.log('⏹️  天气数据同步任务已停止')
    }
  }

  // 同步天气数据
  async syncWeatherData() {
    if (this.isRunning) {
      console.log('⏭️  上次同步仍在进行中，跳过本次')
      return
    }

    this.isRunning = true
    console.log(`🔄 开始同步天气数据... ${new Date().toLocaleString()}`)

    try {
      // 同步所有城市（演示模式）
      // 如果担心API限制，可以改回随机选择部分城市
      const citiesToSync = this.cities.map(city => city.code) // 同步所有20个城市
      // const citiesToSync = this.getRandomCities(5).map(city => city.code) // 或者只同步5个
      
      const results = await weatherService.syncWeatherData(citiesToSync)
      
      // 统计结果
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      console.log(`✅ 天气数据同步完成: 成功 ${successCount} 个，失败 ${failCount} 个`)
      
      // 自动检测灾害
      if (successCount > 0) {
        await this.detectAndCreateWarnings(results)
      }
      
    } catch (error) {
      console.error('❌ 天气数据同步失败:', error)
    } finally {
      this.isRunning = false
    }
  }

  // 随机选择城市
  getRandomCities(count) {
    const shuffled = [...this.cities].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // 检测并创建预警
  async detectAndCreateWarnings(syncResults) {
    console.log('🔍 开始检测潜在灾害...')
    
    for (const result of syncResults) {
      if (!result.success || !result.data) continue
      
      try {
        const risks = await weatherService.detectDisasters(result.data)
        
        if (risks.length > 0) {
          // 获取灾害类型映射
          const disasterTypeMap = {
            'drought': 'drought',
            'flood': 'flood', 
            'typhoon': 'typhoon',
            'heatwave': 'drought', // 高温归类为干旱风险
            'coldwave': 'drought' // 低温归类为异常情况
          }
          
          for (const risk of risks) {
            const disasterTypeCode = disasterTypeMap[risk.type]
            if (!disasterTypeCode) continue
            
            // 查找对应的灾害类型ID
            const disasterType = await DisasterType.findOne({
              where: { type_code: disasterTypeCode }
            })
            
            if (!disasterType) continue
            
            // 检查是否已存在相同的有效预警
            const existingWarning = await WarningRecord.findOne({
              where: {
                disaster_type_id: disasterType.id,
                region: result.data.region,
                status: 'active',
                created_at: {
                  [require('sequelize').Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时内
                }
              }
            })
            
            if (!existingWarning) {
              // 创建新预警 - 使用中文城市名
              const cityName = weatherService.getCityName(result.data.region) || result.data.region
              
              await WarningRecord.create({
                disaster_type_id: disasterType.id,
                region: cityName,
                warning_level: risk.level,
                warning_content: risk.message,
                start_time: new Date(),
                status: 'active'
              })
              
              console.log(`⚠️  创建预警: ${cityName} - ${risk.message}`)
            }
          }
        }
      } catch (error) {
        console.error(`检测 ${result.location} 灾害失败:`, error)
      }
    }
  }

  // 手动触发同步
  async manualSync(cities = null) {
    console.log('🔄 手动触发天气数据同步...')
    
    try {
      const citiesToSync = cities || this.cities.map(city => city.code)
      const results = await weatherService.syncWeatherData(citiesToSync)
      
      console.log(`✅ 手动同步完成: ${results.filter(r => r.success).length} 成功`)
      
      // 检测灾害
      await this.detectAndCreateWarnings(results)
      
      return results
    } catch (error) {
      console.error('❌ 手动同步失败:', error)
      throw error
    }
  }
}

module.exports = new WeatherSyncCron()