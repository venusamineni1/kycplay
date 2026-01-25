import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const { checkAuth } = useAuth(); // Import checkAuth
    const navigate = useNavigate(); // Import useNavigate

    // simplified query param check since we don't have useLocation imported yet, could import it or just use window.location
    const logout = new URLSearchParams(window.location.search).get('logout');

    const handleLogin = async (e) => {
        e.preventDefault();

        // Form Data is required for Spring Security formLogin
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                body: formData
            });

            // If login succeeds, it usually redirects or returns 200
            // Since we are using proxy, we just need to check if the session is established.
            // Spring Security default success url redirection might return opaque response or redirect.
            // But fetch will follow it usually.

            if (response.ok) {
                // Login successful (200 OK)
                await checkAuth(); // Refresh auth state
                navigate('/'); // Go to dashboard
            } else {
                // Login failed (401 or other)
                setError(true);
            }
        } catch (err) {
            console.error("Login error", err);
            setError(true);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: `
                radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 1) 0, transparent 50%),
                radial-gradient(at 50% 0%, hsla(225, 39%, 30%, 1) 0, transparent 50%),
                radial-gradient(at 100% 0%, hsla(339, 49%, 30%, 1) 0, transparent 50%)
            `,
            backgroundColor: '#0f172a', /* Fallback */
            width: '100vw',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1000 /* Ensure it covers everything */
        }}>
            <div className="login-container" style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(12px)',
                padding: '2.5rem',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(to right, #818cf8, #c084fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Venus KYC</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Secure Case Management</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                        border: '1px solid rgba(220, 38, 38, 0.5)',
                        color: '#fca5a5',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }} role="alert">
                        Invalid username or password
                    </div>
                )}
                {logout && (
                    <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: 'rgba(5, 150, 105, 0.5)',
                        color: '#6ee7b7',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        border: '1px solid'
                    }} role="alert">
                        You have been logged out.
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '0'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
                    >
                        Sign In
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.85rem',
                    color: '#94a3b8'
                }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Demo Credentials:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Admin</span>
                        <span style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>admin / admin</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Analyst</span>
                        <span style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>analyst / password</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Reviewer</span>
                        <span style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>reviewer / password</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
