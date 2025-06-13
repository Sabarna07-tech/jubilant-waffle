import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import '../assets/css/dashboard.css';
import { getSystemStatus, getChartData } from '../api/apiService'; // Assuming you have these

const DashboardPage = () => {
    const [systemStatus, setSystemStatus] = useState({
        total_videos: 0,
        total_detections: 0,
        processing_speed: "N/A",
        storage_usage: "0 GB"
    });
    const [chartData, setChartData] = useState(null);

    const damageChartRef = useRef(null);
    const typesChartRef = useRef(null);
    const severityChartRef = useRef(null);
    const locationChartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Uncomment these lines when you connect to a real backend
                // const statusRes = await getSystemStatus();
                // const chartRes = await getChartData();
                // setSystemStatus(statusRes);
                // setChartData(chartRes);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchData();

        // Mock data for demonstration
        setSystemStatus({ total_videos: 25, total_detections: 12, processing_speed: "Optimal", storage_usage: "1.2 GB" });
        setChartData({
            damage_by_date: { labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], data: [2, 3, 1, 5, 4] },
            damage_types: { labels: ['Scratch', 'Dent', 'Crack', 'Rust'], data: [5, 3, 2, 2] },
            damage_severity: { labels: ['Low', 'Medium', 'High'], data: [6, 4, 2] },
            damage_locations: { labels: ['Front', 'Side', 'Top', 'Back'], data: [3, 5, 1, 3] },
        });
    }, []);

    useEffect(() => {
        if (!chartData) return;

        // FIX: Set the default color for all chart text (labels, legends, axes) to white
        Chart.defaults.color = '#fff';

        const chartInstances = [];

        // Helper to destroy and create a new chart
        const createChart = (ref, config) => {
            if (ref.current) {
                 if (ref.current.chart) {
                    ref.current.chart.destroy();
                }
                const ctx = ref.current.getContext('2d');
                ref.current.chart = new Chart(ctx, config);
                chartInstances.push(ref.current.chart);
            }
        };

        // Chart configurations
        createChart(damageChartRef, { type: 'bar', data: { labels: chartData.damage_by_date.labels, datasets: [{ label: '# of Damages', data: chartData.damage_by_date.data, backgroundColor: 'rgba(52, 152, 219, 0.7)' }] } });
        createChart(typesChartRef, { type: 'doughnut', data: { labels: chartData.damage_types.labels, datasets: [{ data: chartData.damage_types.data, backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'] }] } });
        createChart(severityChartRef, { type: 'pie', data: { labels: chartData.damage_severity.labels, datasets: [{ data: chartData.damage_severity.data, backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'] }] } });
        createChart(locationChartRef, { type: 'polarArea', data: { labels: chartData.damage_locations.labels, datasets: [{ data: chartData.damage_locations.data, backgroundColor: ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'] }] } });

        // Cleanup function
        return () => {
            chartInstances.forEach(chart => chart.destroy());
        };

    }, [chartData]);


    return (
        <div>
            <div className="row mb-4">
                <div className="col-md-12">
                    <h2 className="page-title"><i className="fas fa-chart-line me-2 text-info"></i>Dashboard</h2>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
                        </ol>
                    </nav>
                    <hr style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row mb-4">
                 {/* FIX: Added "dashboard-card" class for easier styling */}
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm dashboard-card"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-primary text-white me-3"><i className="fas fa-video"></i></div><div><h6 className="text-muted mb-1">Total Videos</h6><h3 className="mb-0">{systemStatus.total_videos}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm dashboard-card"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-danger text-white me-3"><i className="fas fa-exclamation-triangle"></i></div><div><h6 className="text-muted mb-1">Damages Detected</h6><h3 className="mb-0">{systemStatus.total_detections}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm dashboard-card"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-warning text-white me-3"><i className="fas fa-clock"></i></div><div><h6 className="text-muted mb-1">Processing Speed</h6><h3 className="mb-0">{systemStatus.processing_speed}</h3></div></div></div></div></div>
                 <div className="col-lg-3 col-md-6 mb-4"><div className="card shadow-sm dashboard-card"><div className="card-body"><div className="d-flex align-items-center"><div className="dashboard-icon bg-success text-white me-3"><i className="fas fa-database"></i></div><div><h6 className="text-muted mb-1">Storage Usage</h6><h3 className="mb-0">{systemStatus.storage_usage}</h3></div></div></div></div></div>
            </div>

            {/* Charts */}
            <div className="row mb-4">
                <div className="col-lg-8 mb-4"><div className="card shadow-sm h-100"><div className="card-header text-center"><h5 className="mb-0"><i className="fas fa-chart-bar me-2"></i>Damage Distribution by Date</h5></div><div className="card-body"><canvas ref={damageChartRef}></canvas></div></div></div>
                <div className="col-lg-4"><div className="card shadow-sm h-100"><div className="card-header text-center"><h5 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Damage Types</h5></div><div className="card-body"><canvas ref={typesChartRef}></canvas></div></div></div>
            </div>
            <div className="row mb-4">
                <div className="col-lg-6 mb-4"><div className="card shadow-sm h-100"><div className="card-header text-center"><h5 className="mb-0"><i className="fas fa-chart-pie me-2"></i>Severity Distribution</h5></div><div className="card-body"><canvas ref={severityChartRef}></canvas></div></div></div>
                <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-header text-center"><h5 className="mb-0"><i className="fas fa-map-marker-alt me-2"></i>Damage Locations</h5></div><div className="card-body"><canvas ref={locationChartRef}></canvas></div></div></div>
            </div>
        </div>
    );
};

export default DashboardPage;