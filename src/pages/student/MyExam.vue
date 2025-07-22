<template>
    <div class="my-exams">
      <el-card class="header-card">
        <h2>我的考试</h2>
      </el-card>
  
      <el-card class="content-card">
        <div class="toolbar">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索考试名称..." 
            clearable 
            style="width: 240px;" 
          />
        </div>
  
        <el-table :data="filteredExams" stripe style="width: 100%">
          <el-table-column prop="examName" label="考试名称"></el-table-column>
          <el-table-column prop="className" label="所属班级"></el-table-column>
          <el-table-column prop="createBy" label="创建者" width="150"></el-table-column>
          <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
          <el-table-column prop="timeRange" label="考试时间" width="260"></el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row)">{{ getExamStatus(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleEnterExam(row)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import dayjs from 'dayjs'
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { listExams } from '@/api/exam'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const searchQuery = ref('')
  const examList = ref([])
  
  onMounted(async () => {
    await fetchStudentExams()
  })
  
  const fetchStudentExams = async () => {
    try {
      const res = await listExams()
      // 将返回数据映射为页面所需格式，确保包含className和createBy 字段
      examList.value = res.data.examList.map(exam => ({
        examId: exam.id,
        examName: exam.name,
        className: exam.className || '未知班级',
        createBy: exam.createBy || '未知创建者',
        totalScore: exam.totalScore,
        startTime: exam.startTime,
        endTime: exam.endTime,
        timeRange: [exam.startTime, exam.endTime]
      }))
    } catch (error) {
      ElMessage.error('考试列表加载失败')
    }
  }
  
  // 获取考试状态
  const getExamStatus = (exam) => {
    const now = dayjs()
    if (now.isBefore(dayjs(exam.startTime))) return '未开始'
    if (now.isAfter(dayjs(exam.endTime))) return '已结束'
    return '进行中'
  }
  
  // 根据状态返回不同的标签类型
  const getStatusTag = (exam) => {
    const status = getExamStatus(exam)
    if (status === '未开始') return 'info'
    if (status === '进行中') return 'success'
    return 'danger'
  }
  

  // 点击查看按钮，跳转到考试详细页面
  const handleEnterExam = (exam) => {
    router.push(`/my-exams/detail/${exam.examId}`)
  }
  
  // 搜索过滤
  const filteredExams = computed(() => {
    return examList.value.filter(exam =>
      exam.examName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
  </script>
  
  <style scoped>
  .my-exams {
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
  