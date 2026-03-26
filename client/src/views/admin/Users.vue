<template>
  <div class="admin-users-page">
    <el-card class="page-card">
      <template #header>
        <div class="flex-between">
          <h3>用户管理</h3>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            创建用户
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="users"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="real_name" label="真实姓名" />
        <el-table-column prop="phone" label="电话号码" />
        <el-table-column prop="region" label="所处地区" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="openEditDialog(row)"
              :disabled="row.id === currentUserId"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
              :disabled="row.id === currentUserId"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 创建用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建用户' : '编辑用户'"
      width="500px"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="formData.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="电话号码" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="所处地区" prop="region">
          <el-input v-model="formData.region" placeholder="请输入所处地区" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ dialogType === 'create' ? '创建' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/admin'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id)

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('create')
const currentUserIdEdit = ref(null)
const formRef = ref(null)

const formData = ref({
  username: '',
  real_name: '',
  phone: '',
  region: '',
  email: '',
  password: '',
  role: 'user'
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '真实姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的电话号码', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请输入所处地区', trigger: 'blur' },
    { min: 2, max: 50, message: '所处地区长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await userApi.getUsers()
    if (response.code === 200) {
      // 处理字段映射
      users.value = response.data.map(user => ({
        ...user,
        role: user.user_type, // 映射 user_type 到 role
        real_name: user.real_name || '', // 确保 real_name 存在
        phone: user.phone || '', // 确保 phone 存在
        region: user.region || '', // 确保 region 存在
        createdAt: user.created_at, // 映射 created_at 到 createdAt
        updatedAt: user.updated_at // 映射 updated_at 到 updatedAt
      }))
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = 'create'
  currentUserIdEdit.value = null
  formData.value = {
    username: '',
    real_name: '',
    phone: '',
    region: '',
    email: '',
    password: '',
    role: 'user'
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (user) => {
  dialogType.value = 'edit'
  currentUserIdEdit.value = user.id
  formData.value = {
    username: user.username,
    real_name: user.real_name || '',
    phone: user.phone || '',
    region: user.region || '',
    email: user.email,
    password: '', // 编辑时密码可选
    role: user.role
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        if (dialogType.value === 'create') {
          response = await userApi.createUser(formData.value)
        } else {
          // 编辑时如果密码为空，不更新密码
          const updateData = { ...formData.value }
          if (!updateData.password) {
            delete updateData.password
          }
          response = await userApi.updateUser(currentUserIdEdit.value, updateData)
        }
        
        if (response.code === 200) {
          ElMessage.success(dialogType.value === 'create' ? '创建用户成功' : '更新用户成功')
          dialogVisible.value = false
          await loadUsers()
        }
      } catch (error) {
        ElMessage.error(dialogType.value === 'create' ? '创建用户失败' : '更新用户失败')
      }
    }
  })
}

// 删除用户
const handleDelete = (userId) => {
  if (userId === currentUserId.value) {
    ElMessage.warning('不能删除自己的账户')
    return
  }
  
  ElMessageBox.confirm('确定要删除这个用户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await userApi.deleteUser(userId)
      if (response.code === 200) {
        ElMessage.success('删除用户成功')
        await loadUsers()
      }
    } catch (error) {
      ElMessage.error('删除用户失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 页面挂载时加载用户列表
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-users-page {
  padding: 0;
}

.page-card {
  border-radius: 12px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>