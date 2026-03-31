const weatherService = require('./services/weatherService')

async function testApiCall() {
  console.log('开始测试天气API调用...')
  
  try {
    // 测试北京的天气数据
    const beijingWeather = await weatherService.getRealWeather('beijing')
    console.log('北京天气数据:', beijingWeather)
    console.log('是否使用模拟数据:', beijingWeather.is_mock)
    
    // 测试上海的天气数据
    const shanghaiWeather = await weatherService.getRealWeather('shanghai')
    console.log('上海天气数据:', shanghaiWeather)
    console.log('是否使用模拟数据:', shanghaiWeather.is_mock)
    
    // 测试广州的天气数据
    const guangzhouWeather = await weatherService.getRealWeather('guangzhou')
    console.log('广州天气数据:', guangzhouWeather)
    console.log('是否使用模拟数据:', guangzhouWeather.is_mock)
    
    console.log('\nAPI调用测试完成！')
  } catch (error) {
    console.error('测试过程中发生错误:', error.message)
  }
}

testApiCall()
