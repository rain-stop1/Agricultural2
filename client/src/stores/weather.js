import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getRealWeather } from '@/api/weather'

// 缓存配置
const CACHE_KEY = 'weather_data_cache'
const CACHE_TIMESTAMP_KEY = 'weather_data_timestamp'
const CACHE_DURATION = 10 * 60 * 1000 // 10分钟

// 全国主要城市列表（使用完整的117个城市）
const getAllCities = () => {
  return [
    // 直辖市
    { code: 'beijing', name: '北京', coord: { lat: 39.9042, lng: 116.4074 }, province: '北京' },
    { code: 'shanghai', name: '上海', coord: { lat: 31.2304, lng: 121.4737 }, province: '上海' },
    { code: 'tianjin', name: '天津', coord: { lat: 39.3434, lng: 117.3616 }, province: '天津' },
    { code: 'chongqing', name: '重庆', coord: { lat: 29.563, lng: 106.5516 }, province: '重庆' },
    
    // 省会及重点城市
    { code: 'shijiazhuang', name: '石家庄', coord: { lat: 38.0428, lng: 114.5149 }, province: '河北' },
    { code: 'taiyuan', name: '太原', coord: { lat: 37.8706, lng: 112.5489 }, province: '山西' },
    { code: 'hohhot', name: '呼和浩特', coord: { lat: 40.8414, lng: 111.7519 }, province: '内蒙古' },
    { code: 'shenyang', name: '沈阳', coord: { lat: 41.8057, lng: 123.4328 }, province: '辽宁' },
    { code: 'dalian', name: '大连', coord: { lat: 38.914, lng: 121.6147 }, province: '辽宁' },
    { code: 'changchun', name: '长春', coord: { lat: 43.8171, lng: 125.3235 }, province: '吉林' },
    { code: 'harbin', name: '哈尔滨', coord: { lat: 45.8038, lng: 126.5340 }, province: '黑龙江' },
    { code: 'nanjing', name: '南京', coord: { lat: 32.0603, lng: 118.7969 }, province: '江苏' },
    { code: 'suzhou', name: '苏州', coord: { lat: 31.2989, lng: 120.5853 }, province: '江苏' },
    { code: 'hangzhou', name: '杭州', coord: { lat: 30.2741, lng: 120.1551 }, province: '浙江' },
    { code: 'hefei', name: '合肥', coord: { lat: 31.8206, lng: 117.229 }, province: '安徽' },
    { code: 'fuzhou', name: '福州', coord: { lat: 26.0745, lng: 119.2965 }, province: '福建' },
    { code: 'xiamen', name: '厦门', coord: { lat: 24.4798, lng: 118.0894 }, province: '福建' },
    { code: 'nanchang', name: '南昌', coord: { lat: 28.6829, lng: 115.8579 }, province: '江西' },
    { code: 'jinan', name: '济南', coord: { lat: 36.6512, lng: 117.12 }, province: '山东' },
    { code: 'qingdao', name: '青岛', coord: { lat: 36.0662, lng: 120.3826 }, province: '山东' },
    { code: 'zhengzhou', name: '郑州', coord: { lat: 34.7473, lng: 113.6249 }, province: '河南' },
    { code: 'wuhan', name: '武汉', coord: { lat: 30.5928, lng: 114.3055 }, province: '湖北' },
    { code: 'changsha', name: '长沙', coord: { lat: 28.2282, lng: 112.9388 }, province: '湖南' },
    { code: 'guangzhou', name: '广州', coord: { lat: 23.1291, lng: 113.2644 }, province: '广东' },
    { code: 'shenzhen', name: '深圳', coord: { lat: 22.5431, lng: 114.0579 }, province: '广东' },
    { code: 'nanning', name: '南宁', coord: { lat: 22.8170, lng: 108.3665 }, province: '广西' },
    { code: 'haikou', name: '海口', coord: { lat: 20.0444, lng: 110.1999 }, province: '海南' },
    { code: 'chengdu', name: '成都', coord: { lat: 30.5728, lng: 104.0668 }, province: '四川' },
    { code: 'guiyang', name: '贵阳', coord: { lat: 26.6470, lng: 106.6302 }, province: '贵州' },
    { code: 'kunming', name: '昆明', coord: { lat: 25.0406, lng: 102.7123 }, province: '云南' },
    { code: 'lhasa', name: '拉萨', coord: { lat: 29.6500, lng: 91.1000 }, province: '西藏' },
    { code: 'xian', name: '西安', coord: { lat: 34.3416, lng: 108.9398 }, province: '陕西' },
    { code: 'lanzhou', name: '兰州', coord: { lat: 36.0611, lng: 103.8343 }, province: '甘肃' },
    { code: 'xining', name: '西宁', coord: { lat: 36.6171, lng: 101.7782 }, province: '青海' },
    { code: 'yinchuan', name: '银川', coord: { lat: 38.4872, lng: 106.2309 }, province: '宁夏' },
    { code: 'urumqi', name: '乌鲁木齐', coord: { lat: 43.8256, lng: 87.6168 }, province: '新疆' },
    
    // 河北省地级市
    { code: 'tangshan', name: '唐山', coord: { lat: 39.6304, lng: 118.1803 }, province: '河北' },
    { code: 'qinhuangdao', name: '秦皇岛', coord: { lat: 39.9353, lng: 119.6001 }, province: '河北' },
    { code: 'handan', name: '邯郸', coord: { lat: 36.6253, lng: 114.5389 }, province: '河北' },
    { code: 'baoding', name: '保定', coord: { lat: 38.8738, lng: 115.4648 }, province: '河北' },
    { code: 'zhangjiakou', name: '张家口', coord: { lat: 40.8110, lng: 114.8794 }, province: '河北' },
    { code: 'chengde', name: '承德', coord: { lat: 40.9517, lng: 117.9633 }, province: '河北' },
    { code: 'cangzhou', name: '沧州', coord: { lat: 38.3037, lng: 116.8387 }, province: '河北' },
    { code: 'langfang', name: '廊坊', coord: { lat: 39.5196, lng: 116.6838 }, province: '河北' },
    { code: 'hengshui', name: '衡水', coord: { lat: 37.7389, lng: 115.6708 }, province: '河北' },
    
    // 山西省地级市
    { code: 'datong', name: '大同', coord: { lat: 40.0769, lng: 113.2950 }, province: '山西' },
    { code: 'yangquan', name: '阳泉', coord: { lat: 37.8570, lng: 113.5830 }, province: '山西' },
    { code: 'changzhi', name: '长治', coord: { lat: 36.1951, lng: 113.1163 }, province: '山西' },
    { code: 'jincheng', name: '晋城', coord: { lat: 35.4901, lng: 112.8513 }, province: '山西' },
    { code: 'shuozhou', name: '朔州', coord: { lat: 39.3313, lng: 112.4328 }, province: '山西' },
    { code: 'jinzhong', name: '晋中', coord: { lat: 37.6872, lng: 112.7524 }, province: '山西' },
    { code: 'yuncheng', name: '运城', coord: { lat: 35.0228, lng: 110.9977 }, province: '山西' },
    { code: 'xinzhou', name: '忻州', coord: { lat: 38.4167, lng: 112.7333 }, province: '山西' },
    { code: 'linfen', name: '临汾', coord: { lat: 36.0881, lng: 111.5189 }, province: '山西' },
    { code: 'lvliang', name: '吕梁', coord: { lat: 37.5178, lng: 111.1419 }, province: '山西' },
    
    // 辽宁省地级市
    { code: 'anshan', name: '鞍山', coord: { lat: 41.1087, lng: 122.9945 }, province: '辽宁' },
    { code: 'fushun', name: '抚顺', coord: { lat: 41.8800, lng: 123.9570 }, province: '辽宁' },
    { code: 'benxi', name: '本溪', coord: { lat: 41.2861, lng: 123.7654 }, province: '辽宁' },
    { code: 'dandong', name: '丹东', coord: { lat: 40.1290, lng: 124.3544 }, province: '辽宁' },
    { code: 'jinzhou', name: '锦州', coord: { lat: 41.0956, lng: 121.1270 }, province: '辽宁' },
    { code: 'yingkou', name: '营口', coord: { lat: 40.6674, lng: 122.2190 }, province: '辽宁' },
    { code: 'fuxin', name: '阜新', coord: { lat: 42.0118, lng: 121.6708 }, province: '辽宁' },
    { code: 'liaoyang', name: '辽阳', coord: { lat: 41.2694, lng: 123.2372 }, province: '辽宁' },
    { code: 'panjin', name: '盘锦', coord: { lat: 41.1245, lng: 122.0699 }, province: '辽宁' },
    { code: 'tieling', name: '铁岭', coord: { lat: 42.2906, lng: 123.8445 }, province: '辽宁' },
    { code: 'chaoyang', name: '朝阳', coord: { lat: 41.5761, lng: 120.4506 }, province: '辽宁' },
    { code: 'huludao', name: '葫芦岛', coord: { lat: 40.7110, lng: 120.8378 }, province: '辽宁' },
    
    // 江苏省地级市
    { code: 'wuxi', name: '无锡', coord: { lat: 31.4912, lng: 120.3119 }, province: '江苏' },
    { code: 'xuzhou', name: '徐州', coord: { lat: 34.2044, lng: 117.2844 }, province: '江苏' },
    { code: 'changzhou', name: '常州', coord: { lat: 31.8117, lng: 119.9742 }, province: '江苏' },
    { code: 'nantong', name: '南通', coord: { lat: 32.0085, lng: 120.8947 }, province: '江苏' },
    { code: 'lianyungang', name: '连云港', coord: { lat: 34.5969, lng: 119.2216 }, province: '江苏' },
    { code: 'huaian', name: '淮安', coord: { lat: 33.5975, lng: 119.0153 }, province: '江苏' },
    { code: 'yancheng', name: '盐城', coord: { lat: 33.3798, lng: 120.1631 }, province: '江苏' },
    { code: 'yangzhou', name: '扬州', coord: { lat: 32.3912, lng: 119.4215 }, province: '江苏' },
    { code: 'zhenjiang', name: '镇江', coord: { lat: 32.1889, lng: 119.4258 }, province: '江苏' },
    { code: 'taizhou', name: '泰州', coord: { lat: 32.4849, lng: 119.9229 }, province: '江苏' },
    { code: 'suqian', name: '宿迁', coord: { lat: 33.9631, lng: 118.2752 }, province: '江苏' },
    
    // 浙江省地级市
    { code: 'ningbo', name: '宁波', coord: { lat: 29.8683, lng: 121.5440 }, province: '浙江' },
    { code: 'wenzhou', name: '温州', coord: { lat: 28.0006, lng: 120.6994 }, province: '浙江' },
    { code: 'jiaxing', name: '嘉兴', coord: { lat: 30.7466, lng: 120.7505 }, province: '浙江' },
    { code: 'huzhou', name: '湖州', coord: { lat: 30.8941, lng: 120.0864 }, province: '浙江' },
    { code: 'shaoxing', name: '绍兴', coord: { lat: 30.0333, lng: 120.5800 }, province: '浙江' },
    { code: 'jinhua', name: '金华', coord: { lat: 29.0789, lng: 119.6478 }, province: '浙江' },
    { code: 'quzhou', name: '衢州', coord: { lat: 28.9700, lng: 118.8750 }, province: '浙江' },
    { code: 'zhoushan', name: '舟山', coord: { lat: 29.9850, lng: 122.2070 }, province: '浙江' },
    { code: 'taizhou-zj', name: '台州', coord: { lat: 28.6561, lng: 121.4287 }, province: '浙江' },
    { code: 'lishui', name: '丽水', coord: { lat: 28.4670, lng: 119.9229 }, province: '浙江' },
    
    // 山东省地级市
    { code: 'zibo', name: '淄博', coord: { lat: 36.8131, lng: 118.0548 }, province: '山东' },
    { code: 'zaozhuang', name: '枣庄', coord: { lat: 34.8107, lng: 117.3231 }, province: '山东' },
    { code: 'dongying', name: '东营', coord: { lat: 37.4337, lng: 118.6751 }, province: '山东' },
    { code: 'yantai', name: '烟台', coord: { lat: 37.4638, lng: 121.4478 }, province: '山东' },
    { code: 'weifang', name: '潍坊', coord: { lat: 36.7069, lng: 119.1619 }, province: '山东' },
    { code: 'jining', name: '济宁', coord: { lat: 35.4154, lng: 116.5874 }, province: '山东' },
    { code: 'taian', name: '泰安', coord: { lat: 36.2003, lng: 117.0874 }, province: '山东' },
    { code: 'weihai', name: '威海', coord: { lat: 37.5128, lng: 122.1201 }, province: '山东' },
    { code: 'rizhao', name: '日照', coord: { lat: 35.4164, lng: 119.5269 }, province: '山东' },
    { code: 'linyi', name: '临沂', coord: { lat: 35.1041, lng: 118.3564 }, province: '山东' },
    { code: 'dezhou', name: '德州', coord: { lat: 37.4355, lng: 116.3594 }, province: '山东' },
    { code: 'liaocheng', name: '聊城', coord: { lat: 36.4570, lng: 115.9859 }, province: '山东' },
    { code: 'binzhou', name: '滨州', coord: { lat: 37.3835, lng: 117.9708 }, province: '山东' },
    { code: 'heze', name: '菏泽', coord: { lat: 35.2333, lng: 115.4806 }, province: '山东' },
    
    // 广东省地级市
    { code: 'zhuhai', name: '珠海', coord: { lat: 22.2711, lng: 113.5767 }, province: '广东' },
    { code: 'shantou', name: '汕头', coord: { lat: 23.3540, lng: 116.6824 }, province: '广东' },
    { code: 'foshan', name: '佛山', coord: { lat: 23.0219, lng: 113.1219 }, province: '广东' },
    { code: 'jiangmen', name: '江门', coord: { lat: 22.5790, lng: 113.0815 }, province: '广东' },
    { code: 'zhanjiang', name: '湛江', coord: { lat: 21.2707, lng: 110.3577 }, province: '广东' },
    { code: 'maoming', name: '茂名', coord: { lat: 21.6631, lng: 110.9253 }, province: '广东' },
    { code: 'zhaoqing', name: '肇庆', coord: { lat: 23.0469, lng: 112.4658 }, province: '广东' },
    { code: 'huizhou', name: '惠州', coord: { lat: 23.1115, lng: 114.4152 }, province: '广东' },
    { code: 'meizhou', name: '梅州', coord: { lat: 24.2888, lng: 116.1225 }, province: '广东' },
    { code: 'shanwei', name: '汕尾', coord: { lat: 22.7787, lng: 115.3750 }, province: '广东' },
    { code: 'dongguan', name: '东莞', coord: { lat: 23.0205, lng: 113.7518 }, province: '广东' },
    { code: 'zhongshan', name: '中山', coord: { lat: 22.5171, lng: 113.3926 }, province: '广东' },
    { code: 'chaozhou', name: '潮州', coord: { lat: 23.6567, lng: 116.6228 }, province: '广东' },
    { code: 'jieyang', name: '揭阳', coord: { lat: 23.5438, lng: 116.3729 }, province: '广东' },
    { code: 'yunfu', name: '云浮', coord: { lat: 22.9297, lng: 112.0442 }, province: '广东' }
  ].filter(city => city.coord) // 只保留有坐标的城市
}

