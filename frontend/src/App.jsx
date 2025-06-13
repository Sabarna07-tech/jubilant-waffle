import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// FIX: Changed all import paths to be relative to the current file.
import BaseLayout from './components/BaseLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import FrameExtractionPage from './pages/FrameExtractionPage.jsx';
import DamageDetectionPage from './pages/DamageDetectionPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import S3DashboardPage from './pages/S3DashboardPage.jsx';

// FIX: Import the new TaskProvider to manage global state for background tasks.
import { TaskProvider } from './context/TaskContext.jsx';


/**
 * A wrapper for routes that require authentication.
 */
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

/**
 * A wrapper for routes that are specific to a user role.
 */
const RoleProtectedRoute = ({ children, allowedRole }) => {
    const userRole = localStorage.getItem('role');

    if (userRole !== allowedRole) {
        return <Navigate to="/" replace />;
    }
    
    return children;
}


function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        {/* FIX: Wrap the layout with TaskProvider */}
                        <TaskProvider>
                            <BaseLayout />
                        </TaskProvider>
                    </ProtectedRoute>
                }
            >
                <Route index element={<HomePage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="frame_extraction" element={<FrameExtractionPage />} />
                <Route path="damage_detection" element={<DamageDetectionPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                <Route 
                    path="s3_dashboard" 
                    element={
                        <RoleProtectedRoute allowedRole="s3_uploader">
                            <S3DashboardPage />
                        </RoleProtectedRoute>
                    } 
                />
            </Route>

             <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;