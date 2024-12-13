import VisuallyHiddenInput from './VisuallyHiddenInput';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';


/*

({uin} is used as unique ID)
peerTeacher = {
    firstname: string,
    lastname: string,
    uin: string,
    hours: int,
    busyTimes: {
        'M': array[string],     // ex. 01:00-14:00
        'T': array[string],
        'W': array[string],
        'R': array[string],
        'F': array[string],
        'S': array[string],
    },
    labs: array[{ course: string, section: string }]
}

*/

const PeerTeacherUploadButton = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {

    const deletePT = (uin) => {

        // console.log(uin);
        // peerTeachers = peerTeachers.filter(pt => pt.uin !== uin);
        // setPeerTeachers(() => [...peerTeachers])
        // setLabs(labs.map((lab) => lab.pt === uin ? { ...lab, assigned: false, pt: undefined } : lab));
        setPeerTeachers((prevPeerTeachers) => {
            const updatedPeerTeachers = prevPeerTeachers.filter(pt => pt.uin !== uin);
            return updatedPeerTeachers;
        })

        setLabs((prevLabs) => {
            const updatedLabs = prevLabs.map((lab) => {
                if (lab.pt.includes(uin)) {
                    let a = lab.pt.filter((b) => b !== uin);
                    return { ...lab, pt: a };
                }
                return lab;
            });
            return updatedLabs;
        })
    }

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            let pt = { hours: 0 }
            let text = event.target.result;
            text = text.trim();
            const lines = text.split('\n');
            const ptInfo = lines[0].split(' ');
            pt.firstname = ptInfo.slice(0, ptInfo.length - 2).join(" ").trim();
            pt.lastname = ptInfo[ptInfo.length - 2].trim();
            pt.uin = ptInfo[ptInfo.length - 1].trim();

            const duplicates = [];
            peerTeachers.forEach((elem) => {
                if (elem.uin === pt.uin) {
                    duplicates.push(elem.uin);
                }
            })

            // console.log(duplicates);

            // for (let i = 0; i < duplicates.length; ++i) {
            //     deletePT(duplicates[i]);
            // }
            duplicates.forEach(deletePT);

            let busyTimes = {
                'M': [],
                'T': [],
                'W': [],
                'R': [],
                'F': [],
            }
            // console.log(lines.slice(1))
            const rest = lines.slice(1);
            for (const i in rest) {
                const line = rest[i].trim()
                if (line.length === 0) {
                    continue;
                }
                // console.log(line);
                const lineSplit = line.split(' ');
                const times = lineSplit.slice(1).join("").trim();
                // console.log(lineSplit);
                // console.log(times);
                const days = lineSplit[0];
                for (const i in days) {
                    const day = days[i].toUpperCase();
                    // console.log(day);
                    if (Object.keys(busyTimes).includes(day)) {
                        busyTimes[day].push(times);
                    }
                }
            }
            pt.busyTimes = busyTimes;
            pt.labs = []
            setPeerTeachers((prevPeerTeachers) => {
                let a = [...prevPeerTeachers, pt]
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
                return a;
            })
        }
        reader.readAsText(file);
    }

    const handleFile = (event) => {
        // console.log(event.target.files)
        // console.log(event.target.files[0])
        const files = event.target.files;
        for (let i = 0; i < files.length; ++i) {
            if (files[i]) {
                parseFile(files[i]);
            }
        }
    }

    return (
        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
        >
            Upload Peer Teachers
            <VisuallyHiddenInput 
                type="file"
                onChange={handleFile}
                multiple
                accept='.txt'
            />
        </Button>
    )
}

export default PeerTeacherUploadButton;