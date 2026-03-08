import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function LoginInner() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(r => r.json());
      login({ name: userInfo.name, email: userInfo.email, picture: userInfo.picture }, accessToken);
      navigate('/');
    },
    onError: () => alert('Login gagal, coba lagi.'),
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#f8fafc',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', padding: '48px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px', width: '90%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Teacher's Journal
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>
          Dokumentasi wali kelas yang mudah dan terorganisir
        </p>
        <button onClick={() => handleLogin()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', width: '100%', padding: '14px 24px',
            backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '10px',
            cursor: 'pointer', fontSize: '15px', fontWeight: '500', color: '#1e293b',
            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
          <img src="https://www.google.com/favicon.ico" alt="Google" width="20" />
          Masuk dengan Google
        </button>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8' }}>
          Gunakan akun Google Workspace kamu
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <LoginInner />
    </GoogleOAuthProvider>
  );
}