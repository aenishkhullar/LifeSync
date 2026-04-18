import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser, registerUser, getUserProfile } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUser = useCallback(async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await getUserProfile();
            if (response.success) {
                setUser(response.data);
                setError(null);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Failed to load user profile:', err);
            setError(err.response?.data?.message || 'Failed to load user profile');
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const response = await loginUser({ email, password });
            
            if (response.success) {
                const newToken = response.token;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(response.data);
                return { success: true };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        try {
            setLoading(true);
            setError(null);
            const response = await registerUser({ name, email, password });
            
            if (response.success) {
                // Auto login after register if the response doesn't already contain a token
                // Depending on backend, some return token on register, some don't.
                // Our backend authController returns success:true but NO token on register.
                // So we call login immediately.
                return await login(email, password);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                login,
                register,
                logout,
                loadUser,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
