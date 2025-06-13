import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

// FIX: Changed all import paths to be relative to the current file.
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import LogoutModal from './LogoutModal.jsx';
import { logout } from '../api/apiService.js';

const BaseLayout = () => {
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setLogoutModalOpen(false);
        navigate('/login');
    };

    return (
        <div className="wrapper d-flex flex-column vh-100">
            <Navbar onLogoutClick={() => setLogoutModalOpen(true)} />
            
            <main className="flex-grow-1">
                <div className="container mt-4 mb-5">
                    <Outlet />
                </div>
            </main>

            <Footer />
            
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirmLogout={handleLogout}
            />
        </div>
    );
};

export default BaseLayout;
