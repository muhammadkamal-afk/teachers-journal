import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PenSquare, 
  Search, 
  FileText, 
  LogOut,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/journal/new', icon: <PenSquare size={20} />, label: 'Jurnal Baru' },
    { path: '/search', icon: <Search size={20} />, label: 'Pencarian' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Laporan' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar - Desktop */}
      <div style={{
        width: '240px', backgroundColor: '#1e293b', color: 'white',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        position: 'fixed', height: '100vh', zIndex: 100,
        '@media (max-width: 768px)': { display: 'none' }
      }} className="sidebar-desktop">
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #334155' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>📚 Teacher's Journal</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{user?.name}</p>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 24px', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: location.pathname === item.path ? '#3b82f6' : 'transparent',
                color: location.pathname === item.path ? 'white' : '#94a3b8',
                fontSize: '14px', transition: 'all 0.2s',
              }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #334155' }}>
          <button onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: '14px', padding: '8px 0',
            }}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </div>

      {/* Bottom Nav - Mobile */}
      <div style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#1e293b', zIndex: 100, padding: '8px 0',
      }} className="bottom-nav">
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', padding: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent',
              color: location.pathname === item.path ? '#60a5fa' : '#94a3b8',
              fontSize: '10px',
            }}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '240px', flex: 1, padding: '24px' }} className="main-content">
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .bottom-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding: 16px 16px 80px !important; }
        }
      `}</style>
    </div>
  );
}