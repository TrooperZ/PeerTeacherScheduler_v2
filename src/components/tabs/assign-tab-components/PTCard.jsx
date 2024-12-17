import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';  // wrap everything in Card with this to simulate button
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, IconButton, Icon } from '@mui/material';
import { useState } from 'react';
import InfoDialog from './InfoDialog';


// show name, assigned hours
// Info will show busy times, notes
const PTCard = ({peerTeacher, setSelectedPT, available}) => {
    const [ openDialog, setOpenDialog ] = useState(false);

    const convertFrom24 = (time) => {
        const temp = time.split(':');
        const hour = parseInt(temp[0]);
        if (hour === 0) {
            return `12:${temp[1]} AM`;
        }
        if (hour <= 11) {
            return `${hour}:${temp[1]} AM`;
        }
        if (hour === 12) {
            return `12:${temp[1]} PM`;
        }
        return `${hour-12}:${temp[1]} PM`;
    }

    const dayMap = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday',
    }

    const handleCardClick = () => {
        // console.log("card click");
        setSelectedPT(peerTeacher);
    }

    const handleOpenDialog = () => {
        // console.log("info click")
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    }

    const generateContent = () => {
        // console.log(peerTeacher)
        let busyTimesFormatted = ''
        for (const [key, value] of Object.entries(peerTeacher.busyTimes)) {
            if (value.length === 0) {
                continue;
            }

            let valueString = '';
            for (const time of value) {
                let timeFormatted = '';
                const temp = time.split('-');
                for (const time24 of temp) {
                    timeFormatted = timeFormatted.concat(`${convertFrom24(time24)} - `);
                }
                timeFormatted = timeFormatted.slice(0, timeFormatted.length - 3);
                valueString = valueString.concat(`${timeFormatted} | `);
            }
            valueString = valueString.slice(0, valueString.length - 2);

            busyTimesFormatted = busyTimesFormatted.concat(`${key}: ${valueString}\n\n`)
        }
        return {'Busy Times': busyTimesFormatted.trim(), 'Notes': peerTeacher.notes ? peerTeacher.notes : 'None'};
    }

    return (
        <>
        <Card 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%', 
                backgroundColor: available ? '#000000' : '#FFFFF0',
                '& .MuiTypography-root': {
                    color: available ? '#FFFFF0' : '#000000', // Set text color inside Card to black
                },
                '& .MuiSvgIcon-root': {
                    color: available ? '#FFFFF0' : '#000000',
                }
            }}
        >
            <CardActionArea
                sx={{
                    display: 'flex', 
                    alignItems: 'center', 
                    flexGrow: 1, 
                    outline: 'none', 
                    '&:focus': {
                        outline: 'none', // Remove focus outline
                    }, 
                }}
                onClick={handleCardClick}
            >
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" component="div" sx={{fontWeight: 'bold'}}>
                        {`${peerTeacher.firstname} ${peerTeacher.lastname}`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {`Assigned Hours: ${peerTeacher.hours}`}
                    </Typography>
                </Box>
            </CardActionArea>
            <IconButton 
                onClick={handleOpenDialog} 
                sx={{ 
                    marginRight: 1,
                    outline: 'none',
                    '&:focus': {
                        outline: 'none', // Remove focus outline
                    }, 
                }}
            >
                <InfoIcon />
            </IconButton>
        </Card>
        <InfoDialog 
            open={openDialog}
            title={`Details for ${peerTeacher.firstname} ${peerTeacher.lastname}`}
            // content={{a: 'b', c: 'd'}}
            content={generateContent()}
            onClose={handleCloseDialog}
        />
        </>
    );
}

export default PTCard;