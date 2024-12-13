import VisuallyHiddenInput from './VisuallyHiddenInput';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const DatabaseUploadButton = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {

    const deletePT = (uin) => {
        setPeerTeachers((prevPeerTeachers) => {
            const updatedPeerTeachers = prevPeerTeachers.filter(pt => pt.uin !== uin);
            return updatedPeerTeachers;
        })

        setLabs((prevLabs) => {
            const updatedLabs = prevLabs.map((lab) =>
                lab.pt === uin ? { ...lab, assigned: false, pt: undefined } : lab
            );
            return updatedLabs;
        })
    }

    const deleteLab = (lab) => {
        // console.log(lab);
        let temp = labs.filter(elem => elem.course === lab.course && elem.section === lab.section);
        if (temp.pt !== undefined) {
            setPeerTeachers((prevPeerTeachers) => {
                let updatedPT = prevPeerTeachers.find(pt => pt.uin === temp.pt);
                updatedPT.hours -= temp.hours;
                const updatedPeerTeachers = prevPeerTeachers.map(
                    (pt) => pt.uin === updatedPT.uin ? updatedPT : pt
                );
                return updatedPeerTeachers;
            })
        }

        setLabs((prevLabs) => {
            const updatedLabs = prevLabs.filter(elem => !(elem.course === lab.course && elem.section === lab.section));
            return updatedLabs;
        })
    }

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const jsonData = JSON.parse(event.target.result);
            setLabs(jsonData.labs);
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
            // console.log(a);
            setPeerTeachers(a);
        }
        reader.readAsText(file);
    }

    const handleFile = (event) => {
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