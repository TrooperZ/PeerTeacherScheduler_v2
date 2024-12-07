import PeerTeacherUploadButton from "./upload-tab-components/PeerTeacherUploadButton";
import LabUploadButton from "./upload-tab-components/LabUploadButton";
import DatabaseUploadButton from "./upload-tab-components/DatabaseUploadButton";
import DatabaseDownloadButton from "./upload-tab-components/DatabaseDownloadButton";

const UploadTab = ({peerTeachers, setPeerTeachers, labs, setLabs}) => {
    return (
        <div>
            <PeerTeacherUploadButton 
                peerTeachers={peerTeachers}
                setPeerTeachers={setPeerTeachers}
                labs={labs}
                setLabs={setLabs}
            />
            <LabUploadButton 
                peerTeachers={peerTeachers}
                setPeerTeachers={setPeerTeachers}
                labs={labs}
                setLabs={setLabs}
            />
            <DatabaseUploadButton
                peerTeachers={peerTeachers}
                setPeerTeachers={setPeerTeachers}
                labs={labs}
                setLabs={setLabs}
            />
            <DatabaseDownloadButton
                peerTeachers={peerTeachers}
                labs={labs}
            />
        </div>
    )
}

export default UploadTab;