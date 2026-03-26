<template>
  <div class="admin-fields">
    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold">地块管理</h2>
        </div>
      </template>
      
      <el-form :inline="true" class="mb-4" @submit.prevent="fetchFields">
        <el-form-item label="用户ID">
          <el-input v-model="filters.user_id" placeholder="输入用户ID" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态">
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="异常" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchFields">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="fields" style="width: 100%">
        <el-table-column prop="id" label="地块ID" width="100" />
        <el-table-column prop="name" label="地块名称" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="area" label="面积(亩)" width="120" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewField(scope.row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editField(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteField(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 查看地块详情 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="地块详情"
      width="600px"
    >
      <el-form v-if="currentField" label-width="100px">
        <el-form-item label="地块ID">
          <el-input v-model="currentField.id" disabled />
        </el-form-item>
        <el-form-item label="地块名称">
          <el-input v-model="currentField.name" disabled />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="currentField.location" disabled />
        </el-form-item>
        <el-form-item label="面积">
          <el-input v-model="currentField.area" disabled />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="currentField.user_id" disabled />
        </el-form-item>
        <el-form-item label="用户姓名">
          <el-input v-model="currentField.user_name" disabled />
        </el-form-item>
        <el-form-item label="状态">
          <el-tag :type="currentField.status === 'active' ? 'success' : 'danger'">
            {{ currentField.status === 'active' ? '正常' : '异常' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="currentField.created_at" disabled />
        </el-form-item>
        <el-form-item label="更新时间">
          <el-input v-model="currentField.updated_at" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑地块 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑地块"
      width="600px"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="地块名称" prop="name">
          <el-input v-model="editForm.name" placeholder="输入地块名称" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="editForm.location" placeholder="输入地块位置" />
        </el-form-item>
        <el-form-item label="面积" prop="area">
          <el-input v-model.number="editForm.area" placeholder="输入地块面积" type="number" />
        </el-form-item>
        <el-form-item label="用户ID" prop="user_id">
          <el-input v-model.number="editForm.user_id" placeholder="输入用户ID" type="number" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" placeholder="选择状态">
            <el-option label="正常" value="active" />
            <el-option label="异常" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getFields, getFieldById, updateFieldAdmin, deleteFieldAdmin as deleteFieldApi } from '@/api/field'

const fields = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filters = reactive({
  user_id: '',
  status: ''
})

const viewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const currentField = ref(null)
const editForm = reactive({})
const editFormRef = ref(null)

const editRules = {
  name: [{ required: true, message: '请输入地块名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地块位置', trigger: 'blur' }],
  area: [{ required: true, message: '请输入地块面积', trigger: 'blur' }, { type: 'number', min: 0, message: '面积必须大于0' }],
  user_id: [{ required: true, message: '请输入用户ID', trigger: 'blur' }, { type: 'number', min: 1, message: '用户ID必须大于0' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchFields = async () => {
  try {
    const userStore = useUserStore()
    console.log('开始获取地块列表...')
    console.log('当前用户:', userStore.user)
    console.log('当前token:', userStore.token)
    
    // 构建请求参数，只包含非空值
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (filters.user_id) {
      params.user_id = filters.user_id
    }
    
    if (filters.status) {
      params.status = filters.status
    }
    
    console.log('请求参数:', params)
    
    const response = await getFields(params)
    console.log('获取地块列表成功:', response)
    // 转换数据结构，将后端字段映射到前端字段
    fields.value = response.data.list.map(field => ({
      id: field.id,
      name: field.field_name,
      location: field.location,
      area: field.area,
      user_id: field.user_id,
      user_name: field.user?.real_name || '',
      status: field.status === 1 ? 'active' : 'inactive',
      created_at: field.created_at,
      updated_at: field.updated_at
    }))
    total.value = response.data.total
    console.log('转换后的数据:', fields.value)
    console.log('总记录数:', total.value)
  } catch (error) {
    ElMessage.error('获取地块列表失败')
    console.error('Error fetching fields:', error)
  }
}

const resetFilters = () => {
  filters.user_id = ''
  filters.status = ''
  fetchFields()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  fetchFields()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  fetchFields()
}

const viewField = async (id) => {
  try {
    const response = await getFieldById(id)
    // 转换数据结构，将后端字段映射到前端字段
    currentField.value = {
      id: response.data.id,
      name: response.data.field_name,
      location: response.data.location,
      area: response.data.area,
      user_id: response.data.user_id,
      user_name: response.data.user?.real_name || '',
      status: response.data.status === 1 ? 'active' : 'inactive',
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    }
    viewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取地块详情失败')
    console.error('Error fetching field details:', error)
  }
}

const editField = (field) => {
  editForm.id = field.id
  editForm.name = field.name
  editForm.location = field.location
  editForm.area = field.area
  editForm.user_id = field.user_id
  editForm.status = field.status
  editDialogVisible.value = true
}

const submitEditForm = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 转换数据结构，将前端字段映射到后端字段
        const fieldData = {
          field_name: editForm.name,
          location: editForm.location,
          area: editForm.area,
          user_id: editForm.user_id,
          status: editForm.status === 'active' ? 1 : 0
        }
        await updateFieldAdmin(editForm.id, fieldData)
        ElMessage.success('更新地块成功')
        editDialogVisible.value = false
        fetchFields()
      } catch (error) {
        ElMessage.error('更新地块失败')
        console.error('Error updating field:', error)
      }
    }
  })
}

const deleteField = async (id) => {
  try {
    await deleteFieldApi(id)
    ElMessage.success('删除地块成功')
    fetchFields()
  } catch (error) {
    ElMessage.error('删除地块失败')
    console.error('Error deleting field:', error)
  }
}

onMounted(() => {
  fetchFields()
})
</script>

<style scoped>
.admin-fields {
  padding: 20px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.text-lg {
  font-size: 18px;
}

.font-bold {
  font-weight: bold;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>