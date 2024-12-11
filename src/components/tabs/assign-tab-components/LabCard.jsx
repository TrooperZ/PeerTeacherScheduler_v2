import Card from '@mui/material/Card';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, IconButton, Icon } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useState } from 'react';
import InfoDialog from './InfoDialog';

// show lab, time, location
// Info will show location, hours
// Will have two states depending on if assigned or not (+, -)
// uses whether peerTeacher is undefined to differentiate
const LabCard = ({lab, peerTeacher}) => {
    const [ openDialog, setOpenDialog ] = useState(false);

    const generateContent = () => {
        return {'Professor': lab.professor, 'Hours': lab.hours}
    }

    const handleOpenDialog = () => {
        console.log('info click')
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    }

    const handleAdd = () => {
        console.log('add')
    }

    const handleRemove = () => {
        console.log('remove');
    }

    return (
        <>
        <Card sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box 
                sx={{
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    flexDirection: 'column',
                    outline: 'none',
                    '&:focus': {
                        outline: 'none', // Remove focus outline
                    },
                }}
            >
                <Typography variant="h6" component="div" sx={{fontWeight: 'bold'}}>
                    {`CSCE ${lab.course} - ${lab.section}`}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {`${lab.time}`}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {`${lab.location}`}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    outline: 'none',
                    '&:focus': {
                        outline: 'none', // Remove focus outline
                    },
                }}
            >
                <IconButton
                    sx={{
                        marginRight: 1,
                    }}
                    onClick={handleOpenDialog}
                >
                    <InfoIcon />
                </IconButton>
                {
                    peerTeacher ? 
                        <IconButton
                            sx={{
                                marginRight: 1,
                            }}
                            onClick={handleRemove}
                        >
                            <RemoveIcon />
                        </IconButton>
                    :
                        <IconButton
                            sx={{
                                marginRight: 1,
                            }}
                            onClick={handleAdd}
                        >
                            <AddIcon />
                        </IconButton>
                }
            </Box>
        </Card>
        <InfoDialog
            open={openDialog}
            title={`Details for CSCE ${lab.course} - ${lab.section}`}
            // content={{a: 'b', c: 'd'}}
            content={generateContent()}
            onClose={handleCloseDialog}
        />
        </>
    );
}

export default LabCard;