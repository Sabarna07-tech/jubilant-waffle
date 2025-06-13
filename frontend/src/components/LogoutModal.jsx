import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirmLogout }) => {
    // If the modal is not set to be open, render nothing.
    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* The dimming backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* The Modal Dialog */}
            <div
                className="modal fade show"
                style={{
                    display: 'block', // Ensure the modal is visible
                    zIndex: 1055 // FIX: Set a z-index higher than the backdrop (1050)
                }}
                tabIndex="-1"
                role="dialog"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirm Logout</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to log out?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={onConfirmLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogoutModal;