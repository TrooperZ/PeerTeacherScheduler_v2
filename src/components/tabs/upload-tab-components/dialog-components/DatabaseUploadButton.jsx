import VisuallyHiddenInput from '../VisuallyHiddenInput';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { addCourseColors } from '../../../../utils/schedule';

const DatabaseUploadButton = ({ setPeerTeachers, setLabs, setLoading, setCompleted, setError, setSelectedPT }) => {

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                let b = jsonData.labs;
                b.sort((labA, labB) => {
                    let cA = labA.course.toLowerCase();
                    let cB = labB.course.toLowerCase();
                    if (cA !== cB) {
                        return cA < cB ? -1 : 1;
                    }
                    cA = labA.section.toLowerCase();
                    cB = labB.section.toLowerCase();
                    if (cA < cB) {
                        return -1;
                    }
                    if (cB < cA) {
                        return 1;
                    }
                    return 0;
                });
                setLabs(addCourseColors(b));

                let a = jsonData.peerTeachers;
                // console.log(a);
                a.sort((ptA, ptB) => {
                    let lA = ptA.lastname.toLowerCase();
                    let lB = ptB.lastname.toLowerCase();
                    if (lA !== lB) {
                        // console.log(lA, '<', lB, 'is ', lA < lB);
                        if (lA < lB) {
                            return -1;
                        }
                        return 1;
                    }
                    lA = ptA.firstname.toLowerCase();
                    lB = ptB.firstname.toLowerCase(); 
                    // return ptA.firstname.toLowerCase() < ptB.firstname.toLowerCase();
                    if (lA < lB) {
                        return -1;
                    }
                    if (lB < lA) {
                        return 1;
                    }
                    return 0;
                });
                setPeerTeachers(a);
                setSelectedPT(null);
            }
            catch {
                // console.log(e)
                setError(true);
            }
            // console.log(a);
            setLoading(false);
            setCompleted(true);
        }
        reader.readAsText(file);
    }

    const handleFile = (event) => {
        setLoading(true);
        setError(false);
        // console.log(event.target.files)
        // console.log(event.target.files[0])
        const file = event.target.files[0];
        parseFile(file);
    }

    return (
        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
        >
            Upload Database
            <VisuallyHiddenInput
                type="file"
                onChange={handleFile}
                accept='.json'
            />
        </Button>
    )
}

export default DatabaseUploadButton;
