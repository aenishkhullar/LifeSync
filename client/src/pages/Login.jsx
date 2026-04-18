import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="authContainer">
            <div className="authCard card">
                <div className="authHeader">
                    <h1 className="authTitle">Welcome Back</h1>
                    <p className="authSubtitle">Log in to manage your subscriptions</p>
                </div>

                {error && (
                    <div className="errorMsg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form className="authForm" onSubmit={handleSubmit}>
                    <div className="formGroup">
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn primaryLight w-full items-center justify-center" 
                        disabled={loading}
                    >
                        {loading ? <div className="loader"></div> : 'Sign In'}
                    </button>
                </form>

                <div className="authFooter">
                    Don't have an account? 
                    <Link to="/register" className="authLink">Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
