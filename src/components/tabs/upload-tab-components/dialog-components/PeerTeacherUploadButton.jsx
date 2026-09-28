import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisuallyHiddenInput from '../VisuallyHiddenInput';
import { mergePeerTeachers, parsePeerTeacher } from '../../../../utils/importData';

const PeerTeacherUploadButton = ({ setPeerTeachers, setLabs, setLoading, setCompleted, setError, selectedPT, setSelectedPT }) => {
    const handleFile = async (event) => {
        const files = [...event.target.files];
        event.target.value = '';
        if (!files.length) return;
        setLoading(true);
        setCompleted(false);
        setError(false);
        let failed = false;

        for (const file of files) {
            try {
                const pt = parsePeerTeacher(await file.text());
                setPeerTeachers((current) => mergePeerTeachers(current, [pt]));
                if (pt.uin) setLabs((current) => current.map((lab) => ({ ...lab, pt: lab.pt?.filter((uin) => uin !== pt.uin) || [], lockedPTs: lab.lockedPTs?.filter((uin) => uin !== pt.uin) || [] })));
                if (selectedPT?.uin === pt.uin) setSelectedPT(null);
            } catch {
                failed = true;
            }
        }

        setError(failed);
        setLoading(false);
        setCompleted(true);
    };

    return (
        <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
            Upload Peer Teachers
            <VisuallyHiddenInput type="file" onChange={handleFile} multiple accept=".json,.txt,application/json,text/plain" />
        </Button>
    );
};

export default PeerTeacherUploadButton;
