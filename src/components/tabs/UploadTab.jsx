import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import PeerTeacherDialogButton from "./upload-tab-components/PeerTeacherDialogButton";
import LabDialogButton from "./upload-tab-components/LabDialogButton";
import DatabaseDialogButton from "./upload-tab-components/DatabaseDialogButton";
import DatabaseDownloadButton from "./upload-tab-components/DatabaseDownloadButton";

const UploadTab = ({peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT}) => {
    return (
        <Container>
            <Stack direction="row" spacing={2}>
                <PeerTeacherDialogButton
                    peerTeachers={peerTeachers}
                    setPeerTeachers={setPeerTeachers}
                    labs={labs}
                    setLabs={setLabs}
                    selectedPT={selectedPT}
                    setSelectedPT={setSelectedPT}
                />
                <LabDialogButton
                    peerTeachers={peerTeachers}
                    setPeerTeachers={setPeerTeachers}
                    labs={labs}
                    setLabs={setLabs}
                    selectedPT={selectedPT}
                    setSelectedPT={setSelectedPT}
                />
                <DatabaseDialogButton
                    peerTeachers={peerTeachers}
                    setPeerTeachers={setPeerTeachers}
                    labs={labs}
                    setLabs={setLabs}
                    selectedPT={selectedPT}
                    setSelectedPT={setSelectedPT}
                />
                <DatabaseDownloadButton
                    peerTeachers={peerTeachers}
                    labs={labs}
                />
            </Stack>
        </Container>
    )
}

export default UploadTab;