import UploadDialog from "./UploadDialog";

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from "react";
import PeerTeacherUploadButton from "./dialog-components/PeerTeacherUploadButton";

const PeerTeacherDialogButton = ({ peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT }) => {
    const [ openDialog, setOpenDialog ] = useState(false);

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
            Upload Peer Teachers
        </Button>
        <UploadDialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            title={"Upload Peer Teachers"}
            content={{
                'Notes': 'Can upload multiple files.\nExample file is as below:\n\nfirstname lastname UIN\n\nMWF 11:00 - 14:00\nTR 09:00 - 15:45\nW 17:00 - 18:00\nM 08:00 - 09:00',
                'Warning': 'In the event of duplicate Peer Teachers, the Peer Teacher will be overwritten'
            }}
            UploadButton={PeerTeacherUploadButton}
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

export default PeerTeacherDialogButton;