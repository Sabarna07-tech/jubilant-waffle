import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import '../assets/css/dashboard.css';

// Mock data that would come from an API
const mockSystemStatus = {
    total_videos: 25,
    total_detections: 12,
    processing_speed: "Optimal",
    storage_usage: "1.2 GB"
};

const mockChartData = {
    damage_by_date: { labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], data: [2, 3, 1, 5, 4] },
    damage_types: { labels: ['Scratch', 'Dent', 'Crack', 'Rust'], data: [5, 3, 2, 2] },
    damage_severity: { labels: ['Low', 'Medium', 'High'], data: [6, 4, 2] },
    damage_locations: { labels: ['Front', 'Side', 'Top', 'Back'], data: [3, 5, 1, 3] },
};

const DashboardPage = () => {
    const [systemStatus, setSystemStatus] = useState(mockSystemStatus);
    const [chartData, setChartData] = useState(mockChartData);

    const damageChartRef = useRef(null);
    const typesChartRef = useRef(null);
    const severityChartRef = useRef(null);
    const locationChartRef = useRef(null);
    
    useEffect(() => {
        // Fetch data from API here and setSystemStatus and setChartData
    }, []);

    useEffect(() => {
        const chartRefs = [damageChartRef, typesChartRef, severityChartRef, locationChartRef];
        const charts = [];

        // Damage Distribution by Date (Bar Chart)
        if (damageChartRef.current && chartData.damage_by_date) {
            const damageCtx = damageChartRef.current.getContext('2d');
            charts.push(new Chart(damageCtx, { type: 'bar', data: { labels: chartData.damage_by_date.labels, datasets: [{ label: '# of Damages', data: chartData.damage_by_date.data, backgroundColor: 'rgba(54, 162, 235, 0.6)' }] } }));
        }

        // Damage Types (Doughnut Chart)
        if (typesChartRef.current && chartData.damage_types) {
            const typesCtx = typesChartRef.current.getContext('2d');
            charts.push(new Chart(typesCtx, { type: 'doughnut', data: { labels: chartData.damage_types.labels, datasets: [{ data: chartData.damage_types.data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }] } }));
        }

        // Severity Distribution (Pie Chart)
        if (severityChartRef.current && chartData.damage_severity) {
            const severityCtx = severityChartRef.current.getContext('2d');
            charts.push(new Chart(severityCtx, { type: 'pie', data: { labels: chartData.damage_severity.labels, datasets: [{ data: chartData.damage_severity.data, backgroundColor: ['#4BC0C0', '#FFCE56', '#FF6384'] }] } }));
        }
        
        // Damage Locations (Polar Area Chart)
        if (locationChartRef.current && chartData.damage_locations) {
            const locationCtx = locationChartRef.current.getContext('2d');
            charts.push(new Chart(locationCtx, { type: 'polarArea', data: { labels: chartData.damage_locations.labels, datasets: [{ data: chartData.damage_locations.data, backgroundColor: ['#FF6384', '#4BC0C0', '#FFCE56', '#E7E9ED'] }] } }));
        }
        
        // Cleanup function to destroy charts on component unmount
        return () => charts.forEach(chart => chart.destroy());

    }, [chartData]);


    return (
        <div>
            <div className="row mb-4"><div className="col-md-12"><h2 className="page-title"><i className="fas fa-chart-line me-2 text-info"></i>Dashboard</h2><nav aria-label="breadcrumb"><ol className="breadcrumb"><li className="breadcrumb-item"><Link to="/">Home</Link></li><li className="breadcrumb-item active">Dashboard</li></ol></nav><hr /></div></div>

            {/* Stat Cards */}
            <div className="row mb-4">
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-primary text-white me-3"><i className="fas fa-video"></i></div><div><h6 className="text-muted mb-1">Total Videos</h6><h3 className="mb-0">{systemStatus.total_videos}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-danger text-white me-3"><i className="fas fa-exclamation-triangle"></i></div><div><h6 className="text-muted mb-1">Damages Detected</h6><h3 className="mb-0">{systemStatus.total_detections}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-warning text-white me-3"><i className="fas fa-clock"></i></div><div><h6 className="text-muted mb-1">Processing Speed</h6><h3 className="mb-0">{systemStatus.processing_speed}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-success text-white me-3"><i className="fas fa-database"></i></div><div><h6 className="text-muted mb-1">Storage Usage</h6><h3 className="mb-0">{systemStatus.storage_usage}</h3></div></div></div></div></div>
            </div>

            {/* Charts */}
            <div className="row mb-4">
                <div className="col-lg-8 mb-4"><div className="card shadow-sm h-100"><div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-chart-bar me-2"></i>Damage Distribution by Date</h5></div><div className="card-body"><canvas ref={damageChartRef}></canvas></div></div></div>
                <div className="col-lg-4"><div className="card shadow-sm h-100"><div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Damage Types</h5></div><div className="card-body"><canvas ref={typesChartRef}></canvas></div></div></div>
            </div>
            <div className="row mb-4">
                <div className="col-lg-6 mb-4"><div className="card shadow-sm h-100"><div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Severity Distribution</h5></div><div className="card-body"><canvas ref={severityChartRef}></canvas></div></div></div>
                <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-header bg-light"><h5 className="mb-0"><i className="fas fa-map-marker-alt me-2"></i>Damage Locations</h5></div><div className="card-body"><canvas ref={locationChartRef}></canvas></div></div></div>
            </div>
        </div>
    );
};

export default DashboardPage;