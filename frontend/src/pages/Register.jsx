import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password2: '',
        role: 'student' // 默认角色为学生
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const { name, email, password, password2, role } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== password2) {
            setError('两次输入的密码不一致');
            return;
        }
        setLoading(true);
        setError('');
        const result = await register({ name, email, password, role });
        setLoading(false);
        if (result.success) {
            if (result.user.role === 'teacher') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/student');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="register-container">
            <div className="register-content">
                <div className="register-left">
                    <div className="register-welcome">
                        <h1>加入我们</h1>
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
                <div className="register-right">
                    <div className="register-box">
                        <h2>创建您的账户</h2>
                        {error && <p className="error-message">{error}</p>}
                        <form onSubmit={onSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="姓名"
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
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
                                    placeholder="密码（至少6位）"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    minLength="6"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="确认密码"
                                    name="password2"
                                    value={password2}
                                    onChange={onChange}
                                    minLength="6"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="role-selection">
                                <label>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={role === 'student'}
                                        onChange={onChange}
                                        disabled={loading}
                                    />
                                    <span>👨‍🎓 学生</span>
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        checked={role === 'teacher'}
                                        onChange={onChange}
                                        disabled={loading}
                                    />
                                    <span>👨‍🏫 教师</span>
                                </label>
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? '注册中...' : '注册'}
                            </button>
                        </form>
                        <p className="sub-text">
                            已有账户？ <Link to="/login">立即登录</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
