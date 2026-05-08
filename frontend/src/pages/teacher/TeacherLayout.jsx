import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Teacher.css';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="tea-wrap">
      <header className="tea-header">
        <div className="brand">
          <span className="logo">🎓</span>
          <span className="title">智译教学 · 教师端</span>
        </div>
        <nav className="tabs">
          <NavLink end to="/teacher" className={({isActive}) => isActive ? 'tab active' : 'tab'}>首页</NavLink>
          <NavLink to="/teacher/ai" className={({isActive}) => isActive ? 'tab active' : 'tab'}>智能对话</NavLink>
          <NavLink to="/teacher/classes" className={({isActive}) => isActive ? 'tab active' : 'tab'}>班级管理</NavLink>
          <NavLink to="/teacher/assignments" className={({isActive}) => isActive ? 'tab active' : 'tab'}>作业管理</NavLink>
          <NavLink to="/teacher/terms" className={({isActive}) => isActive ? 'tab active' : 'tab'}>术语库</NavLink>
          <NavLink to="/teacher/cases" className={({isActive}) => isActive ? 'tab active' : 'tab'}>案例库</NavLink>
          <NavLink to="/teacher/analytics" className={({isActive}) => isActive ? 'tab active' : 'tab'}>数据看板</NavLink>
        </nav>
        <div className="userbox">
          <span className="welcome">👋 你好，{user?.name || '老师'}</span>
          <button className="logout" onClick={handleLogout}>退出</button>
        </div>
      </header>
      <main className="tea-main">
        <Outlet />
      </main>
    </div>
  );
}