export const useWeatherStore = defineStore('weather', () => {
  const weatherData = ref({}) // 存储各城市天气数据
  const loading = ref(false)
  const loadingProgress = ref(0)
  const loadingTotal = ref(0)
  const initialized = ref(false)
  const initializing = ref(false)

  // 检查缓存是否有效
  const isCacheValid = () => {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      if (!timestamp) return false
      
      const cacheTime = parseInt(timestamp)
      const now = Date.now()
      const isValid = (now - cacheTime) < CACHE_DURATION
      
      if (isValid) {
        console.log(`✓ 天气缓存有效，距离上次加载 ${Math.floor((now - cacheTime) / 1000)} 秒`)
      } else {
        console.log(`✗ 天气缓存已过期，距离上次加载 ${Math.floor((now - cacheTime) / 1000)} 秒`)
      }
      
      return isValid
    } catch (error) {
      console.error('检查天气缓存失败:', error)
      return false
    }
  }

  // 从缓存加载数据
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (!cachedData) return false
      
      const data = JSON.parse(cachedData)
      weatherData.value = data
      
      console.log(`📦 从缓存加载了 ${Object.keys(data).length} 个城市的天气数据`)
      initialized.value = true
      return true
    } catch (error) {
      console.error('加载天气缓存失败:', error)
      return false
    }
  }

  // 保存到缓存
  const saveToCache = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(weatherData.value))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
      console.log(`💾 已缓存 ${Object.keys(weatherData.value).length} 个城市的天气数据`)
    } catch (error) {
      console.error('保存天气缓存失败:', error)
    }
  }

  // 加载天气数据
  const loadWeatherData = async (forceReload = false) => {
    // 避免重复加载
    if (initializing.value) return
    
    // 检查缓存
    if (!forceReload && isCacheValid()) {
      const loaded = loadFromCache()
      if (loaded) return
    }

    initializing.value = true
    loading.value = true
    
    const allCities = getAllCities()
    loadingTotal.value = allCities.length
    loadingProgress.value = 0
    
    console.log(`开始加载 ${allCities.length} 个城市的天气数据...`)
    
    // 分批配置：每批3个城市，批次间延迟800ms，请求间延迟300ms（减少并发，避免超时）
    const batchSize = 3
    const batchDelay = 800
    const requestDelay = 300
    
    // 延迟函数
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    
    try {
      // 分批处理
      for (let i = 0; i < allCities.length; i += batchSize) {
        const batch = allCities.slice(i, i + batchSize)
        const batchResults = []
        
        console.log(`📦 加载第 ${Math.floor(i / batchSize) + 1} 批 (${batch.map(c => c.name).join('、')})`)
        
        // 批次内串行请求
        for (let j = 0; j < batch.length; j++) {
          const city = batch[j]
          
          try {
            if (j > 0) await delay(requestDelay)
            
            const response = await getRealWeather(city.code)
            if (response.code === 200 && response.data) {
              batchResults.push({ ...city, weather: response.data })
              console.log(`  ✓ ${city.name}: ${Math.round(response.data.temperature)}°C`)
            }
          } catch (error) {
            console.warn(`  ✗ ${city.name}: ${error.message}`)
          }
          
          loadingProgress.value++
        }
        
        // 保存这一批的数据
        batchResults.forEach(result => {
          if (result && result.weather) {
            weatherData.value[result.code] = result.weather
          }
        })
        
        // 批次间延迟
        if (i + batchSize < allCities.length) {
          await delay(batchDelay)
        }
      }
      
      console.log(`\n✅ 天气数据加载完成！共成功加载 ${Object.keys(weatherData.value).length} 个城市`)
      
      // 保存到缓存
      saveToCache()
      initialized.value = true
    } catch (error) {
      console.error('加载天气数据失败:', error)
    } finally {
      loading.value = false
      initializing.value = false
    }
  }

  // 清理缓存
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
      console.log('🗑️ 已清理天气缓存')
    } catch (error) {
      console.error('清理天气缓存失败:', error)
    }
  }

  return {
    weatherData,
    loading,
    loadingProgress,
    loadingTotal,
    initialized,
    initializing,
    loadWeatherData,
    clearCache
  }
})
