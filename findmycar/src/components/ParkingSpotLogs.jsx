import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from '@mui/material';

import eventService from '../services/events';
import io from 'socket.io-client'; // Import Socket.IO client

function ParkingSpotLogs() {
    const { parkingSpotId } = useParams(); // Get parking spot ID from the route
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Fetch initial logs
        const fetchLogs = async () => {
            try {
                const result = await eventService.getEvents();
                const filteredLogs = result.filter(
                    (item) => item.parking_spot_id === parkingSpotId
                );
                setLogs(filteredLogs);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };
        fetchLogs();

        // Initialize Socket.IO client
        const socket = io('http://localhost:3001'); // Replace with your backend URL

        // Listen for 'carParkUpdate' events
        socket.on('carParkUpdate', (data) => {
            console.log*("Real-time update received:", data);
            if (data.operationType === 'insert') {
                const newLog = data.document;

                // Check if the update is for the current parking spot
                if (newLog.parking_spot_id === parkingSpotId) {
                    // Update logs state with the new log at the beginning
                    setLogs((prevLogs) => [newLog, ...prevLogs]);
                }
            }
        });

        // Cleanup function to disconnect the socket when component unmounts
        return () => {
            socket.disconnect();
        };
    }, [parkingSpotId]);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>
                Logs for Parking Spot: {parkingSpotId}
            </Typography>
            {logs.length > 0 ? (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Device ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Plate Number</TableCell>
                                <TableCell>Timestamp</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((item, index) => (
                                <TableRow key={item._id || index}>
                                    <TableCell>{item.device_id}</TableCell>
                                    <TableCell>{item.status}</TableCell>
                                    <TableCell>{item.plate_number || 'N/A'}</TableCell>
                                    <TableCell>{item.timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                    No logs found for this parking spot.
                </Typography>
            )}
        </Container>
    );
}

export default ParkingSpotLogs;
