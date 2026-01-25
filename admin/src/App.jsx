import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./context/ThemeContext";
import { AdminCacheProvider } from './context/AdminCacheContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import ArtworkAttributes from './pages/ArtworkAttributes';
import Units from './pages/Units';
import Artworks from './pages/Artworks';
import ArtworkForm from './pages/ArtworkForm';
import ManageAdmins from './pages/ManageAdmins';
import ActivityLogs from './pages/ActivityLogs';
import AdminLayout from './layout/AdminLayout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminCacheProvider>
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

            {/* Artworks Routes */}
            <Route
              path="/artworks"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Artworks />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artworks/new"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ArtworkForm />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artworks/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ArtworkForm />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Super Admin Routes */}
            <Route
              path="/units"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Units />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/activity-logs"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ActivityLogs />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        </AdminCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
