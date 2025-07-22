import axios from "axios";
import { useAuthStore } from "@/store/auth";

// API配置
const API_PREFIX = "http://127.0.0.1:8886/exam";

const getAuthHeaders = () => {
  const authStore = useAuthStore();
  const token = authStore.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 考试管理接口
export const createExam = (examData) =>
  axios.post(`${API_PREFIX}/createExam`, examData, { headers: getAuthHeaders() });

export const deleteExam = (examId) =>
  axios.post(`${API_PREFIX}/deleteExam`, { examId }, { headers: getAuthHeaders() });

export const updateExam = (examId, examData) =>
  axios.post(`${API_PREFIX}/updateExam`, { examId, ...examData }, { headers: getAuthHeaders() });

export const getExamDetail = (examId) =>
  axios.post(`${API_PREFIX}/getExamDetail`, {examId} , { headers: getAuthHeaders() });

  export const ExamDetail = (examId) =>
  axios.post(`${API_PREFIX}/ExamDetail`, {examId} , { headers: getAuthHeaders() });

export const listExams = (queryParams) =>
  axios.post(`${API_PREFIX}/listExams`, queryParams, { headers: getAuthHeaders() });

// 成绩管理接口
export const getExamStatistics = (examId) =>
  axios.post(`${API_PREFIX}/getExamStatistics`, { examId }, { headers: getAuthHeaders() });

export const getStudentScores = (examId, studentId) =>
  axios.post(`${API_PREFIX}/getStudentScores`, { examId, studentId }, { headers: getAuthHeaders() });

  export const exportScores = (examId) =>
  axios.post(
    `${API_PREFIX}/exportScores`,
    { examId },
    { headers: getAuthHeaders() }
  )

// 手动阅卷接口
export const listManualGrading = (examId) =>
  axios.post(`${API_PREFIX}/listManualGrading`,  examId , { headers: getAuthHeaders() });
  
export const ManualScore = (examId) =>
  axios.post(`${API_PREFIX}/ManualScore`, examId , { headers: getAuthHeaders() });

export const submitManualScore = (gradingData) =>
  axios.post(`${API_PREFIX}/submitManualScore`, gradingData, { headers: getAuthHeaders() });

// 学生考试接口
export const startExam = (examId) =>
  axios.post(`${API_PREFIX}/startExam`, { examId }, { headers: getAuthHeaders() });

export const submitAnswer = (answerData) =>
  axios.post(`${API_PREFIX}/submitAnswer`, answerData, { headers: getAuthHeaders() });

export const getExamResult = (examId) =>
  axios.post(`${API_PREFIX}/getExamResult`, { examId }, { headers: getAuthHeaders() });

export const submitExam = (data) =>
  axios.post(`${API_PREFIX}/submitExam`, data , { headers: getAuthHeaders() });

  // 获取不带答案的试卷
export const getPaperForStudent = (attemptId) => {
  return axios.post(
    `${API_PREFIX}/getPaperForStudent`, 
    attemptId , 
    { headers: getAuthHeaders() }
  );
};
