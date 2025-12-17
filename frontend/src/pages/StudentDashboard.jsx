import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>学生仪表盘</h1>
                <div className="user-info">
                    <span>欢迎，{user?.name}</span>
                    <button onClick={logout} className="logout-btn">登出</button>
                </div>
            </header>
            <main className="dashboard-content">
                <p>这里是学生专属的功能区。</p>
                {/* 后续将在这里添加学生相关功能 */}
            </main>
        </div>
    );
};

export default StudentDashboard;




