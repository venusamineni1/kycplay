import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

const Layout = ({ children }) => {
    const { user, logout, hasPermission } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative', zIndex: 100 }}>
                <h1><Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>KYC Dashboard</Link></h1>

                <div style={{ position: 'relative' }}>
                    <Button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ minWidth: '100px' }}>
                        Menu {isMenuOpen ? '▲' : '▼'}
                    </Button>

                    {isMenuOpen && (
                        <div className="glass-section" style={{
                            position: 'absolute',
                            right: 0,
                            top: '120%',
                            width: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.8rem',
                            padding: '1rem',
                            zIndex: 101, // Ensure it floats above content
                            backdropFilter: 'blur(16px)' // Enhanced blur
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Theme</span>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-color)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                                >
                                    <option value="theme-midnight">Midnight</option>
                                    <option value="theme-sunset">Sunset</option>
                                    <option value="theme-lightblue">Light Blue</option>
                                    <option value="theme-darkgray">Dark Gray</option>
                                    <option value="theme-light">Light</option>
                                </select>
                            </div>

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.2rem 0' }} />

                            <Link to="/inbox" className="btn btn-secondary" style={{ textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                My Inbox
                            </Link>

                            {hasPermission('MANAGE_USERS') && (
                                <Link to="/users" className="btn btn-secondary" style={{ textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                    Manage Users
                                </Link>
                            )}
                            {hasPermission('MANAGE_USERS') && (
                                <Link to="/admin/workflow" className="btn btn-secondary" style={{ textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                    Workflow Dashboard
                                </Link>
                            )}
                            {hasPermission('MANAGE_PERMISSIONS') && (
                                <Link to="/permissions" className="btn btn-secondary" style={{ textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                    Permissions
                                </Link>
                            )}
                            <Link to="/profile" className="btn btn-secondary" style={{ textAlign: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                Profile
                            </Link>

                            <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.2rem 0' }} />

                            <Button onClick={() => { logout(); setIsMenuOpen(false); }} style={{ backgroundColor: '#ff5555', width: '100%' }}>
                                Logout
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main id="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
