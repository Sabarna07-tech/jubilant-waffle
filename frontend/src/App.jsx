import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import components and pages
import BaseLayout from './components/BaseLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import FrameExtractionPage from './pages/FrameExtractionPage.jsx';
import DamageDetectionPage from './pages/DamageDetectionPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import S3DashboardPage from './pages/S3DashboardPage.jsx';


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
        // If the role doesn't match, redirect to the main home page
        return <Navigate to="/" replace />;
    }
    
    return children;
}


function App() {
    return (
        <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes wrapped in the BaseLayout */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <BaseLayout />
                    </ProtectedRoute>
                }
            >
                {/* Child routes of BaseLayout */}
                <Route index element={<HomePage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="frame_extraction" element={<FrameExtractionPage />} />
                <Route path="damage_detection" element={<DamageDetectionPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                {/* Role-specific protected route */}
                <Route 
                    path="s3_dashboard" 
                    element={
                        <RoleProtectedRoute allowedRole="s3_uploader">
                            <S3DashboardPage />
                        </RoleProtectedRoute>
                    } 
                />
            </Route>

             {/* Fallback route to redirect any unknown paths */}
             <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

// FIX: Removed extra closing brace that was causing a syntax error.
export default App;