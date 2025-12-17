import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                if (user.role === 'teacher') {
                    navigate('/teacher/dashboard', { replace: true });
                } else {
                    navigate('/student/dashboard', { replace: true });
                }
            } else {
                navigate('/login', { replace: true });
            }
        }
    }, [user, isAuthenticated, loading, navigate]);

    // 在重定向前显示加载状态
    return <div>加载中...</div>;
};

export default Home;




