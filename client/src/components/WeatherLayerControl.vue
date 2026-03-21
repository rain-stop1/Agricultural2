<template>
  <div class="weather-layer-control">
    <el-button 
      type="primary" 
      size="small" 
      @click="visible = !visible"
      class="control-button"
    >
      <el-icon><Sunny /></el-icon>
      气象图层
    </el-button>

    <transition name="slide-fade">
      <div v-if="visible" class="layer-panel">
        <div class="panel-header">
          <span>气象图层</span>
          <el-icon @click="visible = false" class="close-icon"><Close /></el-icon>
        </div>

        <div class="layer-list">
          <div 
            v-for="layer in layers" 
            :key="layer.id"
            class="layer-item"
            :class="{ active: activeLayer === layer.id }"
            @click="toggleLayer(layer.id)"
          >
            <div class="layer-info">
              <el-icon :color="layer.color" size="20">
                <component :is="layer.icon" />
              </el-icon>
              <span class="layer-name">{{ layer.name }}</span>
            </div>
            <el-switch 
              v-model="layer.enabled" 
              size="small"
              @change="toggleLayer(layer.id)"
            />
          </div>
        </div>

        <div class="layer-opacity">
          <div class="opacity-label">
            <span>透明度</span>
            <span>{{ Math.round(opacity * 100) }}%</span>
          </div>
          <el-slider 
            v-model="opacity" 
            :min="0" 
            :max="1" 
            :step="0.1"
            @change="updateOpacity"
          />
        </div>

        <div class="layer-tips">
          <el-alert 
            type="info" 
            :closable="false"
            show-icon
          >
            <template #title>
              <span style="font-size: 12px;">
                需要OpenWeatherMap API密钥
                <a href="https://openweathermap.org/api" target="_blank">获取</a>
              </span>
            </template>
          </el-alert>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Sunny, Close, Cloudy, Drizzle, Wind, Compass } from '@element-plus/icons-vue'

const emit = defineEmits(['layer-change', 'opacity-change'])

const visible = ref(false)
const activeLayer = ref(null)
const opacity = ref(0.6)

const layers = reactive([
  {
    id: 'temp',
    name: '温度',
    icon: Sunny,
    color: '#f56c6c',
    enabled: false,
    url: 'temp_new'
  },
  {
    id: 'precipitation',
    name: '降水',
    icon: Drizzle,
    color: '#409eff',
    enabled: false,
    url: 'precipitation_new'
  },
  {
    id: 'clouds',
    name: '云层',
    icon: Cloudy,
    color: '#909399',
    enabled: false,
    url: 'clouds_new'
  },
  {
    id: 'wind',
    name: '风速',
    icon: Wind,
    color: '#67c23a',
    enabled: false,
    url: 'wind_new'
  },
  {
    id: 'pressure',
    name: '气压',
    icon: Compass,
    color: '#e6a23c',
    enabled: false,
    url: 'pressure_new'
  }
])

const toggleLayer = (layerId) => {
  const layer = layers.find(l => l.id === layerId)
  if (!layer) return

  // 关闭其他图层
  layers.forEach(l => {
    if (l.id !== layerId) {
      l.enabled = false
    }
  })

  layer.enabled = !layer.enabled
  activeLayer.value = layer.enabled ? layerId : null

  emit('layer-change', {
    layerId: layer.enabled ? layerId : null,
    layerUrl: layer.enabled ? layer.url : null
  })
}

const updateOpacity = () => {
  emit('opacity-change', opacity.value)
}
</script>

<style scoped>
.weather-layer-control {
  position: relative;
}

.control-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.layer-panel {
  position: absolute;
  top: 40px;
  right: 0;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  font-size: 14px;
}

.close-icon {
  cursor: pointer;
  color: #909399;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #303133;
}

.layer-list {
  padding: 8px 0;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.layer-item:hover {
  background: #f5f7fa;
}

.layer-item.active {
  background: #ecf5ff;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-name {
  font-size: 14px;
  color: #303133;
}

.layer-opacity {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
}

.opacity-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.layer-tips {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
