import axios from "axios";
import { useAuthStore } from "@/store/auth";

// API前缀
const API_PREFIX = "http://127.0.0.1:8886/exam";

// 设置请求头，添加token
const getAuthHeaders = () => {
  const authStore = useAuthStore(); // 获取authStore
  const token = authStore.token; // 从store中获取token
  return token ? { Authorization: `Bearer ${token}` } : {}; // 将token添加到请求头
};

// 获取试卷列表
export const getPaperList = (data) => {
  return axios.post(
    `${API_PREFIX}/listPapers`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 创建试卷
export const createPaper = (data) => {
  return axios.post(
    `${API_PREFIX}/createPaper`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 更新试卷
export const updatePaper = (data) => {
  return axios.post(
    `${API_PREFIX}/updatePaper`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 删除试卷
export const deletePaper = (paperId) => {
  return axios.post(
    `${API_PREFIX}/deletePaper`, 
    paperId, 
    { headers: getAuthHeaders() }
  );
};

// 获取试卷详情
export const getPaperDetail = (paperId) => {
  return axios.post(
    `${API_PREFIX}/getPaperDetail`, 
    { id: paperId }, 
    { headers: getAuthHeaders() }
  );
};

// 获取试卷规则详情
export const getPaperRuleDetail = (ruleId) => {
  return axios.post(
    `${API_PREFIX}/getPaperRuleDetail`, 
    { id: ruleId }, 
    { headers: getAuthHeaders() }
  );
};

// 创建试卷规则
export const createPaperRule = (data) => {
  return axios.post(
    `${API_PREFIX}/createPaperRule`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 更新试卷规则
export const updatePaperRule = (data) => {
  return axios.post(
    `${API_PREFIX}/updatePaperRule`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 删除试卷规则
export const deletePaperRule = (ruleId) => {
  return axios.post(
    `${API_PREFIX}/deletePaperRule`, 
     ruleId , 
    { headers: getAuthHeaders() }
  );
};

// 生成规则试卷（教师）
export const generatePaperByRuleForTeacher = (data) => {
  return axios.post(
    `${API_PREFIX}/generatePaperByRuleForTeacher`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 获取规则试卷（学生）
export const getPaperByRuleForStudent = (data) => {
  return axios.post(
    `${API_PREFIX}/getPaperByRuleForStudent`, 
    data, 
    { headers: getAuthHeaders() }
  );
};

// 获取带答案的试卷
export const getPaperWithAnswers = (paperId) => {
  return axios.post(
    `${API_PREFIX}/getPaperWithAnswers`, 
     paperId, 
    { headers: getAuthHeaders() }
  );
};



// 获取试卷规则列表
export const listPaperRules = () => {
  return axios.post(
    `${API_PREFIX}/listPaperRules`, 
    {}, 
    { headers: getAuthHeaders() }
  );
};
