<template>
    <div class="exam-detail">
      <el-card class="header-card">
        <h2>考试详情</h2>
      </el-card>
  
      <el-card class="content-card">
        <el-descriptions title="考试信息" :column="2" border>
          <el-descriptions-item label="考试名称">
            {{ examDetail.name }}
          </el-descriptions-item>
  
          <el-descriptions-item label="我的考试状态">
            <el-tag :type="getStatusTag(examDetail.status)">
              {{ getStatusText(examDetail.status) }}
            </el-tag>
          </el-descriptions-item>
  
          <el-descriptions-item label="考试时间状态">
            <el-tag :type="getTimeStatusTag()">
              {{ getTimeStatusText() }}
            </el-tag>
          </el-descriptions-item>
  
          <el-descriptions-item label="总分">{{ examDetail.totalScore }}</el-descriptions-item>
          <el-descriptions-item label="是否需人工阅卷">
            {{ examDetail.requiresManualGrading ? '是' : '否' }}
          </el-descriptions-item>
  
          <el-descriptions-item label="考试时间">
            {{ examDetail.startTime }} ~ {{ examDetail.endTime }}
          </el-descriptions-item>
  
          <el-descriptions-item label="所属班级">{{ examDetail.className }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ examDetail.createBy }}</el-descriptions-item>
  
          <el-descriptions-item label="考试成绩">
            <span v-if="examDetail.status === 'submitted' || examDetail.status === 'graded'">
              {{ examDetail.score >= 0 ? examDetail.score : '未评定' }}
            </span>
            <span v-else>未完成考试</span>
          </el-descriptions-item>
        </el-descriptions>
  
        <div class="action-buttons">
          <el-button
            v-if="examDetail.status === 'not_started' || examDetail.status === 'ongoing'"
            type="primary"
            class="btn-primary"
            @click="enterExam"
          >
            进入考试
          </el-button>
  
          <el-button
            v-else-if="examDetail.status === 'submitted' || examDetail.status === 'graded'"
            :disabled="!examDetail.canViewResults"
            type="success"
            class="btn-success"
            @click="viewExamResult"
          >
            查看详情
          </el-button>
  
          <el-tooltip v-if="!examDetail.canViewResults" content="考试成绩不可查看" placement="top">
            <el-icon><el-icon-warning /></el-icon>
          </el-tooltip>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { getExamDetail ,startExam} from '@/api/exam'
  
  const route = useRoute()
  const router = useRouter()
  const examDetail = ref({})
  
  onMounted(async () => {
    const examId = Number(route.params.id)
    await fetchExamDetail(examId)
  })
  
  // 获取考试详情
  const fetchExamDetail = async (examId) => {
    try {
      const res = await getExamDetail(examId)
      examDetail.value = res.data
    } catch (error) {
      ElMessage.error('考试详情加载失败，请稍后重试')
    }
  }
  
  // 进入考试
  const enterExam = async () => {
  try {
    const res = await startExam(examDetail.value.examId)
    // 如果返回的数据中message为 "考试开始成功"，则跳转到考试页面
    if (res.data.message === '考试开始成功') {
      router.push(`/my-exams/onging/${res.data.attemptId}`)
    } else {
      ElMessage.error(res.data.message || '考试开始失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '请求失败，请稍后重试')
  }
}
  
  // 查看考试结果
  const viewExamResult = () => {
    if (!examDetail.value.canViewResults) {
      ElMessage.warning('考试成绩不可查看')
      return
    }
    router.push(`/my-exams/result/${examDetail.value.examId}`)
  }
  
  // 获取考试状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'not_started': return '未开始'
      case 'ongoing': return '进行中'
      case 'submitted': return '已提交'
      case 'graded': return '已评分'
      default: return '未知状态'
    }
  }
  
  // 获取状态对应的标签类型
  const getStatusTag = (status) => {
    switch (status) {
      case 'not_started': return 'info'
      case 'ongoing': return 'success'
      case 'submitted': return 'warning'
      case 'graded': return 'success'
      default: return 'danger'
    }
  }
  
  // 获取考试时间状态
  const getTimeStatusText = () => {
    const now = new Date()
    const startTime = new Date(examDetail.value.startTime)
    const endTime = new Date(examDetail.value.endTime)
  
    if (now < startTime) return '未开始'
    if (now >= startTime && now <= endTime) return '进行中'
    return '已结束'
  }
  
  // 获取考试时间状态的标签颜色
  const getTimeStatusTag = () => {
    const now = new Date()
    const startTime = new Date(examDetail.value.startTime)
    const endTime = new Date(examDetail.value.endTime)
  
    if (now < startTime) return 'info'
    if (now >= startTime && now <= endTime) return 'success'
    return 'danger'
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
    font-size: 20px;
    font-weight: bold;
    border-radius: 10px;
  }
  
  .content-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    padding: 20px;
  }
  
  .action-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .btn-primary {
    background-color: #409eff;
    color: white;
    font-size: 16px;
    padding: 10px 20px;
    border-radius: 6px;
  }
  
  .btn-success {
    background-color: #67c23a;
    color: white;
    font-size: 16px;
    padding: 10px 20px;
    border-radius: 6px;
  }
  
  .el-tag {
    font-size: 14px;
    padding: 5px 10px;
    border-radius: 6px;
    font-weight: bold;
  }
  </style>
  