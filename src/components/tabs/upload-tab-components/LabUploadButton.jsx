import VisuallyHiddenInput from './VisuallyHiddenInput';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const LabUploadButton = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {

    const validLabs = ['110', '111', '120', '121', '206', '221', '222', '312', '313', '314', '315', '331'];

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
            // let updatedLabs = labs;
            let updatedLabs = [];
            // let id = 1;
            // if (updatedLabs.length !== 0) {
            //     id = labs[labs.length - 1].id + 1;
            // }
            for (const data of jsonData) {
                if (data.SWV_CLASS_SEARCH_SUBJECT !== 'CSCE') {
                    continue;
                }
                // let lab = {id: id};
                let lab = {};
                if (!validLabs.includes(data.SWV_CLASS_SEARCH_COURSE)) {
                    continue;
                }
                // lab.lab = `${data.SWV_CLASS_SEARCH_COURSE} - ${data.SWV_CLASS_SEARCH_SECTION}`;
                lab.course = data.SWV_CLASS_SEARCH_COURSE;
                lab.section = data.SWV_CLASS_SEARCH_SECTION;
                if (data.SWV_CLASS_SEARCH_INSTRCTR_JSON) {
                    const professorData = JSON.parse(data.SWV_CLASS_SEARCH_INSTRCTR_JSON.replace('\\', ''))
                    // const professorData = data.SWV_CLASS_SEARCH_INSTRCTR_JSON;
                    // console.log(professorData);
                    lab.professor = '';
                    for (const professor of professorData) {
                        lab.professor = lab.professor.concat(professor.NAME);
                    }
                    // lab.professor = professorData.NAME;
                }

                if (data.SWV_CLASS_SEARCH_JSON_CLOB === null || data.SWV_CLASS_SEARCH_JSON_CLOB === undefined) {
                    continue;
                }
                const classData = JSON.parse(data.SWV_CLASS_SEARCH_JSON_CLOB.replace('\\', ''));
                // const classData = data.SWV_CLASS_SEARCH_JSON_CLOB;
                let noLab = true;
                for (const meeting of classData) {
                    if (meeting.SSRMEET_MTYP_CODE !== 'Laboratory') {
                        continue;
                    }
                    noLab = false;
                    let days = '';
                    if (meeting.SSRMEET_MON_DAY) {
                        days = days.concat('M');
                    }
                    if (meeting.SSRMEET_TUE_DAY) {
                        days = days.concat('T');
                    }
                    if (meeting.SSRMEET_WED_DAY) {
                        days = days.concat('W');
                    }
                    if (meeting.SSRMEET_THU_DAY) {
                        days = days.concat('R');
                    }
                    if (meeting.SSRMEET_FRI_DAY) {
                        days = days.concat('F');
                    }
                    const beginTime = new Date(`07/26/2003 ${meeting.SSRMEET_BEGIN_TIME}`);
                    const endTime = new Date(`07/26/2003 ${meeting.SSRMEET_END_TIME}`);
                    const time = `${days} ${meeting.SSRMEET_BEGIN_TIME} - ${meeting.SSRMEET_END_TIME}`;
                    const location = `${meeting.SSRMEET_BLDG_CODE} ${meeting.SSRMEET_ROOM_CODE}`;
                    lab.time = time;
                    lab.location = location;
                    const diff = (endTime - beginTime) / 60000;
                    const hours = (diff) / 60;
                    lab.hours = Math.max(1, hours);
                    lab.hours *= days.length;
                }
                if (noLab) {
                    continue;
                }
                
                lab.pt = [];
                lab.maxPTs = 1;

                const duplicates = [];
                updatedLabs.forEach((elem) => {
                    if (elem.course === lab.course && elem.section === lab.section) {
                        duplicates.push(elem);
                    }
                });

                duplicates.forEach(deleteLab);

                // console.log(lab);

                updatedLabs.push(lab);
                // ++id;
            }
            // setLabs(updatedLabs);
            setLabs((prevLabs) => [...prevLabs, ...updatedLabs]);
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
            Upload Labs
            <VisuallyHiddenInput
                type="file"
                onChange={handleFile}
                accept='.json'
            />
        </Button>
    )
}

export default LabUploadButton;