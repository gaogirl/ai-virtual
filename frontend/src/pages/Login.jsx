import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [userRole, setUserRole] = useState('student'); // 选择登录角色
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login({ email, password });
        setLoading(false);
        if (result.success) {
            // 根据用户选择的端进行跳转
            if (userRole === 'teacher') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/student');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left">
                    <div className="login-welcome">
                        <h1>欢迎回来</h1>
                        <p>实时翻译学习平台</p>
                        <div className="welcome-features">
                            <div className="feature-item">
                                <span className="feature-icon">🎓</span>
                                <span>智能翻译</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">📚</span>
                                <span>学习资源</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">👥</span>
                                <span>互动社区</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="login-right">
                    <div className="login-box">
                        <h2>登录您的账户</h2>
                        
                        {/* 用户角色选择 */}
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${userRole === 'student' ? 'active' : ''}`}
                                onClick={() => setUserRole('student')}
                                disabled={loading}
                            >
                                <span className="role-icon">👨‍🎓</span>
                                <span>学生端</span>
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${userRole === 'teacher' ? 'active' : ''}`}
                                onClick={() => setUserRole('teacher')}
                                disabled={loading}
                            >
                                <span className="role-icon">👨‍🏫</span>
                                <span>教师端</span>
                            </button>
                        </div>

                        {error && <p className="error-message">{error}</p>}
                        <form onSubmit={onSubmit}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="邮箱地址"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="密码"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? '登录中...' : '登录'}
                            </button>
                        </form>
                        <p className="sub-text">
                            还没有账户？ <Link to="/register">立即注册</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
