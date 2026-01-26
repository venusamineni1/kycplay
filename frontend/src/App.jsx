import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientDirectory from './pages/ClientDirectory';
import ClientDetails from './pages/ClientDetails';
import CaseList from './pages/CaseList';
import CaseDetails from './pages/CaseDetails';
import MaterialChanges from './pages/MaterialChanges';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminPermissions from './pages/AdminPermissions';
import AdminQuestionnaire from './pages/AdminQuestionnaire';
import AdminWorkflowDashboard from './pages/AdminWorkflowDashboard';
import Questionnaire from './pages/Questionnaire';
import TaskInbox from './pages/TaskInbox';
import Login from './pages/Login';

import Profile from './pages/Profile';

// Placeholder components for the other pages
const Placeholder = ({ name }) => (
  <div className="glass-section">
    <h2>{name}</h2>
    <p>This page is under migration.</p>
    <Link to="/" className="back-link">Back to Dashboard</Link>
  </div>
);

import { Link } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute'; // Import usage

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - utilizing Layout inside ProtectedRoute or wrapping Layout */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/clients" element={<ClientDirectory />} />
                      <Route path="/clients/:id" element={<ClientDetails />} />
                      <Route path="/changes" element={<MaterialChanges />} />
                      <Route path="/users" element={<AdminUserManagement />} />
                      <Route path="/permissions" element={<AdminPermissions />} />
                      <Route path="/cases" element={<CaseList />} />
                      <Route path="/cases/:id" element={<CaseDetails />} />
                      <Route path="/cases/:id/questionnaire" element={<Questionnaire />} />
                      <Route path="/admin/questionnaire" element={<AdminQuestionnaire />} />
                      <Route path="/admin/workflow" element={<AdminWorkflowDashboard />} />
                      <Route path="/inbox" element={<TaskInbox />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
