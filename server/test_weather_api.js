const http = require('http')

// 测试天气API端点
function testWeatherAPI() {
  console.log('测试天气API端点...')
  
  // 测试实时天气API
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/weather/real/beijing',
    method: 'GET'
  }
  
  const req = http.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        console.log('北京天气API响应:')
        console.log('状态码:', response.code)
        console.log('消息:', response.message)
        if (response.data) {
          console.log('降雨量:', response.data.rainfall)
          console.log('天气:', response.data.weather_text)
          console.log('温度:', response.data.temperature)
          console.log('湿度:', response.data.humidity)
          console.log('数据来源:', response.data.source)
          console.log('是否模拟数据:', response.data.is_mock)
          console.log('预警信息数量:', response.data.alerts ? response.data.alerts.length : 0)
          if (response.data.alerts && response.data.alerts.length > 0) {
            console.log('预警信息:', response.data.alerts)
          }
        }
      } catch (error) {
        console.error('解析响应失败:', error.message)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('API请求失败:', error.message)
  })
  
  req.end()
  
  // 测试另一个城市
  setTimeout(() => {
    const options2 = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/weather/real/shanghai',
      method: 'GET'
    }
    
    const req2 = http.request(options2, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('\n上海天气API响应:')
          console.log('状态码:', response.code)
          console.log('消息:', response.message)
          if (response.data) {
            console.log('降雨量:', response.data.rainfall)
            console.log('天气:', response.data.weather_text)
            console.log('温度:', response.data.temperature)
            console.log('湿度:', response.data.humidity)
            console.log('数据来源:', response.data.source)
            console.log('是否模拟数据:', response.data.is_mock)
            console.log('预警信息数量:', response.data.alerts ? response.data.alerts.length : 0)
            if (response.data.alerts && response.data.alerts.length > 0) {
              console.log('预警信息:', response.data.alerts)
            }
          }
        } catch (error) {
          console.error('解析响应失败:', error.message)
        }
      })
    })
    
    req2.on('error', (error) => {
      console.error('API请求失败:', error.message)
    })
    
    req2.end()
  }, 1000)
}

testWeatherAPI()
