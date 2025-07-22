import axios from "axios";
import { useAuthStore } from "@/store/auth";
const API_PREFIX = "http://127.0.0.1:8889/user";


// 设置请求头，添加 token
const getAuthHeaders = () => {
    const authStore = useAuthStore(); // 在需要时获取store
    const token = authStore.token; // 从 store中获取token
    return token ? { Authorization: `Bearer ${token}` } : {}; // 将token添加到请求头
  };
  

export const getUserList = () => {
  return axios.get(`${API_PREFIX}/userList`, {
    headers: getAuthHeaders(), // 将请求头添加到请求中
  });
};

// 创建用户
export const createUser = (userData) => {
    return axios.post(`${API_PREFIX}/create`, 
      userData,  // 确保按照后端结构体格式传输
      { headers: getAuthHeaders() }
    );
  };
  
  // 更新用户
  export const updateUser = (userData) => {
    return axios.post(`${API_PREFIX}/update`,  
    userData,// 确保按照后端结构体格式传输
    { headers: getAuthHeaders() }
  );
};

  
  // 删除用户
  export const deleteUser = (id) => {
    return axios.post(`${API_PREFIX}/delete`, id, {
      headers: getAuthHeaders(),
    });
  };

  export const createUsersByFile = (params) => {
    return axios.post(`${API_PREFIX}/createByFile`,params , {
      headers: getAuthHeaders(),
    });
  }


  export const getUserDetail = () => {
    return axios.get(`${API_PREFIX}/detail` , {
      headers: getAuthHeaders(),
    });
  };
  
  export const updatePassword = (data) => {
    return axios.post(`${API_PREFIX}/updatePwd`,data, {
      headers: getAuthHeaders(),
    });
  };