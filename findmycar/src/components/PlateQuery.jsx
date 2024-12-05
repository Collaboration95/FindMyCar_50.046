import React, { useState } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import eventService from '../services/events';
import RenderEnv from './RenderEnv';

function PlateQuery() {
    const [plateNumber, setPlateNumber] = useState('');
    const [data, setData] = useState([]);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!plateNumber.trim()) {
            alert('Please enter a valid plate number');
            return;
        }
        const result = await eventService.getEventsByPlateNumber(plateNumber);
        setData(result);
        setSearchPerformed(true); 
        if (result.length > 0) {
            setSelectedSpot(result[0].parking_spot_id); 
        } else {
            setSelectedSpot(null); 
        }
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom className="Raleway-font">
                Find Your Car
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    marginBottom: 4,
                }}
            >
                <TextField
                    fullWidth
                    type="text"
                    label="Enter Plate Number"
                    variant="outlined"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{ height: { sm: '56px' } }}
                >
                    Search
                </Button>
            </Box>

            {data.length > 0 ? (
    <>
  <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
            Your vehicle with plate number <strong>{plateNumber}</strong> is located at <strong>{data[0].parking_spot_id}</strong>.
        </Typography>

        <div
            style={{
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)'
            }}
        >
            <RenderEnv parkingSpot={selectedSpot} />
        </div>

        <Typography
            variant="body2" 
            color="textSecondary"
            align="center"
            sx={{ marginTop: 2 }}
        >
            Information last checked at <strong>{data[0].timestamp}</strong>.
        </Typography>
    </>
) : (
    searchPerformed && data.length === 0 ? (
        <Typography
            variant="body1"
            color="error"
            align="center"
        >
            No data found for this plate number.
        </Typography>
    ) : (
        <Typography
            variant="body1"
            color="textSecondary" // Default text color
            align="center"
        >
            Enter a plate number to search.
        </Typography>
    )
)}

        </Container>
    );
}

export default PlateQuery;
