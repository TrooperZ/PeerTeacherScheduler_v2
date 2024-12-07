import Button from '@mui/material/Button';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';

const DatabaseDownloadButton = ({ peerTeachers, labs }) => {

    const handleDownload = () => {
        const jsonString = JSON.stringify({ labs: labs, peerTeachers: peerTeachers });

        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'database.json';
        link.click();
    }

    return (
        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudDownloadIcon />}
            // type='button'
            // href={`data:text/json;charset=utf-8,${encodeURIComponent(
            //     JSON.stringify({ labs: labs, peerTeachers: peerTeachers })
            // )}`}
            // download={'database.json'}
            onClick={handleDownload}
        >
            Download Database
        </Button>
    );
}

export default DatabaseDownloadButton;