import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Student.css';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="stu-wrap">
      <header className="stu-header">
        <div className="brand">
          <span className="logo">🧠</span>
          <span className="title">智译学习 · 学生端</span>
        </div>
        <nav className="tabs">
          <NavLink end to="/student" className={({isActive}) => isActive ? 'tab active' : 'tab'}>智译</NavLink>
          <NavLink to="/student/ai" className={({isActive}) => isActive ? 'tab active' : 'tab'}>智能对话</NavLink>
          <NavLink to="/student/ai-interp" className={({ isActive }) => isActive ? 'tab active' : 'tab'}>AI口译</NavLink>
          <NavLink to="/student/terms" className={({isActive}) => isActive ? 'tab active' : 'tab'}>术语库</NavLink>
          <NavLink to="/student/cases" className={({isActive}) => isActive ? 'tab active' : 'tab'}>案例库</NavLink>
          <NavLink to="/student/classes" className={({isActive}) => isActive ? 'tab active' : 'tab'}>我的班级</NavLink>
          <NavLink to="/student/courses" className={({isActive}) => isActive ? 'tab active' : 'tab'}>课程</NavLink>
          <NavLink to="/student/profile" className={({isActive}) => isActive ? 'tab active' : 'tab'}>个人</NavLink>
        </nav>
        <div className="userbox">
          <span className="welcome">👋 你好，{user?.name || '同学'}</span>
          <button className="logout" onClick={handleLogout}>退出</button>
        </div>
      </header>
      <main className="stu-main">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;



