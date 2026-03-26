<template>
  <div class="admin-disaster-types-page">
    <el-card class="page-card">
      <template #header>
        <div class="flex-between">
          <h3>灾害类型管理</h3>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新增灾害类型
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="disasterTypes"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type_name" label="灾害类型" />
        <el-table-column prop="type_code" label="类型编码" width="120" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 灾害类型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增灾害类型' : '编辑灾害类型'"
      width="600px"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="灾害类型" prop="type_name">
          <el-input v-model="formData.type_name" placeholder="请输入灾害类型名称" />
        </el-form-item>
        <el-form-item label="类型编码" prop="type_code">
          <el-input v-model="formData.type_code" placeholder="请输入类型编码（英文）" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入灾害描述" :rows="3" />
        </el-form-item>
        <el-form-item label="预警阈值" prop="warning_criteria">
          <el-card>
            <template #header>
              <div class="flex-between">
                <h4>分级预警阈值</h4>
                <el-button type="primary" size="small" @click="addCriteria('severe')">
                  添加条件
                </el-button>
              </div>
            </template>
            
            <!-- 重度预警 -->
            <div class="criteria-section">
              <h5 class="criteria-title">🔴 重度预警 (Severe)</h5>
              <div v-if="formData.warning_criteria.severe.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.severe" :key="`severe-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('severe', index)">
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 中度预警 -->
            <div class="criteria-section mt-20">
              <h5 class="criteria-title">🟠 中度预警 (Moderate)</h5>
              <div v-if="formData.warning_criteria.moderate.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.moderate" :key="`moderate-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('moderate', index)">
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 轻度预警 -->
            <div class="criteria-section mt-20">
              <h5 class="criteria-title">🟡 轻度预警 (Light)</h5>
              <div v-if="formData.warning_criteria.light.length === 0" class="empty-criteria">
                <el-empty description="暂无条件" />
              </div>
              <div v-else v-for="(criteria, index) in formData.warning_criteria.light" :key="`light-${index}`" class="criteria-item">
                <el-select v-model="criteria.type" placeholder="参数类型" class="mr-10">
                  <el-option label="温度" value="temperature" />
                  <el-option label="湿度" value="humidity" />
                  <el-option label="降雨量" value="rainfall" />
                  <el-option label="风速" value="wind_speed" />
                  <el-option label="气压" value="air_pressure" />
                </el-select>
                <el-select v-model="criteria.operator" placeholder="运算符" class="mr-10">
                  <el-option label="大于" value=">" />
                  <el-option label="小于" value="<" />
                  <el-option label="大于等于" value=">=" />
                  <el-option label="小于等于" value="<=" />
                  <el-option label="等于" value="=" />
                </el-select>
                <el-input v-model.number="criteria.value" type="number" placeholder="阈值" class="mr-10" style="width: 100px" />
                <el-button type="danger" size="small" @click="removeCriteria('light', index)">
                  删除
                </el-button>
              </div>
            </div>
          </el-card>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { disasterTypeApi } from '@/api/disaster-types'

const disasterTypes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('create')
const currentId = ref(null)
const formRef = ref(null)

const formData = ref({
  type_name: '',
  type_code: '',
  description: '',
  warning_criteria: {
    severe: [],
    moderate: [],
    light: []
  }
})

const formRules = {
  type_name: [
    { required: true, message: '请输入灾害类型名称', trigger: 'blur' }
  ],
  type_code: [
    { required: true, message: '请输入类型编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '类型编码只能包含小写字母和下划线', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入灾害描述', trigger: 'blur' }
  ]
}

// 加载灾害类型列表
const loadDisasterTypes = async () => {
  loading.value = true
  try {
    const response = await disasterTypeApi.getDisasterTypes()
    if (response.code === 200) {
      disasterTypes.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取灾害类型列表失败')
  } finally {
    loading.value = false
  }
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = 'create'
  currentId.value = null
  formData.value = {
    type_name: '',
    type_code: '',
    description: '',
    warning_criteria: {
      severe: [],
      moderate: [],
      light: []
    }
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (disasterType) => {
  dialogType.value = 'edit'
  currentId.value = disasterType.id
  formData.value = {
    type_name: disasterType.type_name,
    type_code: disasterType.type_code,
    description: disasterType.description,
    warning_criteria: disasterType.warning_criteria || {
      severe: [],
      moderate: [],
      light: []
    }
  }
  dialogVisible.value = true
}

// 添加条件
const addCriteria = (level) => {
  formData.value.warning_criteria[level].push({
    type: '',
    operator: '',
    value: ''
  })
}

// 移除条件
const removeCriteria = (level, index) => {
  formData.value.warning_criteria[level].splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        if (dialogType.value === 'create') {
          response = await disasterTypeApi.createDisasterType(formData.value)
        } else {
          response = await disasterTypeApi.updateDisasterType(currentId.value, formData.value)
        }
        
        if (response.code === 200) {
          ElMessage.success(dialogType.value === 'create' ? '创建灾害类型成功' : '更新灾害类型成功')
          dialogVisible.value = false
          await loadDisasterTypes()
        }
      } catch (error) {
        ElMessage.error(dialogType.value === 'create' ? '创建灾害类型失败' : '更新灾害类型失败')
      }
    }
  })
}

// 删除灾害类型
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个灾害类型吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await disasterTypeApi.deleteDisasterType(id)
      if (response.code === 200) {
        ElMessage.success('删除灾害类型成功')
        await loadDisasterTypes()
      }
    } catch (error) {
      ElMessage.error('删除灾害类型失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 页面挂载时加载数据
onMounted(() => {
  loadDisasterTypes()
})
</script>

<style scoped>
.admin-disaster-types-page {
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

.criteria-section {
  margin-top: 15px;
}

.criteria-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.criteria-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.mr-10 {
  margin-right: 10px;
}

.empty-criteria {
  padding: 20px;
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}
</style>
