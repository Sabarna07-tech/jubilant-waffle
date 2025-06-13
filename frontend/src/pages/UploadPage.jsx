import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';

import '../assets/css/upload.css';
import { retrieveVideos } from '../api/apiService.js';
import { TaskContext } from '../context/TaskContext.jsx';

const UploadPage = () => {
    const [retrieveDate, setRetrieveDate] = useState('');
    const [clientId, setClientId] = useState('');
    const [cameraAngle, setCameraAngle] = useState('left');
    const [videoType, setVideoType] = useState('entry');
    const [isLoading, setIsLoading] = useState(false);
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [error, setError] = useState('');

    const { 
        taskState, 
        taskProgress, 
        taskStatusText, 
        taskResult, 
        startS3FrameExtraction, 
        clearTask 
    } = useContext(TaskContext);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setRetrieveDate(today);
    }, []);

    const handleRetrieve = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFolders([]);
        setSelectedFolderId('');

        const formData = { 
            retrieve_date: retrieveDate,
            client_id: clientId, 
            camera_angle: cameraAngle, 
            video_type: videoType 
        };

        try {
            const response = await retrieveVideos(formData);
            if (response.success) {
                if (response.folders.length === 0) {
                    setError('No videos found for the specified criteria.');
                }
                setFolders(response.folders);
            } else {
                setError(response.error || 'Failed to retrieve videos.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProcess = async () => {
        const folderToProcess = folders.find(f => f.id === selectedFolderId);
        if (!folderToProcess) {
            alert("Please select a folder to process.");
            return;
        }
        startS3FrameExtraction(folderToProcess);
    };
    
    const resetWorkflow = () => {
        clearTask();
        setFolders([]);
        setSelectedFolderId('');
        setError('');
    }

    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    
    if (taskState === 'PROCESSING') {
        return (
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-sync-alt fa-spin me-2"></i>Processing Videos from S3</h5></div>
                <div className="card-body text-center p-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}><span className="visually-hidden">Loading...</span></div>
                    <h4 className="mt-3">Extracting frames, please wait...</h4>
                    <p className="text-muted">{taskStatusText}</p>
                    <div className="progress mt-4">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${taskProgress}%` }}>{taskProgress}%</div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (taskState === 'SUCCESS') {
        // FIX: The result from the backend is now a list of presigned S3 URLs
        const framesToShow = taskResult?.result?.slice(0, 12) || [];
        return (
            <div className="card shadow-sm">
                 <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0"><i className="fas fa-images me-2"></i>Extraction Results</h5>
                    <button onClick={resetWorkflow} className="btn btn-sm btn-primary"><i className="fas fa-redo me-2"></i>Start New Extraction</button>
                </div>
                <div className="card-body">
                    <div className="alert alert-success">
                        Successfully extracted {taskResult?.count || 0} frames. 
                        {taskResult?.count > 12 && ` Showing the first 12.`}
                    </div>
                    <div className="row g-2">
                        {framesToShow.length > 0 ? (
                            framesToShow.map((frameUrl, index) => (
                                <div key={index} className="col-lg-3 col-md-4 col-6 mb-2">
                                    {/* FIX: Use the presigned URL directly as the src */}
                                    <img src={frameUrl} alt={`Extracted Frame ${index + 1}`} className="img-fluid rounded shadow-sm" />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted">No wagons were detected in the video.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="row mb-4"><div className="col-md-12"><h2 className="page-title"><i className="fas fa-download me-2 text-primary"></i>Retrieve & Extract Frames from S3</h2><nav aria-label="breadcrumb"><ol className="breadcrumb"><li className="breadcrumb-item"><Link to="/">Home</Link></li><li className="breadcrumb-item active">Retrieve & Extract</li></ol></nav><hr /></div></div>
            <div className="row justify-content-center"><div className="col-lg-10"><div className="card shadow-sm"><div className="card-body p-4"><form onSubmit={handleRetrieve}><div className="row g-4">
                <div className="col-md-6">
                    <h5 className="mb-3">1. Search Criteria</h5>
                    <div className="mb-3"><label htmlFor="clientId" className="form-label">Client ID:</label><input type="text" className="form-control" id="clientId" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="e.g., admin1" required /></div>
                    <div className="mb-3"><label htmlFor="retrieveDate" className="form-label">Video Date:</label><input type="date" className="form-control" id="retrieveDate" value={retrieveDate} onChange={e => setRetrieveDate(e.target.value)} required /></div>
                    <div className="mb-3">
                        <label className="form-label">Camera Angle:</label>
                        <div>
                            <div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="camera_angle" id="cameraLeft" value="left" checked={cameraAngle === 'left'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraLeft">Left</label></div>
                            <div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="camera_angle" id="cameraRight" value="right" checked={cameraAngle === 'right'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraRight">Right</label></div>
                            <div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="camera_angle" id="cameraTop" value="top" checked={cameraAngle === 'top'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraTop">Top</label></div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Video Type:</label>
                        <div>
                            <div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="video_type" id="videoEntry" value="entry" checked={videoType === 'entry'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="videoEntry">Entry</label></div>
                            <div className="form-check form-check-inline"><input className="form-check-input" type="radio" name="video_type" id="videoExit" value="exit" checked={videoType === 'exit'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="videoExit">Exit</label></div>
                        </div>
                    </div>
                    <div className="d-grid"><button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Searching...</> : <><i className="fas fa-search me-2"></i>Retrieve Videos</>}</button></div>
                </div>
                <div className="col-md-6">
                    <h5 className="mb-3">2. Select & Process</h5>
                    {isLoading && <div className="text-center my-5"><div className="spinner-border text-primary"><span className="visually-hidden">Loading...</span></div></div>}
                    {error && !isLoading && <div className="alert alert-warning">{error}</div>}
                    {folders.length > 0 && !isLoading && (
                        <div>
                            <div className="mb-3"><label htmlFor="folderSelect" className="form-label">Select Video Folder:</label><select className="form-select" id="folderSelect" value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)}><option value="">Select a folder...</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></div>
                            {selectedFolder && (
                                <div className="card bg-light"><div className="card-body">
                                    <h6 className="card-title"><i className="fas fa-folder-open me-2"></i>Available Videos in Folder</h6>
                                    <ul className="list-group list-group-flush">{selectedFolder.videos.map(video => (<li key={video} className="list-group-item bg-light ps-0"><i className="fas fa-video me-2 text-secondary"></i>{video}</li>))}</ul>
                                    <div className="d-grid mt-3"><button type="button" className="btn btn-success" onClick={handleProcess} disabled={taskState === 'PROCESSING'}><i className="fas fa-play-circle me-2"></i>Start Frame Extraction</button></div>
                                </div></div>
                            )}
                        </div>
                    )}
                </div>
            </div></form></div></div></div></div>
        </div>
    );
};

export default UploadPage;