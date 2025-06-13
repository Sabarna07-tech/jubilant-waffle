import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTask } from '../context/TaskContext';

// Import all necessary API services
import {
    uploadVideoToS3,
    checkS3UploadStatus,
    retrieveVideos,
    // FIX: processS3Videos is handled by the context now, so it's not needed here.
    getVideoUrl
} from '/src/api/apiService.js';

// Import CSS
import '/src/assets/css/s3_dashboard.css';
import '/src/assets/css/s3_upload.css';

const S3DashboardPage = () => {
    const userRole = localStorage.getItem('role');

    // === STATE FOR UPLOAD SECTION ===
    const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
    const [cameraAngle, setCameraAngle] = useState('left');
    const [videoType, setVideoType] = useState('entry');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [recentUploads, setRecentUploads] = useState([]);
    const abortControllerRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // === STATE FOR RETRIEVE & PREVIEW SECTION ===
    
    // FIX: Destructure the correct function from the context.
    const { startS3FrameExtraction } = useTask();

    const [retrieveForm, setRetrieveForm] = useState({
        retrieve_date: new Date().toISOString().split('T')[0],
        client_id: localStorage.getItem('username') || 'Unknown User',
        camera_angle: 'left',
        video_type: 'entry'
    });
    const [folders, setFolders] = useState([]);
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState({ folderName: '', videoName: '' });
    const [previewUrl, setPreviewUrl] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        document.body.classList.add('s3-dashboard-page-body');
        return () => {
            document.body.classList.remove('s3-dashboard-page-body');
        };
    }, []);

    // === HANDLERS FOR UPLOAD SECTION ===
    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
        } else if (file) {
            toast.error('Please select a valid video file.');
        }
    };
    
    const triggerFileSelect = (e) => {
        if (e) e.stopPropagation();
        fileInputRef.current.click();
    };

    const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFileSelect(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const removeFile = (e) => {
        if (e) e.stopPropagation();
        setSelectedFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file to upload.');
            return;
        }
        setIsUploading(true);
        abortControllerRef.current = new AbortController();
        
        const uploadId = Date.now();
        const newUpload = { id: uploadId, fileName: selectedFile.name, status: 'Uploading...', s3_key: null };
        setRecentUploads(prev => [newUpload, ...prev]);

        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('upload_date', uploadDate);
        formData.append('camera_angle', cameraAngle);
        formData.append('video_type', videoType);
        formData.append('user_name', localStorage.getItem('username') || 'Unknown User');

        try {
            const response = await uploadVideoToS3(formData, abortControllerRef.current.signal);
            setRecentUploads(prev => prev.map(up => 
                up.id === uploadId ? { ...up, status: response.success ? 'Success' : 'Failed', s3_key: response.s3_key } : up
            ));
            toast.success(response.message || 'Upload process finished.');
            removeFile(e);
        } catch (error) {
             if (error.name !== 'AbortError') {
                console.error('S3 Upload Error:', error);
                toast.error('An error occurred during the upload.');
                setRecentUploads(prev => prev.map(up => up.id === uploadId ? { ...up, status: 'Failed' } : up));
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            toast.warn('Upload cancelled.');
            setRecentUploads(prev => prev.filter(up => up.status !== 'Uploading...'));
        }
    };

    const handleVerifyStatus = async (upload) => {
        if (!upload.s3_key) {
            toast.error("Cannot verify status: S3 key is missing.");
            return;
        }
        setRecentUploads(prev => prev.map(up => up.id === upload.id ? { ...up, status: 'Verifying...' } : up));
        try {
            const response = await checkS3UploadStatus(upload.s3_key);
            const status = response.exists ? 'Verified on S3' : 'Verification Failed';
            toast.info(`Verification for ${upload.fileName}: ${status}`);
            setRecentUploads(prev => prev.map(up => up.id === upload.id ? { ...up, status: status } : up));
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("An error occurred during verification.");
            setRecentUploads(prev => prev.map(up => up.id === upload.id ? { ...up, status: 'Verification Error' } : up));
        }
    };
    
    // === HANDLERS FOR RETRIEVE & PREVIEW SECTION ===
    
    const handleRetrieveFormChange = (e) => {
        const { name, value } = e.target;
        setRetrieveForm(prev => ({ ...prev, [name]: value }));
    };

    const handleRetrieve = async (e) => {
        e.preventDefault();
        setIsRetrieving(true);
        setFolders([]);
        setPreviewUrl('');
        setSelectedVideo({ folderName: '', videoName: '' });

        try {
            const response = await retrieveVideos(retrieveForm);
            if (response.success) {
                setFolders(response.folders);
                toast.success(`${response.folders.length > 0 ? response.folders.reduce((acc, f) => acc + f.videos.length, 0) : 0} videos found.`);
            } else {
                toast.error(response.error || 'Failed to retrieve videos.');
            }
        } catch (error) {
            toast.error("Error retrieving videos.");
            console.error(error);
        } finally {
            setIsRetrieving(false);
        }
    };

    const handleVideoSelect = async (folderName, videoName) => {
        if (selectedVideo.videoName === videoName && selectedVideo.folderName === folderName) {
            setPreviewUrl('');
            setSelectedVideo({ folderName: '', videoName: '' });
            return;
        }

        setIsPreviewLoading(true);
        setPreviewUrl('');
        setSelectedVideo({ folderName, videoName });

        try {
            const fullS3Key = `${folderName}${videoName}`;
            const response = await getVideoUrl(fullS3Key);
            if (response.success) {
                setPreviewUrl(response.url);
            } else {
                toast.error(response.error || 'Failed to get video preview.');
            }
        } catch (error) {
            toast.error('Error fetching video preview.');
            console.error(error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    /**
     * FIX: Corrected the handleProcess function. It now uses the startS3FrameExtraction
     * function from the context, which correctly initiates the backend task and polling.
     */
    const handleProcess = async (folderName) => {
        const folderToProcess = { name: folderName };
        // The context will show its own toast messages.
        await startS3FrameExtraction(folderToProcess);
    };

    return (
        <div id="s3_dashboard_container">
            {/* --- UPLOAD SECTION --- */}
            <div className="row">
                {/* Upload Form */}
                <div className="col-lg-7">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white text-center"><h5 className="mb-0"><i className="fas fa-upload me-2"></i>Upload Video to S3 Bucket</h5></div>
                        <div className="card-body">
                            <form onSubmit={handleUpload}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="uploadDate" className="form-label">Video Date:</label>
                                            <input type="date" className="form-control" id="uploadDate" value={uploadDate} onChange={e => setUploadDate(e.target.value)} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Camera Angle:</label>
                                            <div>
                                                <div className="form-check form-check-inline"><input className="form-check-input" type="radio" id="camLeft" name="cameraAngle" value="left" checked={cameraAngle === 'left'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="camLeft">Left</label></div>
                                                <div className="form-check form-check-inline"><input className="form-check-input" type="radio" id="camRight" name="cameraAngle" value="right" checked={cameraAngle === 'right'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="camRight">Right</label></div>
                                                <div className="form-check form-check-inline"><input className="form-check-input" type="radio" id="camTop" name="cameraAngle" value="top" checked={cameraAngle === 'top'} onChange={e => setCameraAngle(e.target.value)} /><label className="form-check-label" htmlFor="camTop">Top</label></div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Video Type:</label>
                                            <div>
                                                <div className="form-check form-check-inline"><input className="form-check-input" type="radio" id="vidEntry" name="videoType" value="entry" checked={videoType === 'entry'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="vidEntry">Entry</label></div>
                                                <div className="form-check form-check-inline"><input className="form-check-input" type="radio" id="vidExit" name="videoType" value="exit" checked={videoType === 'exit'} onChange={e => setVideoType(e.target.value)} /><label className="form-check-label" htmlFor="vidExit">Exit</label></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <input type="file" id="videoFile" ref={fileInputRef} className="d-none" accept="video/*" onChange={e => handleFileSelect(e.target.files[0])} />
                                        <div className="upload-zone" onDrop={onDrop} onDragOver={onDragOver} onClick={triggerFileSelect}>
                                            { !selectedFile ? (
                                                <div className="upload-zone-content text-center">
                                                    <i className="fas fa-cloud-upload-alt mb-2 upload-icon"></i><h6>Drag & Drop Video</h6><p className="text-muted mb-2">or</p>
                                                    <button type="button" className="btn btn-outline-primary" onClick={triggerFileSelect}><i className="fas fa-file-video me-1"></i>Select Video</button>
                                                </div>
                                            ) : (
                                                <div className="selected-file-details">
                                                    <i className="fas fa-file-video file-icon me-2 text-primary"></i><h6 className="mb-0">{selectedFile.name}</h6>
                                                    <div className="text-muted mb-3">{(selectedFile.size / (1024*1024)).toFixed(2)} MB</div>
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={removeFile}><i className="fas fa-times me-1"></i>Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <button type="submit" className="btn btn-primary" disabled={!selectedFile || isUploading}>
                                        {isUploading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</> : <><i className="fas fa-cloud-upload-alt me-1"></i>Upload to S3</>}
                                    </button>
                                    {isUploading && <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleCancelUpload}><i className="fas fa-times me-1"></i>Cancel</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/* Recent Uploads */}
                <div className="col-lg-5">
                    <div className="card shadow-sm">
                        <div className="card-header text-center"><h5 className="mb-0"><i className="fas fa-history me-2"></i>Recent Upload Status</h5></div>
                        <div className="card-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                            { recentUploads.length === 0 ? <p className="text-muted text-center">No recent uploads.</p> : (
                                <ul className="list-group list-group-flush">
                                    {recentUploads.map(upload => (
                                        <li key={upload.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-bold">{upload.fileName}</div>
                                                <small className={`status-text status-${upload.status?.toLowerCase().replace(/\s/g, '-')}`}>{upload.status}</small>
                                            </div>
                                            {(upload.status === 'Success' || upload.status === 'Verified on S3') && (
                                                <button className="btn btn-sm btn-outline-info" onClick={() => handleVerifyStatus(upload)}><i className="fas fa-check-double"></i> Verify</button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {userRole !== 's3_uploader' && (
                <>
                    <hr className="my-5" />

                    {/* --- RETRIEVE AND PROCESS SECTION --- */}
                    <h3 className="mb-4 text-center">Retrieve & Process Videos</h3>
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="card shadow-sm">
                                <div className="card-header"><h5 className="mb-0"><i className="fas fa-search me-2"></i>Find Videos on S3</h5></div>
                                <div className="card-body">
                                    <form onSubmit={handleRetrieve}>
                                        <div className="row align-items-end">
                                            <div className="col-md-3"><label className="form-label">Date:</label><input type="date" name="retrieve_date" className="form-control" value={retrieveForm.retrieve_date} onChange={handleRetrieveFormChange} /></div>
                                            <div className="col-md-3"><label className="form-label">Client ID:</label><input type="text" name="client_id" className="form-control" value={retrieveForm.client_id} onChange={handleRetrieveFormChange} /></div>
                                            <div className="col-md-3"><label className="form-label">Camera Angle:</label><select name="camera_angle" className="form-select" value={retrieveForm.camera_angle} onChange={handleRetrieveFormChange}><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option></select></div>
                                            <div className="col-md-3"><label className="form-label">Video Type:</label><select name="video_type" className="form-select" value={retrieveForm.video_type} onChange={handleRetrieveFormChange}><option value="entry">Entry</option><option value="exit">Exit</option></select></div>
                                        </div>
                                        <div className="text-center mt-3">
                                            <button type="submit" className="btn btn-success" disabled={isRetrieving}>
                                                {isRetrieving ? <><span className="spinner-border spinner-border-sm me-2"></span>Retrieving...</> : <><i className="fas fa-database me-1"></i>Retrieve from S3</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        {/* Video List */}
                        <div className="col-md-5">
                            <div className="card shadow-sm">
                                <div className="card-header"><h5 className="mb-0"><i className="fas fa-list-ul me-2"></i>Available Videos for Processing</h5></div>
                                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    { isRetrieving ? <p>Loading folders...</p> : (
                                        folders.length > 0 ? (
                                            folders.map(folder => (
                                                <div key={folder.id} className="mb-3">
                                                    <strong className="d-block mb-2">Folder: {folder.name}</strong>
                                                    <ul className="list-group">
                                                        {folder.videos.map(video => (
                                                            <li key={video}
                                                                className={`list-group-item list-group-item-action ${selectedVideo.videoName === video && selectedVideo.folderName === folder.name ? 'active' : ''}`}
                                                                onClick={() => handleVideoSelect(folder.name, video)}
                                                                style={{ cursor: 'pointer' }}>{video}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <button className="btn btn-sm btn-primary mt-2" onClick={() => handleProcess(folder.name)}>Process All in this Folder</button>
                                                </div>
                                            ))
                                        ) : <p className="text-center text-muted">No video folders found. Use the form above to retrieve videos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Video Preview */}
                        <div className="col-md-7">
                            <div className="card shadow-sm">
                                <div className="card-header"><h5 className="mb-0"><i className="fas fa-eye me-2"></i>Video Preview</h5></div>
                                <div className="card-body video-preview-container">
                                    { isPreviewLoading ? (
                                        <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div><p>Loading Preview...</p></div>
                                    ) : previewUrl ? (
                                        <video src={previewUrl} controls autoPlay width="100%">Your browser does not support the video tag.</video>
                                    ) : (
                                        <div className="text-center text-muted"><p>Select a video from the list to preview it here.</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default S3DashboardPage;