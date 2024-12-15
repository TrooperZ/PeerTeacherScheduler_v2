import VisuallyHiddenInput from '../VisuallyHiddenInput';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const DatabaseUploadButton = ({ peerTeachers, setPeerTeachers, labs, setLabs, setLoading, setCompleted, setError, selectedPT, setSelectedPT }) => {

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

        if (selectedPT && uin === selectedPT.uin) {
            setSelectedPT(null);
        }
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
                setLabs(b);

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
            catch (e) {
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