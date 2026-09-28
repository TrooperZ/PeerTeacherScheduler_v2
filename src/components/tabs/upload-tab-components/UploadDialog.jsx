import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { Fragment, useState } from 'react';

const UploadDialog = ({ open, onClose, content, title, UploadButton, peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT }) => {
    const [ loading, setLoading ] = useState(false);
    const [ completed, setCompleted ] = useState(false);
    const [ error, setError ] = useState(false);

    const handleClose = () => {
        onClose();
        setCompleted(false);
        setError(false);
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <strong style={{ flexGrow: 1, fontSize: 24 }}>
                        {title}
                    </strong>
                    <DialogActions>
                        <IconButton onClick={handleClose} sx={{ paddingRight: 0, marginRight: 0 }}>
                            <Close />
                        </IconButton>
                    </DialogActions>
                </Box>
            </DialogTitle>
            <DialogContent>
                {
                    Object.entries(content).map(([key, value], index) => {
                        return (
                            <Fragment key={index}>
                                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>{`${key}`}</Typography>
                                <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }} >{`${value}`}</Typography>
                                <br />
                            </Fragment>
                        );
                    })
                }
                {
                    loading &&
                        <Box>
                            <Typography variant='body1'>
                                Uploading
                            </Typography>
                            <CircularProgress />
                        </Box>
                }
                {
                    completed && !error &&
                        <Typography variant='body1'>
                            Upload Completed successfully
                        </Typography>
                }
                {
                    completed && error &&
                    <Typography variant='body1'>
                        Upload Completed with Errors
                    </Typography>
                }
                {
                    !loading &&
                        <UploadButton
                            peerTeachers={peerTeachers}
                            setPeerTeachers={setPeerTeachers}
                            labs={labs}
                            setLabs={setLabs}
                            setLoading={setLoading}
                            setCompleted={setCompleted}
                            setError={setError}
                            selectedPT={selectedPT}
                            setSelectedPT={setSelectedPT}
                        />
                        // UploadButton
                }
            </DialogContent>
        </Dialog>
    )
}

export default UploadDialog;
