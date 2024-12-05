import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import PlateQuery from './components/PlateQuery';
import Dashboard from './components/Dashboard';
import ParkingSpotLogs from './components/ParkingSpotLogs';
function App() {
    return (
        <Router>
            <div className="p-5">
                <nav className="mb-5">
                    <Link to="/" className="mr-5 text-blue-500">Plate Query</Link>
                    <Link to="/dashboard" className="text-blue-500">Dashboard</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<PlateQuery />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/parking-spot/:parkingSpotId" element={<ParkingSpotLogs />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
