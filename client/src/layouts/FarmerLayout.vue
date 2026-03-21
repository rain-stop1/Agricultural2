<template>
  <el-container class="farmer-layout">
    <!-- 应急通知组件（无界面，后台运行） -->
    <EmergencyNotification />
    
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo" :class="{ collapse: isCollapse }">
        <img src="/logo.png" alt="Logo" v-if="!isCollapse" />
        <span v-if="!isCollapse">农业灾害预警</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :router="true"
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-menu-item index="/warning">
          <el-icon><Warning /></el-icon>
          <template #title>预警管理</template>
        </el-menu-item>
        
        <el-menu-item index="/fields">
          <el-icon><MapLocation /></el-icon>
          <template #title>地块管理</template>
        </el-menu-item>
        
        <el-menu-item index="/emergency">
          <el-icon><FirstAidKit /></el-icon>
          <template #title>应急响应</template>
        </el-menu-item>
        
        <el-menu-item index="/loss">
          <el-icon><Document /></el-icon>
          <template #title>损失上报</template>
        </el-menu-item>
        
        <el-menu-item index="/resources">
          <el-icon><Box /></el-icon>
          <template #title>资源管理</template>
        </el-menu-item>
        
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
          
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32">{{ userName.charAt(0) }}</el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import EmergencyNotification from '@/components/EmergencyNotification.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const notificationCount = ref(0)

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)
const userName = computed(() => userStore.user?.real_name || '农户')

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style scoped lang="scss">
.farmer-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    padding: 0 16px;
    
    img {
      width: 32px;
      height: 32px;
    }
    
    &.collapse {
      padding: 0;
    }
  }
  
  .sidebar-menu {
    border-right: none;
    background-color: #001529;
    
    :deep(.el-menu-item) {
      color: rgba(255, 255, 255, 0.65);
      
      &:hover {
        color: #fff;
        background-color: rgba(255, 255, 255, 0.08);
      }
      
      &.is-active {
        color: #fff;
        background-color: #1890ff;
      }
    }
  }
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .collapse-icon {
      font-size: 20px;
      cursor: pointer;
      transition: color 0.3s;
      
      &:hover {
        color: #1890ff;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .notification-badge {
      cursor: pointer;
      
      :deep(.el-icon) {
        transition: color 0.3s;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      .user-name {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
  }
  
  .header {
    .user-name {
      display: none;
    }
  }
}
</style>
