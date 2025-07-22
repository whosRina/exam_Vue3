import axios from "axios";
import { useAuthStore } from "@/store/auth";

// API前缀
const API_PREFIX = "http://127.0.0.1:8888/classes";

// 设置请求头，添加token
const getAuthHeaders = () => {
  const authStore = useAuthStore(); // 获取authStore
  const token = authStore.token; // 从store中获取token
  return token ? { Authorization: `Bearer ${token}` } : {}; // 将token添加到请求头
};

// 创建班级
export const createClass = (classData) => {
  return axios.post(
    `${API_PREFIX}/create`, 
    classData,  // 传输班级数据
    { headers: getAuthHeaders() }
  );
};

// 更新班级
export const updateClass = (classData) => {
  return axios.post(
    `${API_PREFIX}/update`, 
    classData,  // 传输班级数据
    { headers: getAuthHeaders() }
  );
};

// 删除班级
export const deleteClass = (classId) => {
  return axios.post(
    `${API_PREFIX}/delete`, 
    { classId: classId },  // 删除的班级ID
    { headers: getAuthHeaders() }
  );
};

// 获取班级列表
export const getClassList = () => {
  return axios.get(`${API_PREFIX}/classList`, {
    headers: getAuthHeaders(), // 传递认证头部
  });
};

// 获取班级详细信息
export const getClassDetail = (classId) => {
  return axios.post(`${API_PREFIX}/detail`, 
    { classId: classId }, // 请求参数中传递班级ID
    {headers: getAuthHeaders()}
  );
};

// 加入班级
export const joinClass = (classCode) => {
  return axios.post(
    `${API_PREFIX}/joinClass`, 
    { classCode: classCode },  // 班级邀请码
    { headers: getAuthHeaders() }
  );
};


export const deleteMember = (memberId) => {
  return axios.post(`${API_PREFIX}/deleteMember`, 
    { memberId: memberId }, // 请求参数中传递班级成员ID
    {headers: getAuthHeaders()}
  );
};