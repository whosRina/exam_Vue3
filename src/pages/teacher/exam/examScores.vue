<template>
  <div class="exam-detail">
    <el-card class="header-card">
      <div class="flex-between">
        <h2>成绩详情 - {{ examName }}</h2>
        <el-button type="success" @click="exportScore">导出成绩单</el-button>
      </div>
      <div class="exam-info">
        <div><strong>总分：</strong>{{ totalScore }} (合格线：{{ passScore }}分)</div>
        <div><strong>考试人数：</strong>{{ students.length }}人</div>
        <div><strong>及格人数：</strong>{{ passCount }}人</div>
      </div>
    </el-card>
    <el-card class="content-card">
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <div class="chart-container">
            <h3 class="chart-title">分数段分布分析</h3>
            <div ref="pieChart" class="chart"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h3 class="chart-title">分数段人数统计</h3>
            <div ref="barChart" class="chart"></div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ExamDetail, exportScores } from '@/api/exam'
import * as echarts from 'echarts'
const route = useRoute()
const examId = Number(route.params.id)
const examName = ref('')
const students = ref([])
const totalScore = ref(100)
const pieChart = ref(null)
const barChart = ref(null)
// 动态分数段计算（核心改进）
const scoreLevels = computed(() => {
  const calc = totalScore.value
  const poorEnd = Math.floor(calc * 0.6) - 1
  const mediumEnd = Math.floor(calc * 0.8) - 1
  return [
    { 
      level: '优秀',
      range: [mediumEnd + 1, calc],
      color: '#91cc75',
      percentage: '80%-100%'
    },
    {
      level: '中等',
      range: [poorEnd + 1, mediumEnd],
      color: '#fac858',
      percentage: '60%-80%'
    },
    {
      level: '待提高',
      range: [0, poorEnd],
      color: '#ee6666',
      percentage: '0%-60%'
    }
  ]
})
const passScore = computed(() => Math.round(totalScore.value * 0.6))
const passCount = computed(() => 
  students.value.filter(s => s.score >= passScore.value).length
)
onMounted(async () => {
  await fetchExamScores()
  nextTick(() => {
    setTimeout(() => {
      initCharts()
    }, 0) 
  })
})

// 加载考试数据
const fetchExamScores = async () => {
  try {
    const res = await ExamDetail(examId)
    examName.value = res.data.name
    totalScore.value = res.data.totalScore
    students.value = res.data.students.map(s => ({
      ...s,
      score: parseFloat(s.score),
      // 添加百分比字段方便后续计算
      percentage: (parseFloat(s.score) / res.data.totalScore) * 100
    }))
  } catch (error) {
    ElMessage.error('获取成绩详情失败')
  }
}
// 初始化图表（联动处理）
let pieInstance, barInstance
const initCharts = () => {
  pieInstance = echarts.init(pieChart.value)
  barInstance = echarts.init(barChart.value)
  updateCharts()
}
// 图表数据更新
const updateCharts = () => {
  // 饼图数据
  const pieData = scoreLevels.value.map(level => {
    const count = students.value.filter(s => 
      s.score >= level.range[0] && s.score <= level.range[1]
    ).length
    return {
      ...level,
      value: count,
      label: `${level.level} (${level.range.join('-')}分)`
    }
  })
  // 柱状图数据
  const barCategories = scoreLevels.value.slice().reverse().map(level =>
    `${level.range[0]}-${level.range[1]}分`
  )
  const barValues = scoreLevels.value.slice().reverse().map(level =>
    students.value.filter(s => 
      s.score >= level.range[0] && s.score <= level.range[1]
    ).length
  )
  // 饼图配置
  pieInstance.setOption({
    tooltip: {
      formatter: ({ data }) => `
        <strong>${data.level}</strong><br>
        人数：${data.value}人<br>
        占比：${((data.value / students.value.length) * 100).toFixed(1)}%<br>
        分数段：${data.range.join('-')}分
      `
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: pieData.map(d => ({
        name: d.label,
        value: d.value,
        itemStyle: { color: d.color }
      })),
      label: {
        formatter: ({ name, percent }) => 
          `${name}\n{rate|${percent}%}`
        ,
        rich: { rate: { fontWeight: 'bold', fontSize: 14 } }
      }
    }]
  })
  // 柱状图配置
  barInstance.setOption({
    xAxis: {
      type: 'category',
      data: barCategories,
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value' },
    series: [{
      data: barValues.map((v, i) => ({
        value: v,
        itemStyle: { color: scoreLevels.value[i].color }
      })),
      type: 'bar',
      barWidth: '45%',
      label: {
        show: true,
        position: 'top',
        formatter: ({ value }) => value || ''
      }
    }],
    // 添加及格线
    graphic: [{
      type: 'line',
      zlevel: 100,
      shape: {
        x1: scoreLevels.value[1].range[0], // 中等段起始分数
        y1: 0,
        x2: scoreLevels.value[1].range[0],
        y2: Math.max(...barValues) * 1.1
      },
      style: {
        stroke: '#ff0000',
        lineWidth: 2,
        lineDash: [5, 5]
      }
    }]
  })
}



const exportScore = async () => {
  try {
    const res = await exportScores(examId) // 调用 API
    console.log('exportScores 返回值:', res)
    const fileStream = res.data.fileStream
    let fileName = res.data.fileName || `${examName.value}_成绩单.csv`

    if (!fileStream) {
      ElMessage.error('文件数据为空')
      return
    }
    // **Base64 解码**
    const byteCharacters = atob(res.data.fileStream)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)

    // **创建 Blob**
    const blob = new Blob([byteArray], { type: 'text/csv;charset=utf-8' })

    // **获取文件名**
    
    if (!fileName.endsWith('.csv')) {
      fileName += '.csv'
    }

    // **下载文件**
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('成绩导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
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
  background-color: #409eff !important;
  color: white;
}
.header-card h2 {
  color: inherit;
  margin: 0;
}
.header-card :v-deep .el-card__body {
  padding: 20px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.content-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.content-card :v-deep .el-card__body {
  padding: 20px;
}
.exam-info {
  padding: 15px;
  background-color: rgba(255,255,255,0.15);
  border-radius: 4px;
  font-size: 16px;
}
.exam-info div {
  margin-bottom: 8px;
}
.exam-info strong {
  color: rgba(255,255,255,0.9);
}
.chart-container {
  padding: 15px;
}
.chart-title {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
}
.chart {
  width: 100%;
  height: 400px;
}

.el-button {
  margin-left: 10px;
}
</style>