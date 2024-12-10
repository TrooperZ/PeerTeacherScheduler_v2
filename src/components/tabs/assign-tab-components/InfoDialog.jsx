import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Close from '@mui/icons-material/Close';
import { DialogActions, Typography, IconButton, Box } from '@mui/material';
import React from 'react';

const InfoDialog = ({open, content, onClose, title}) => {

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <strong style={{flexGrow: 1, fontSize: 24}}>
                        {title}
                    </strong>
                    <DialogActions>
                        <IconButton onClick={onClose} sx={{paddingRight: 0, marginRight: 0}}>
                            <Close />
                        </IconButton>
                    </DialogActions>
                </Box>
            </DialogTitle>
            <DialogContent>
                {
                    Object.entries(content).map(([key, value], index) => {
                        return (
                            <React.Fragment key={index}>
                            <Typography variant='h6' sx={{fontWeight: 'bold'}}>{`${key}`}</Typography>
                            <Typography variant='body1' sx={{whiteSpace: 'pre-line'}} >{`${value}`}</Typography>
                            <br/>
                            </React.Fragment>
                        );
                    })
                }
            </DialogContent>
        </Dialog>
    );
}

export default InfoDialog;