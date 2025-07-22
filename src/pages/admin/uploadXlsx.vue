<template>
    <div class="excel-upload-container">
      <el-card class="header-card">
        <h2>用户批量导入</h2>
      </el-card>
  
      <el-card class="upload-card">
        <el-form :model="form" label-width="120px" ref="uploadForm">
          <el-form-item label="上传 Excel 文件" prop="file"
                        :rules="[{ required: true, message: '请上传 Excel 文件', trigger: 'change' }]">
            <el-upload
              class="upload-demo"
              drag
              action=""
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="true"
              accept=".xlsx"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将Excel文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传.xlsx格式文件，且不超过5MB。首列需为“学号”或“工号”
                </div>
              </template>
            </el-upload>
          </el-form-item>
  
          <el-form-item>
            <el-button type="primary" @click="submitForm">提交导入</el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="downloadTemplate">下载模板</el-button>
          </el-form-item>
        </el-form>
      </el-card>
  
      <!-- 导入结果对话框 -->
      <el-dialog v-model="resultDialogVisible" title="导入结果" width="60%">
        <div v-if="result">
          <el-alert :title="result.message" type="info" show-icon />
          <el-alert :title="`总用户数：${result.totalCount}`" type="info" show-icon class="mt-2" />
          <el-alert :title="`成功导入：${result.successCount}`" type="success" show-icon class="mt-2" />
          <el-alert
            :title="`导入失败：${result.failCount}`"
            type="error"
            show-icon
            v-if="result.failCount > 0"
            class="mt-2"
          />
  
          <!-- 失败用户表格 -->
          <div v-if="result.failCount > 0" class="mt-4">
            <h4>失败用户列表：</h4>
            <el-table :data="result.failedUsers" border style="width: 100%" class="mt-2">
              <el-table-column prop="username" label="用户名 / 学号" width="200" />
              <el-table-column prop="name" label="姓名" width="150" />
              <el-table-column prop="reason" label="失败原因" />
            </el-table>
          </div>
        </div>
        <div v-else>正在处理导入结果...</div>
  
        <template #footer>
          <el-button type="primary" @click="resultDialogVisible = false">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue'
  import { ElMessage } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { createUsersByFile } from '@/api/user'
  
  const form = reactive({
    file: null,
    fileBase64: ''
  })
  
  const uploadForm = ref(null)
  const resultDialogVisible = ref(false)
  const result = ref(null)
  
  // 文件处理
  const handleFileChange = (file) => {
    const isXlsx = file.raw.name.endsWith('.xlsx')
    const isLt5M = file.raw.size / 1024 / 1024 < 5
  
    if (!isXlsx) {
      ElMessage.error('只能上传.xlsx文件！')
      return false
    }
    if (!isLt5M) {
      ElMessage.error('文件大小不能超过5MB！')
      return false
    }
  
    const reader = new FileReader()
    reader.readAsDataURL(file.raw)
    reader.onload = () => {
      const base64String = reader.result.split(',')[1]
      form.file = file.raw
      form.fileBase64 = base64String
    }
  
    return true
  }
  
  // 提交表单
  const submitForm = async () => {
    try {
      await uploadForm.value.validate()
      const res = await createUsersByFile({
        base64File: form.fileBase64
      })
      result.value = res.data
      resultDialogVisible.value = true
    } catch (error) {
      if (error.message !== 'validate') {
        ElMessage.error(error.message || '导入失败')
      }
    }
  }
  
  // 重置表单
  const resetForm = () => {
    uploadForm.value?.resetFields()
    form.file = null
    form.fileBase64 = ''
    result.value = null
  }
  
  // 下载模板
  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/template/用户-模板.xlsx'
    link.download = '用户-模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  </script>
  
  <style scoped>
  .excel-upload-container {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }
  
  .header-card {
    margin-bottom: 20px;
    background-color:#409eff;
    color: white;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }
  
  .upload-card {
    background-color: white;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 40px 0;
  }
  
  .mt-2 {
    margin-top: 0.5rem;
  }
  .mt-4 {
    margin-top: 1rem;
  }
  </style>
  