import UploadDialog from "./UploadDialog";

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from "react";
import DatabaseUploadButton from "./DatabaseUploadButton";

const DatabaseDialogButton = ({ peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT }) => {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                onClick={() => setOpenDialog(true)}
            >
                Upload Database
            </Button>
            <UploadDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                title={"Upload Database"}
                content={{
                    'Warning': 'If sucessful, this will overwrite the current Database. Make sure to save the current Databse before uploading another Database'
                }}
                UploadButton={DatabaseUploadButton}
                peerTeachers={peerTeachers}
                setPeerTeachers={setPeerTeachers}
                labs={labs}
                setLabs={setLabs}
                selectedPT={selectedPT}
                setSelectedPT={setSelectedPT}
            />
        </>
    )
}

export default DatabaseDialogButton;