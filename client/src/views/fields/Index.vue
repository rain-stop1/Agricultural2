<template>
  <div class="fields-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><MapLocation /></el-icon>
            地块管理
          </span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加地块
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="地块名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入地块名称"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 地块列表 -->
      <el-table 
        :data="tableData" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="field_name" label="地块名称" width="150" />
        <el-table-column prop="location" label="位置" min-width="200" />
        <el-table-column prop="area" label="面积(亩)" width="100" align="center" />
        <el-table-column label="作物" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.crop" type="success">{{ row.crop.crop_name }}</el-tag>
            <span v-else class="text-gray">未种植</span>
          </template>
        </el-table-column>
        <el-table-column label="种植日期" width="120">
          <template #default="{ row }">
            {{ row.planting_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '种植中' : '休耕' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </el-card>

    <!-- 表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="地块名称" prop="field_name">
          <el-input v-model="formData.field_name" placeholder="请输入地块名称" />
        </el-form-item>
        <el-form-item label="位置" prop="locationArray">
          <el-cascader
            v-model="formData.locationArray"
            :options="regionOptions"
            placeholder="请选择省市"
            style="width: 100%"
            clearable
            :props="{ expandTrigger: 'hover' }"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input 
            v-model="formData.address" 
            placeholder="请输入详细地址，如：XX区XX街道XX村XX号"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item label="面积(亩)" prop="area">
          <el-input-number 
            v-model="formData.area" 
            :min="0.1" 
            :precision="2"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="作物">
          <el-select v-model="formData.crop_id" placeholder="请选择作物" clearable style="width: 100%">
            <el-option
              v-for="crop in cropList"
              :key="crop.id"
              :label="crop.crop_name"
              :value="crop.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="种植日期">
          <el-date-picker
            v-model="formData.planting_date"
            type="date"
            placeholder="选择种植日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">种植中</el-radio>
            <el-radio :value="0">休耕</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getMyFields, createField, updateField, deleteField } from '@/api/field'
import { getCropList } from '@/api/crop'
import { regions } from '@/utils/regions'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加地块')
const formRef = ref(null)
const isEdit = ref(false)
const currentId = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 表格数据
const tableData = ref([])

// 地区选项
const regionOptions = computed(() => {
  return regions.map(r => ({
    value: r.province,
    label: r.province,
    children: r.cities.map(c => ({
      value: c,
      label: c
    }))
  }))
})

// 作物列表
const cropList = ref([])

// 表单数据
const formData = reactive({
  field_name: '',
  location: '',
  locationArray: [], // 用于级联选择器
  address: '', // 详细地址
  area: null,
  crop_id: null,
  planting_date: null,
  status: 1
})

// 表单验证规则
const formRules = {
  field_name: [
    { required: true, message: '请输入地块名称', trigger: 'blur' }
  ],
  locationArray: [
    { required: true, message: '请选择省市', trigger: 'change', type: 'array' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  area: [
    { required: true, message: '请输入地块面积', trigger: 'blur' }
  ]
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 加载地块列表
const loadData = async () => {
  loading.value = true
  try {
    const response = await getMyFields({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword
    })
    
    if (response.code === 200) {
      tableData.value = response.data.list
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载地块列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载作物列表
const loadCrops = async () => {
  try {
    const response = await getCropList()
    if (response.code === 200) {
      cropList.value = response.data
    }
  } catch (error) {
    console.error('加载作物列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  pagination.page = 1
  loadData()
}

// 分页变化
const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}

// 添加
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '添加地块'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  dialogTitle.value = '编辑地块'
  
  // 解析位置字符串为数组和详细地址
  let locationArray = []
  let address = ''
  
  if (row.location) {
    // 尝试分离省市和详细地址
    // 格式：浙江省杭州市西湖区XX街道XX村
    const provinceMatch = row.location.match(/([\u4e00-\u9fa5]+省|[\u4e00-\u9fa5]+市(?=市)|北京市|天津市|上海市|重庆市)/)
    const cityMatch = row.location.match(/([\u4e00-\u9fa5]+市)/)
    
    if (provinceMatch && cityMatch) {
      const province = provinceMatch[0]
      const city = cityMatch[0]
      locationArray = [province, city]
      
      // 提取详细地址（省市之后的部分）
      const locationStr = row.location
      const cityIndex = locationStr.indexOf(city)
      if (cityIndex !== -1) {
        address = locationStr.substring(cityIndex + city.length)
      }
    } else {
      // 如果无法解析，整个作为详细地址
      address = row.location
    }
  }
  
  Object.assign(formData, {
    field_name: row.field_name,
    location: row.location,
    locationArray: locationArray,
    address: address,
    area: row.area,
    crop_id: row.crop_id,
    planting_date: row.planting_date,
    status: row.status
  })
  
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  // TODO: 跳转到详情页
  ElMessage.info('详情页开发中')
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除地块"${row.field_name}"吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteField(row.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        loadData()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      // 组合完整位置：省市 + 详细地址
      const location = formData.locationArray.length === 2 
        ? `${formData.locationArray[0]}${formData.locationArray[1]}${formData.address || ''}`
        : formData.location
      
      const data = {
        field_name: formData.field_name,
        location: location,
        area: formData.area,
        crop_id: formData.crop_id,
        planting_date: formData.planting_date,
        status: formData.status
      }
      
      let response
      if (isEdit.value) {
        response = await updateField(currentId.value, data)
      } else {
        response = await createField(data)
      }
      
      if (response.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadData()
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    field_name: '',
    location: '',
    locationArray: [],
    address: '',
    area: null,
    crop_id: null,
    planting_date: null,
    status: 1
  })
  formRef.value?.clearValidate()
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
}

onMounted(() => {
  loadData()
  loadCrops()
})
</script>

<style scoped lang="scss">
.fields-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
  }
}

.search-form {
  margin-bottom: 16px;
}

.text-gray {
  color: #909399;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
