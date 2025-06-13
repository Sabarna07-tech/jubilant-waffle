import React, { useState, useEffect, useContext } from 'react';
import { TaskContext } from '../context/TaskContext.jsx';
import { retrieveVideos } from '../api/apiService.js';

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
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setRetrieveDate(today);
    }, []);

    const handleRetrieve = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setFolders([]);
        setSelectedFolderId('');
        clearTask(); // Clear any previous task state

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
            setError('An error occurred while retrieving videos. Please try again.');
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
    };

    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    // Render loading/processing state
    if (taskState === 'PROCESSING') {
        return (
             <div className="chart-card fade-in">
                <div className="chart-header" style={{ justifyContent: 'center' }}>
                    <h3 className="chart-title"><i className="fas fa-sync-alt fa-spin me-2"></i>Processing Videos...</h3>
                </div>
                <div className="text-center p-4">
                     <h4 className="mt-3">Extracting frames, please wait.</h4>
                     <p className="text-muted">{taskStatusText}</p>
                     <div className="progress mt-4" style={{height: '10px'}}>
                         <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${taskProgress}%`, background: 'var(--gradient-primary)' }}>{taskProgress}%</div>
                     </div>
                </div>
             </div>
        );
    }

    // Render success/results state
    if (taskState === 'SUCCESS') {
        const framesToShow = taskResult?.result?.slice(0, 16) || [];
        return (
            <div className="data-section fade-in">
                <div className="section-header">
                    <h2 className="section-title"><i className="fas fa-check-circle text-success me-2"></i>Extraction Complete</h2>
                    <button onClick={resetWorkflow} className="action-btn outline"><i className="fas fa-redo me-1"></i>Start New Extraction</button>
                </div>
                <div className="p-4">
                    <div className="alert alert-success" role="alert">
                        Successfully extracted <strong>{taskResult?.count || 0}</strong> frames. 
                        {taskResult?.count > 16 && ` Showing the first 16.`}
                    </div>
                     <div className="wagon-grid">
                        {framesToShow.length > 0 ? (
                            framesToShow.map((frameUrl, index) => (
                                <div key={index} className="wagon-card" style={{padding: 0, border: 'none'}}>
                                    <img src={frameUrl} alt={`Frame ${index + 1}`} style={{width: '100%', height: 'auto', borderRadius: '8px', boxShadow: 'var(--shadow-sm)'}} />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted col-span-full">No wagons were detected in the video.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    // Default view for searching
    return (
        <div className="data-section fade-in">
            <div className="section-header">
                <h2 className="section-title">Retrieve & Extract Frames from S3</h2>
            </div>
            <div className="p-4">
                 <form onSubmit={handleRetrieve}>
                     {/* FIXED: Using Flexbox for better alignment */}
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                         <div style={{ flex: '1 1 150px' }}>
                            <label htmlFor="clientId" className="form-label fw-bold small">Client ID</label>
                            <input type="text" className="search-input w-100" id="clientId" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="e.g., admin1" required />
                         </div>
                         <div style={{ flex: '1 1 150px' }}>
                            <label htmlFor="retrieveDate" className="form-label fw-bold small">Video Date</label>
                            <input type="date" className="search-input w-100" id="retrieveDate" value={retrieveDate} onChange={e => setRetrieveDate(e.target.value)} required />
                         </div>
                         <div style={{ flex: '0 1 180px' }}>
                            <label className="form-label fw-bold small">Camera Angle</label>
                            <div className="d-flex gap-3 pt-2">
                                <div className="form-check"><input className="form-check-input" type="radio" name="camera_angle" id="cameraLeft" value="left" checked={cameraAngle === 'left'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraLeft">Left</label></div>
                                <div className="form-check"><input className="form-check-input" type="radio" name="camera_angle" id="cameraRight" value="right" checked={cameraAngle === 'right'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraRight">Right</label></div>
                                <div className="form-check"><input className="form-check-input" type="radio" name="camera_angle" id="cameraTop" value="top" checked={cameraAngle === 'top'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="cameraTop">Top</label></div>
                            </div>
                         </div>
                         <div style={{ flex: '0 1 120px' }}>
                            <label className="form-label fw-bold small">Video Type</label>
                            <div className="d-flex gap-3 pt-2">
                                <div className="form-check"><input className="form-check-input" type="radio" name="video_type" id="videoEntry" value="entry" checked={videoType === 'entry'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="videoEntry">Entry</label></div>
                                <div className="form-check"><input className="form-check-input" type="radio" name="video_type" id="videoExit" value="exit" checked={videoType === 'exit'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="videoExit">Exit</label></div>
                            </div>
                         </div>
                         <div style={{ flex: '1 1 auto' }}>
                             <button type="submit" className="action-btn primary w-100" disabled={isLoading}>
                                 {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Searching...</> : <><i className="fas fa-search me-2"></i>Retrieve Videos</>}
                             </button>
                         </div>
                     </div>
                 </form>

                 {(error || folders.length > 0) && <hr className="my-4" />}

                 {error && !isLoading && <div className="alert alert-warning">{error}</div>}

                 {folders.length > 0 && !isLoading && (
                     <div>
                         <h3 className="section-title mb-3">2. Select & Process Folder</h3>
                         <div className="mb-3">
                             <select className="form-select" id="folderSelect" value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)}>
                                 <option value="">-- Select a folder to process --</option>
                                 {folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name} ({folder.videos.length} videos)</option>)}
                             </select>
                         </div>
                         {selectedFolder && (
                             <div className="chart-card">
                                 <div className="chart-header">
                                    <h4 className="chart-title"><i className="fas fa-folder-open me-2"></i>Videos in Selected Folder</h4>
                                 </div>
                                 <ul className="list-group list-group-flush">
                                     {selectedFolder.videos.map(video => (<li key={video} className="list-group-item"><i className="fas fa-video me-2 text-secondary"></i>{video}</li>))}
                                 </ul>
                                 <div className="text-center mt-4">
                                     <button type="button" className="action-btn primary" onClick={handleProcess} disabled={taskState === 'PROCESSING'}>
                                        <i className="fas fa-cogs me-2"></i>Start Frame Extraction
                                    </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
};

export default UploadPage;