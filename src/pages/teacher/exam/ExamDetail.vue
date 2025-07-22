<template>
    <div class="exam-detail">
      <el-card class="header-card">
      <div class="header-content">
        <h2>考试详情</h2>
        <!-- 新增刷新按钮 -->
        <el-button
          type="primary"
          size="small"
          :icon="Refresh"
          @click="handleRefresh"
          :loading="loading"
          plain
        >
          刷新
        </el-button>
      </div>
    </el-card>
      <el-card class="content-card">
        <!-- 基本信息展示 -->
        <div class="exam-info">
          <div><strong>考试名称：</strong>{{ examDetail.name }}</div>
          <div><strong>所属班级：</strong>{{ examDetail.className }}</div>
          <div><strong>创建者：</strong>{{ examDetail.createBy }}</div>
          <div><strong>考试总分：</strong>{{ examDetail.totalScore }}</div>
          <div><strong>考试时间：</strong>{{ examDetail.startTime }} 至 {{ examDetail.endTime }}</div>
          <div v-if="examDetail.requiresManualGrading">
            <strong>待批阅试卷：</strong>{{ examDetail.pendingManualGradingCount }} 份
          </div>
        </div>
  
        <!-- 考生状态列表 -->
        <el-table :data="examDetail.students" stripe style="width: 100%">
            <el-table-column prop="studentName" label="学生姓名" width="150"></el-table-column>

            <!-- 新增学号列 -->
            <el-table-column prop="userName" label="学号" width="150"></el-table-column>

            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                <el-tag :type="getStatusTag(row)">{{ getStatusText(row) }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="score" label="成绩" width="100"></el-table-column>

            <!-- 开始作答时间 -->
            <el-table-column label="开始作答时间" width="150">
                <template #default="{ row }">
                {{ row.status === 'not_started' ? '-' : row.startTime }}
                </template>
            </el-table-column>

            <!-- 考试结束时间 -->
            <el-table-column label="结束考试时间" width="150">
                <template #default="{ row }">
               {{ ['submitted', 'graded'].includes(row.status) ? row.submitTime : '-' }}
                </template>
            </el-table-column>
            </el-table>
  
        <!-- 操作按钮 -->
        <div class="actions">
          <!-- 当考试需要人工阅卷且待批阅数量大于 0 时显示 -->
          <el-button 
            v-if="examDetail.requiresManualGrading && examDetail.pendingManualGradingCount > 0" 
            type="warning" 
            size="small" 
            @click="handleManualGrading">
            人工阅卷
          </el-button>
          <!-- 始终显示成绩详情按钮 -->
          <el-button type="success" size="small" @click="handleScoreDetail">
            成绩详情
          </el-button>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ExamDetail } from '@/api/exam'
  import { Refresh } from '@element-plus/icons-vue' 
  
  const route = useRoute()
  const router = useRouter()
  const loading = ref(false)
  const examId = Number(route.params.id)
  const examDetail = ref({
    name: '',
    className: '',
    createBy: '',
    totalScore: 0,
    requiresManualGrading: false,
    startTime: '',
    endTime: '',
    pendingManualGradingCount: 0,
    students: [] // 每个元素为 { studentId, studentName, startTime, submitTime, status, score }
  })
  
  onMounted(async () => {
    await fetchExamDetail()
  })
  
  const fetchExamDetail = async () => {
    try {
      const res = await ExamDetail(examId)
      examDetail.value = res.data
    } catch (error) {
      ElMessage.error('考试详情加载失败')
    }
  }
  const handleRefresh = async () => {
  loading.value = true // 按钮显示加载状态
  try {
    await fetchExamDetail()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false // 关闭加载状态
  }
  }
  const getStatusText = (student) => {
    switch (student.status) {
      case 'not_started': return '未开始'
      case 'ongoing': return '进行中'
      case 'submitted': return '已提交'
      case 'graded': return '已评分'
      default: return '未知状态'
    }
  }
  
  const getStatusTag = (student) => {
    switch (student.status) {
      case 'not_started': return 'info'
      case 'ongoing': return 'success'
      case 'submitted': return 'warning'
      case 'graded': return 'success'
      default: return 'danger'
    }
  }
  
  // 人工阅卷按钮：跳转到人工批改页面
  const handleManualGrading = () => {
    router.push(`/exam-management/grading/${examId}`)
  }
  
  // 成绩详情按钮：跳转到成绩详情页面
  const handleScoreDetail = () => {
    router.push(`/exam-management/scores/${examId}`)
  }
  </script>
  
  <style scoped>
  .exam-detail {
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
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .exam-info {
    margin-bottom: 20px;
    font-size: 16px;
  }
  
  .exam-info > div {
    margin-bottom: 10px;
  }
  
  .actions {
    margin-top: 20px;
    display: flex;
    gap: 15px;
    justify-content: flex-end;
  }
  </style>
  