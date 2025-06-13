import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = ({ onLogoutClick }) => {
    const userRole = localStorage.getItem('role');

    // This function is called when the logout link is clicked.
    // The side menu closing is handled automatically by a Bootstrap attribute.
    const handleLogoutClick = (e) => {
        e.preventDefault();
        onLogoutClick();
    };

    return (
        <nav className="navbar navbar-dark bg-primary shadow-sm">
            <div className="container-fluid">
                <Link className="navbar-brand" to={userRole === 's3_uploader' ? "/s3_dashboard" : "/"}>
                    <i className="fas fa-train me-2"></i>
                    Wagon Damage Detection
                </Link>

                {/* This is the three-bar button that opens the side menu */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasNavbar"
                    aria-controls="offcanvasNavbar"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* This is the off-canvas side menu that slides in */}
                <div
                    className="offcanvas offcanvas-end"
                    tabIndex="-1"
                    id="offcanvasNavbar"
                    aria-labelledby="offcanvasNavbarLabel"
                >
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body">
                        <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                            {userRole === 's3_uploader' ? (
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/s3_dashboard" data-bs-dismiss="offcanvas">S3 Upload</NavLink>
                                </li>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/" end data-bs-dismiss="offcanvas">Home</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/dashboard" data-bs-dismiss="offcanvas">Dashboard</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/upload" data-bs-dismiss="offcanvas">Retrieve from S3</NavLink>
                                    </li>
                                </>
                            )}
                            <li className="nav-item mt-auto">
                                <a
                                    href="#"
                                    className="nav-link"
                                    onClick={handleLogoutClick}
                                    title="Logout"
                                    data-bs-dismiss="offcanvas" // This makes the menu close on click
                                >
                                    <i className="fas fa-sign-out-alt fa-lg"></i>
                                    <span className="ms-2">Logout</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;