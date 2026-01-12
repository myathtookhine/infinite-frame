import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import ArtworkAttributes from './pages/ArtworkAttributes';
import ManageAdmins from './pages/ManageAdmins';
import AdminLayout from './layout/AdminLayout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Profile />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Categories />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artwork-attributes"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ArtworkAttributes />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Super Admin Route */}
            <Route
              path="/manage-admins"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ManageAdmins />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
