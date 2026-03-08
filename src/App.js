import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import NewJournal from './pages/NewJournal';
import Search from './pages/Search';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import './App.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/teachers-journal">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/student/:id" element={
            <PrivateRoute>
              <Layout>
                <StudentProfile />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/journal/new" element={
            <PrivateRoute>
              <Layout>
                <NewJournal />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/search" element={
            <PrivateRoute>
              <Layout>
                <Search />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;