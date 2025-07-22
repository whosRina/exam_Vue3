import axios from "axios";
import { useAuthStore } from "@/store/auth";

// API前缀
const API_PREFIX = "http://127.0.0.1:8887/questions";

// 设置请求头，添加token
const getAuthHeaders = () => {
  const authStore = useAuthStore(); // 获取authStore
  const token = authStore.token; // 从store中获取token
  return token ? { Authorization: `Bearer ${token}` } : {}; // 将token添加到请求头
};

// 创建题库
export const createBank = (bankData) => {
  return axios.post(
    `${API_PREFIX}/createBank`, 
    {BankName:bankData},  // 传输题库数据
    { headers: getAuthHeaders() }
  );
};

// 更新题库
export const updateBank = (bankData) => {
  return axios.post(
    `${API_PREFIX}/updateBank`, 
    bankData,  // 传输题库数据
    { headers: getAuthHeaders() }
  );
};

// 删除题库
export const deleteBank = (bankId) => {
  return axios.post(
    `${API_PREFIX}/deleteBank`, 
    { id: bankId },  // 删除的题库ID
    { headers: getAuthHeaders() }
  );
};

// 获取题库列表
export const getBankList = () => {
  return axios.get(`${API_PREFIX}/bankList`, {
    headers: getAuthHeaders(), // 传递认证头部
  });
};
export const uploadWordQuestions = (parms) => {
  return axios.post(`${API_PREFIX}/parseWordQuestions`,parms, {
    headers: getAuthHeaders(), // 传递认证头部
  });
};

// 获取题库详细信息
export const getBankDetail = (bankId) => {
  return axios.post(
    `${API_PREFIX}/bankDetail`, 
    {id: bankId }, // 请求参数中传递题库ID
    { headers: getAuthHeaders() }
  );
};



export const createQuestion = async (data) => {
  return axios.post(
    `${API_PREFIX}/createQuestion`, 
    data,
    { headers: getAuthHeaders() }
  );
};

// 获取题目列表
export function getQuestionList(data) {
  return axios.post(
    `${API_PREFIX}/questionList`, 
    data,
    { headers: getAuthHeaders()}
  );
};

// 删除题目
export function deleteQuestion(id) {
  return axios.post(
    `${API_PREFIX}/deleteQuestion`, 
    { id: id },
    { headers: getAuthHeaders()}
  );
}

export const updateQuestion = async (data) => {
  return axios.post(
    `${API_PREFIX}/updateQuestion`, 
    data,
    { headers: getAuthHeaders() }
  );
};