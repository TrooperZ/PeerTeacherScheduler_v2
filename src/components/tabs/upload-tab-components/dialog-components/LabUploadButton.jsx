import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisuallyHiddenInput from '../VisuallyHiddenInput';
import { mergeLabs, parseLabs } from '../../../../utils/importData';

const LabUploadButton = ({ setLabs, setLoading, setCompleted, setError }) => {
    const handleFile = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setLoading(true);
        setCompleted(false);
        setError(false);
        try {
            const imported = parseLabs(await file.text());
            setLabs((current) => mergeLabs(current, imported));
        } catch {
            setError(true);
        }
        setLoading(false);
        setCompleted(true);
    };

    return (
        <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
            Upload Labs
            <VisuallyHiddenInput type="file" onChange={handleFile} accept=".json,application/json" />
        </Button>
    );
};

export default LabUploadButton;
