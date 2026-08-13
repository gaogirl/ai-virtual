import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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
      navigate(result.user.role === 'teacher' ? '/teacher/dashboard' : '/student');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <section className="login-left" aria-label="平台介绍">
          <div className="login-welcome">
            <h1>欢迎回到学习工作台</h1>
            <p>让课程、练习与协作围绕每位学习者的进度自然连接。</p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">✦</span>
                <span>智能学习支持</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">◫</span>
                <span>统一课程资源</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">↗</span>
                <span>清晰成长轨迹</span>
              </div>
            </div>
          </div>
        </section>
        <main className="login-right">
          <div className="login-box">
            <h2>登录账户</h2>
            {error && <p className="error-message" role="alert">{error}</p>}
            <form onSubmit={onSubmit}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="邮箱地址"
                  name="email"
                  value={email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                  disabled={loading}
                  aria-label="邮箱地址"
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="密码"
                  name="password"
                  value={password}
                  onChange={onChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-label="密码"
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '登录中...' : '登录并进入工作台'}
              </button>
            </form>
            <p className="sub-text">
              还没有账户？<Link to="/register">立即注册</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
