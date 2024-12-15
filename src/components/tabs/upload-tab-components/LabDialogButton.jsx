import UploadDialog from "./UploadDialog";

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from "react";
import LabUploadButton from "./dialog-components/LabUploadButton";

const LabDialogButton = ({ peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT }) => {
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
                Upload Labs
            </Button>
            <UploadDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                title={"Upload Labs"}
                content={{
                    'Notes': 'Upload the JSON file retrieved from the Howdy endpoint',
                    'Warning': 'In the event of duplicate Labs, the Lab will be overwritten',
                }}
                UploadButton={LabUploadButton}
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

export default LabDialogButton;