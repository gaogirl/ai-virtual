import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>教师仪表盘</h1>
                <div className="user-info">
                    <span>欢迎，{user?.name}</span>
                    <button onClick={logout} className="logout-btn">登出</button>
                </div>
            </header>
            <main className="dashboard-content">
                <p>这里是教师专属的功能区。</p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <a href="/teacher/ai" className="btn" style={{ padding:'8px 12px', background:'#2b8a3e', color:'#fff', borderRadius:6, textDecoration:'none' }}>进入智能对话</a>
                  <a href="/teacher/classes" className="btn" style={{ padding:'8px 12px', background:'#1c7ed6', color:'#fff', borderRadius:6, textDecoration:'none' }}>班级管理</a>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;



