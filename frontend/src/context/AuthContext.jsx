import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内使用');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user');

      if (token && savedUserStr) {
        const localMode = (import.meta?.env?.VITE_LOCAL_AUTH === 'true' || import.meta?.env?.VITE_LOCAL_AUTH === true);
        // 仅当显式开启本地模式时，才接受 local- token
        if (token.startsWith('local-')) {
          if (localMode) {
            try {
              const localUser = JSON.parse(savedUserStr);
              setUser(localUser);
              setIsAuthenticated(true);
            } catch (e) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
            setLoading(false);
            return;
          } else {
            // 未开启本地模式，则清理 local- token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        try {
          // 验证token是否有效（后端）
          const response = await authAPI.getMe();
          setUser(response.data.data);
          setIsAuthenticated(true);
        } catch (error) {
          // token无效，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 本地用户读取/写入工具
  const getLocalUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('local_users') || '[]');
    } catch {
      return [];
    }
  };
  const setLocalUsers = (users) => {
    localStorage.setItem('local_users', JSON.stringify(users));
  };

  const useLocalAuth = () => {
    const flag = import.meta?.env?.VITE_LOCAL_AUTH;
    return flag === 'true' || flag === true; // 允许通过环境变量强制本地模式
  };

  // 注册（带本地存储兜底）
  const register = async (userData) => {
    // 若显式启用本地模式，直接走本地
    if (useLocalAuth()) {
      return localRegister(userData);
    }

    try {
      const response = await authAPI.register(userData);
      const { token, user: userInfo, success } = response.data || {};
      // 远端返回成功且有token与用户信息，才算成功
      if (success !== false && token && userInfo) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
        setIsAuthenticated(true);
        return { success: true, user: userInfo };
      }
      // 远端未返回有效数据，则本地兜底
      return localRegister(userData, new Error('远端注册返回无效数据'));
    } catch (error) {
      // 远端失败则尝试本地注册兜底
      return localRegister(userData, error);
    }
  };

  const localRegister = async (userData, remoteError) => {
    const { name, email, password, role = 'student' } = userData;
    const users = getLocalUsers();
    if (users.some(u => u.email === email)) {
      return { success: false, message: '该邮箱已被注册（本地）' };
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // 仅用于本地开发调试，请勿用于生产
      role,
    };
    users.push(newUser);
    setLocalUsers(users);

    const token = `local-${newUser.id}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    const msg = remoteError ? '后端不可用，已切换到本地注册成功' : undefined;
    return { success: true, user: newUser, message: msg };
  };

  // 登录（带本地存储兜底）
  const login = async (credentials) => {
    // 若显式启用本地模式，直接走本地
    if (useLocalAuth()) {
      return localLogin(credentials);
    }

    try {
      const response = await authAPI.login(credentials);
      const { token, user: userInfo } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      setIsAuthenticated(true);
      
      return { success: true, user: userInfo };
    } catch (error) {
      // 远端失败则尝试本地登录兜底
      const localRes = await localLogin(credentials);
      if (localRes.success) return localRes;
      const message = error.response?.data?.message || error.response?.data?.msg || '登录失败，请检查邮箱和密码';
      return { success: false, message };
    }
  };

  const localLogin = async (credentials) => {
    const { email, password } = credentials;
    const users = getLocalUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      return { success: false, message: '账号或密码错误（本地）' };
    }
    const token = `local-${found.id}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(found));
    setUser(found);
    setIsAuthenticated(true);
    return { success: true, user: found };
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


