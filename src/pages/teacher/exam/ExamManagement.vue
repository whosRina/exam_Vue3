<template>
    <div class="exam-management">
      <el-card class="header-card">
        <h2>考试列表</h2>
      </el-card>
  
      <el-card class="content-card">
        <div class="toolbar">
          <el-input v-model="searchQuery" placeholder="搜索考试名称..." clearable style="width: 240px;" />
        </div>
        <el-table :data="filteredExams" stripe style="width: 100%">
          <el-table-column prop="examName" label="考试名称"></el-table-column>
          <el-table-column prop="className" label="所属班级"></el-table-column>
          <el-table-column prop="createBy" label="创建者" width="150"></el-table-column>
          <el-table-column prop="totalScore" label="总分" width="100"></el-table-column>
          <el-table-column prop="timeRange" label="考试时间" width="260"></el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { listExams } from '@/api/exam'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const searchQuery = ref('')
  const examList = ref([])
  
  onMounted(async () => {
    await fetchExams()
  })
  
  const fetchExams = async () => {
    try {
      const res = await listExams()  
      // 映射字段为页面需要的格式
      examList.value = res.data.examList.map(exam => ({
        examId: exam.id,
        examName: exam.name,
        className: exam.className || '未知班级',
        createBy: exam.createBy || '未知创建者',
        totalScore: exam.totalScore,
        startTime: exam.startTime,
        endTime: exam.endTime,
        timeRange: [exam.startTime, exam.endTime],
        requiresManualGrading: exam.requiresManualGrading,
        pendingManualGradingCount: exam.pendingManualGradingCount // 待批阅数量
      }))
    } catch (error) {
      ElMessage.error('考试列表加载失败')
    }
  }
  
  const handleView = (exam) => {
    // 跳转到考试详情页面
    router.push(`/exam-management/detail/${exam.examId}`)
  }
  
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
  