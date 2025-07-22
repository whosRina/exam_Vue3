<template>
    <div class="word-upload-container">
      <el-card class="header-card">
        <h2>Word题目批量导入</h2>
      </el-card>
  
      <el-card class="upload-card">
        <el-form :model="form" label-width="120px" ref="uploadForm">
          <el-form-item label="选择题库" prop="bankId" 
                       :rules="[{ required: true, message: '请选择题库', trigger: 'change' }]">
            <el-select v-model="form.bankId" placeholder="请选择题库" style="width: 100%">
              <el-option
                v-for="bank in bankList"
                :key="bank.id"
                :label="bank.name"
                :value="bank.id"
              >
                <span>{{ bank.name }}</span>
              </el-option>
            </el-select>
          </el-form-item>
  
          <el-form-item label="上传Word文件" prop="file"
                       :rules="[{ required: true, message: '请上传Word文件', trigger: 'change' }]">
            <el-upload
              class="upload-demo"
              drag
              action=""
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="true"
              accept=".doc,.docx"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将Word文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传 .doc/.docx 格式文件，且不超过10MB
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
      <el-dialog v-model="resultDialogVisible" title="导入结果" width="50%">
        <div v-if="parseResult">
          <el-alert :title="`${parseResult.message}`" type="info" show-icon />
          <el-alert :title="`总题目数量: ${parseResult.totalCount}`" type="info" show-icon />
          <el-alert :title="`成功导入: ${parseResult.successCount}`" type="success" show-icon />
          <el-alert :title="`失败数量: ${parseResult.failCount}`" type="error" v-if="parseResult.failCount > 0" show-icon />
          
          <div class="error-list" v-if="parseResult.failCount > 0">
            <h4>失败题目：</h4>
            <el-table :data="parseResult.failedItems" border style="width: 100%">
              <el-table-column prop="index" label="题目序号" width="120" />
              <el-table-column prop="content" label="题目内容（前50字符）" />
            </el-table>
          </div>
        </div>
        <div v-else>正在解析导入结果...</div>
        
        <template #footer>
          <el-button type="primary" @click="resultDialogVisible = false">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { getBankList, uploadWordQuestions } from '@/api/questionBank'
  
 
  
  const bankList = ref([])
    const form = reactive({
    bankId: '',
    file: null,
    fileBase64: ''
    })
    const uploadForm = ref(null)
    const resultDialogVisible = ref(false)
    const parseResult = ref(null)
    const loading = ref(false)
    onMounted(() => {
    fetchBanks()
    })

    // 获取题库列表
    const fetchBanks = async () => {
    try {
        const response = await getBankList()
        bankList.value = response.data?.bankList || []
    } catch (error) {
        ElMessage.error('获取题库列表失败')
    }
    }
    // 文件变化处理
    const handleFileChange = (file) => {
    const isWord = file.raw.type.includes('msword') || 
                    file.raw.name.endsWith('.doc') || 
                    file.raw.name.endsWith('.docx')
    const isLt10M = file.raw.size / 1024 / 1024 < 10
    if (!isWord) {
        ElMessage.error('只能上传Word文档!')
        return false
    }
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
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
        loading.value = true
        await uploadForm.value.validate()
        
        const params = {
        bankId: parseInt(form.bankId),
        fileBase64: form.fileBase64
        }
        
        const res = await uploadWordQuestions(params)
        parseResult.value = {
        message: res.data.message || '题目导入完成',
        totalCount: res.data.totalCount || 0,
        successCount: res.data.successCount || 0,
        failCount: res.data.failCount || 0,
        failedItems: res.data.failedItems || []
        }
        
        resultDialogVisible.value = true
    } catch (error) {
        if (error.message !== 'validate') {
        ElMessage.error(error.message || '导入失败')
        }
    } finally {
        loading.value = false
    }
    }
    // 重置表单
    const resetForm = () => {
    uploadForm.value?.resetFields()
    form.file = null
    form.fileBase64 = ''
    }
    // 下载模板
    const downloadTemplate = () => {
        const link = document.createElement("a");
        link.href = "/template/题库-模板.docx"; 
        link.download = "题库-模板.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
};

  </script>
  
  <style scoped>
  .word-upload-container {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }
  
  .header-card {
    margin-bottom: 20px;
    background-color: #409eff;
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
  
  .error-list {
    margin-top: 20px;
  }
  
  :deep(.el-upload) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 40px 0;
  }
  </style>
  