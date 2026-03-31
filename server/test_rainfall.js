const weatherService = require('./services/weatherService')

// 测试获取北京的天气数据
async function testRainfall() {
  try {
    console.log('测试获取北京的天气数据...')
    const weatherData = await weatherService.getRealWeather('beijing')
    console.log('天气数据:', weatherData)
    console.log('降雨量:', weatherData.rainfall)
    
    console.log('\n测试获取上海的天气数据...')
    const shanghaiWeather = await weatherService.getRealWeather('shanghai')
    console.log('天气数据:', shanghaiWeather)
    console.log('降雨量:', shanghaiWeather.rainfall)
    
    console.log('\n测试获取广州的天气数据...')
    const guangzhouWeather = await weatherService.getRealWeather('guangzhou')
    console.log('天气数据:', guangzhouWeather)
    console.log('降雨量:', guangzhouWeather.rainfall)
    
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

testRainfall()
