<template>
    <div class="exam-management">
      <el-card class="header-card">
        <h2>考试发布</h2>
      </el-card>
  
      <el-card class="content-card">
        <div class="toolbar">
          <el-button type="primary" @click="openCreateDialog" class="create-btn">新建考试</el-button>
          <el-input v-model="searchQuery" placeholder="搜索考试名称..." clearable style="width: 240px;" />
        </div>
  
        <el-table :data="filteredExams" stripe style="width: 100%">
          <el-table-column prop="examName" label="考试名称"></el-table-column>
          <el-table-column prop="className" label="所属班级"></el-table-column>
          <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
          <el-table-column prop="timeRange" label="考试时间" width="260"></el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 考试创建/编辑弹窗 -->
      <el-dialog 
        v-model="examDialogVisible" 
        :title="isEditMode ? '编辑考试' : '新建考试'" 
        width="600px"
        @closed="resetForm"
      >
        <el-form :model="examForm" label-width="100px" :rules="formRules" ref="formRef">
          <el-form-item label="考试名称" prop="examName">
            <el-input v-model="examForm.examName" placeholder="请输入考试名称" />
          </el-form-item>
          <el-form-item label="阅卷设置" prop="requiresManualGrading">
            <el-checkbox v-model="examForm.requiresManualGrading">需要人工阅卷</el-checkbox>
          </el-form-item>
          <el-form-item label="结果查看" prop="canViewResults">
            <el-checkbox v-model="examForm.canViewResults">允许学生查看成绩</el-checkbox>
          </el-form-item>
          
          <el-form-item label="关联班级" prop="classId">
            <el-select 
              v-model="examForm.classId"
              placeholder="请选择班级"
              style="width: 100%"
              @change="handleClassChange"
            >
              <el-option
                v-for="cls in classList"
                :key="cls.classId"
                :label="cls.className"
                :value="cls.classId"
              />
            </el-select>
          </el-form-item>
  
          <el-form-item label="考试类型" prop="examType">
            <el-radio-group v-model="examForm.examType">
              <el-radio label="fixed">固定试卷</el-radio>
              <el-radio label="random">随机组卷</el-radio>
            </el-radio-group>
          </el-form-item>
  
          <el-form-item 
            :label="examForm.examType === 'fixed' ? '试卷选择' : '组卷规则'"
            prop="paperIdentifier"
          >
            <el-select 
              v-model="examForm.paperIdentifier" 
              :placeholder="`请选择${examForm.examType === 'fixed' ? '试卷' : '组卷规则'}`"
              style="width: 100%"
              @change="handlePaperSelect"
            >
              <el-option
                v-for="item in paperOptions"
                :key="item.value"
                :label="`${item.name} (总分: ${item.totalScore}分)`"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
  
          <el-form-item label="考试时间" prop="timeRange">
            <el-date-picker
                v-model="examForm.timeRange"
                type="datetimerange"
                format="YYYY-MM-DD HH:mm"     
                value-format="YYYY-MM-DD HH:mm" 
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
            />


          </el-form-item>
  
          <el-form-item label="总分" prop="totalScore">
            <el-input-number 
              v-model="examForm.totalScore" 
              :min="1" 
              :max="200" 
              controls-position="right"
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="examDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import dayjs from 'dayjs'
  import { ref, computed, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { 
    listExams, 
    createExam, 
    updateExam, 
    deleteExam 
  } from '@/api/exam'
  import { getClassList } from '@/api/class'
  import { getPaperList, listPaperRules } from '@/api/paper'
  
  const searchQuery = ref('')
  const examList = ref([])
  const classList = ref([])
  const fixedPapers = ref([])
  const paperRules = ref([])
  const examDialogVisible = ref(false)
  const isEditMode = ref(false)
  const currentExamId = ref(null)
  const formRef = ref(null)
  
  const examForm = ref({
    examName: '',
    classId: null,
    examType: 'fixed',
    paperIdentifier: null,
    timeRange: [],
    totalScore: 100,
    requiresManualGrading: false,
    canViewResults: false
  })
  
  const formRules = {
    examName: [{ required: true, message: '考试名称不能为空', trigger: 'blur' }],
    classId: [{ required: true, message: '请选择关联班级', trigger: 'change' }],
    examType: [{ required: true }],
    paperIdentifier: [{ 
      required: true,
      validator: (_, value, callback) => {
        if (!value) return callback(new Error('请选择试卷/组卷规则'))
        const options = paperOptions.value
        if (!options.some(opt => opt.value === value)) {
          callback(new Error('选择的选项不存在'))
        } else {
          callback()
        }
      }
    }],
    timeRange: [{ 
      required: true,
      validator: (_, value, callback) => {
        if (!value || value.length !== 2) {
          callback(new Error('请选择完整时间范围'))
        } else {
          callback()
        }
      }
    }]
  }
  
  watch(() => examForm.value.examType, (newType) => {
        if (!isEditMode.value) {
        examForm.value.paperIdentifier = null;
    }
    loadPaperOptions(newType)
  })
  
  onMounted(async () => {
    await fetchClasses()
    await loadPaperOptions('fixed')
    fetchExams()
  })
  
  const fetchExams = async () => {
  try {
    const res = await listExams()
    examList.value = res.data.examList.map(exam => ({
      examId: exam.id, 
      examName: exam.name, 
      classId: exam.classId,
      examType: exam.examType,
      totalScore: exam.totalScore,
      requiresManualGrading: exam.requiresManualGrading,
      startTime: exam.startTime,
      endTime: exam.endTime,
      canViewResults: exam.canViewResults,
      paperId: exam.paperId,      
      paperRuleId: exam.paperRuleId,
      className: exam.className,
      timeRange: [exam.startTime, exam.endTime]
    }))
  } catch (error) {
    ElMessage.error('考试列表加载失败')
  }
}

  
  const fetchClasses = async () => {
    try {
      const res = await getClassList()
      classList.value = res.data?.classList || []
    } catch (error) {
      ElMessage.error('班级列表加载失败')
    }
  }
  
  const loadPaperOptions = async (type) => {
    try {
      if (type === 'fixed') {
        const res = await getPaperList()
        fixedPapers.value = res.data.paperList.map(paper => ({
          value: paper.id,
          name: paper.name,
          totalScore: paper.totalScore
        }))
      } else {
        const res = await listPaperRules()
        paperRules.value = res.data.ruleList.map(rule => ({
          value: rule.id,
          name: rule.name,
          totalScore:  rule.totalScore
        }))
      }
    } catch (error) {
      ElMessage.error('数据加载失败')
    }
  }
  
  const submitForm = async () => {
    try {
        await formRef.value.validate()
      const payload = {
        name: examForm.value.examName,
        classId: examForm.value.classId,
        examType: examForm.value.examType,
        startTime: dayjs(examForm.value.timeRange[0]).format('YYYY-MM-DD HH:mm'),
        endTime: dayjs(examForm.value.timeRange[1]).format('YYYY-MM-DD HH:mm'),
        totalScore: examForm.value.totalScore,
        requiresManualGrading: examForm.value.requiresManualGrading,
        canViewResults: examForm.value.canViewResults,
        paperId: examForm.value.examType === 'fixed' ? examForm.value.paperIdentifier : -1,
        paperRuleId: examForm.value.examType === 'random' ? examForm.value.paperIdentifier : -1
      }
  
      if (isEditMode.value) {
        await updateExam(currentExamId.value, payload)
        ElMessage.success('考试更新成功')
      } else {
        await createExam(payload)
        ElMessage.success('考试创建成功')
      }
      
      examDialogVisible.value = false
      fetchExams()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }
  
  const handleClassChange = () => {
    examForm.value.paperIdentifier = null
    loadPaperOptions(examForm.value.examType)
  }
  
  const handlePaperSelect = (val) => {
    const selectedItem = paperOptions.value.find(item => item.value === val)
    if (selectedItem) {
      examForm.value.totalScore = selectedItem.totalScore
    }
  }
  
  const openCreateDialog = () => {
    resetForm()
    examDialogVisible.value = true
    isEditMode.value = false
  }
  
  const handleEdit = async (row) => {
  try {
    await loadPaperOptions(row.examType)
    const identifierField = row.examType === 'fixed' ? 'paperId' : 'paperRuleId'
    
    examForm.value = {
      examName: row.examName,
      classId: row.classId,
      examType: row.examType,
      paperIdentifier: row[identifierField],
      timeRange: [row.startTime, row.endTime],
      totalScore: row.totalScore,
      requiresManualGrading: row.requiresManualGrading,
      canViewResults: row.canViewResults
    }
    
    currentExamId.value = row.examId
    isEditMode.value = true
    examDialogVisible.value = true
  } catch (error) {
    ElMessage.error('初始化编辑数据失败')
  }
}

  const handleDelete = async (row) => {
    try {
      await ElMessageBox.confirm(`确定删除考试「${row.examName}」吗？`, '警告', {
        type: 'warning'
      })
      await deleteExam(row.examId)
      ElMessage.success('删除成功')
      fetchExams()
    } catch (error) {}
  }
  
  const resetForm = () => {
    formRef.value?.resetFields()
    examForm.value = {
      examName: '',
      classId: null,
      examType: 'fixed',
      paperIdentifier: null,
      timeRange: [],
      totalScore: 100,
      requiresManualGrading: false,
      canViewResults: false
    }
  }
  
  const paperOptions = computed(() => {
    return examForm.value.examType === 'fixed' 
      ? fixedPapers.value
      : paperRules.value
  })
  
  const filteredExams = computed(() => {
    return examList.value.filter(exam => 
      exam.examName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
</script>

  
  
  <style scoped>
  .exam-management {
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
  
  .content-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  </style>
  