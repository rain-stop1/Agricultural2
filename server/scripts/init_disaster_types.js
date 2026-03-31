/**
 * 初始化灾害类型数据脚本
 * 运行此脚本创建默认的灾害类型和阈值配置
 */

const { DisasterType } = require('../models')

const defaultDisasterTypes = [
  {
    type_name: '暴雨',
    type_code: 'rainstorm',
    description: '短时间内降雨量过大，可能导致洪涝灾害',
    warning_criteria: [
      { parameter: 'rainfall', operator: '>=', value: 50, level: 'light' },
      { parameter: 'rainfall', operator: '>=', value: 100, level: 'moderate' },
      { parameter: 'rainfall', operator: '>=', value: 250, level: 'severe' }
    ]
  },
  {
    type_name: '高温',
    type_code: 'heat',
    description: '气温异常升高，可能对农作物造成热害',
    warning_criteria: [
      { parameter: 'temperature', operator: '>=', value: 35, level: 'light' },
      { parameter: 'temperature', operator: '>=', value: 37, level: 'moderate' },
      { parameter: 'temperature', operator: '>=', value: 40, level: 'severe' }
    ]
  },
  {
    type_name: '干旱',
    type_code: 'drought',
    description: '长期无雨或降雨量严重不足，导致土壤缺水',
    warning_criteria: [
      { parameter: 'humidity', operator: '<=', value: 30, level: 'light' },
      { parameter: 'humidity', operator: '<=', value: 20, level: 'moderate' },
      { parameter: 'humidity', operator: '<=', value: 10, level: 'severe' }
    ]
  },
  {
    type_name: '大风',
    type_code: 'wind',
    description: '风速过大，可能造成农作物倒伏或设施损坏',
    warning_criteria: [
      { parameter: 'wind_speed', operator: '>=', value: 17, level: 'light' },   // 8级风
      { parameter: 'wind_speed', operator: '>=', value: 24, level: 'moderate' }, // 10级风
      { parameter: 'wind_speed', operator: '>=', value: 32, level: 'severe' }   // 12级风
    ]
  },
  {
    type_name: '低温冻害',
    type_code: 'frost',
    description: '气温过低，可能对农作物造成冻害',
    warning_criteria: [
      { parameter: 'temperature', operator: '<=', value: 5, level: 'light' },
      { parameter: 'temperature', operator: '<=', value: 0, level: 'moderate' },
      { parameter: 'temperature', operator: '<=', value: -5, level: 'severe' }
    ]
  },
  {
    type_name: '高湿病害',
    type_code: 'humidity_disease',
    description: '湿度过高，容易引发农作物病害',
    warning_criteria: [
      { parameter: 'humidity', operator: '>=', value: 85, level: 'light' },
      { parameter: 'humidity', operator: '>=', value: 90, level: 'moderate' },
      { parameter: 'humidity', operator: '>=', value: 95, level: 'severe' }
    ]
  }
]

async function initDisasterTypes() {
  try {
    console.log('开始初始化灾害类型数据...')
    
    for (const disasterType of defaultDisasterTypes) {
      // 检查是否已存在
      const existing = await DisasterType.findOne({
        where: { type_code: disasterType.type_code }
      })
      
      if (existing) {
        console.log(`灾害类型 "${disasterType.type_name}" 已存在，跳过`)
        continue
      }
      
      // 创建新的灾害类型
      await DisasterType.create({
        type_name: disasterType.type_name,
        type_code: disasterType.type_code,
        description: disasterType.description,
        warning_criteria: disasterType.warning_criteria
      })
      
      console.log(`✅ 创建灾害类型: ${disasterType.type_name}`)
    }
    
    console.log('\n灾害类型初始化完成！')
    console.log('已创建以下默认灾害类型：')
    defaultDisasterTypes.forEach(dt => {
      console.log(`  - ${dt.type_name} (${dt.type_code})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('初始化灾害类型失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDisasterTypes()
}

module.exports = { initDisasterTypes, defaultDisasterTypes }
