import PeerTeacherUploadButton from "./upload-tab-components/PeerTeacherUploadButton";
import LabUploadButton from "./upload-tab-components/LabUploadButton";

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
        </div>
    )
}

export default UploadTab;