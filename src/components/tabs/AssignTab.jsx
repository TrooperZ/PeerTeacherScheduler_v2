import Box from '@mui/material/Box';

import PTCard from './assign-tab-components/PTCard';
import LabCard from './assign-tab-components/LabCard';
import { Stack, Divider, Typography, Container } from '@mui/material';
import UnassignedLabCard from './assign-tab-components/UnassignedLabCard';

const dayToWeekdayMap = {
    'M': '07/21/2003',
    'T': '07/22/2003',
    'W': '07/23/2003',
    'R': '07/24/2003',
    'F': '07/25/2003',
    'S': '07/26/2003',
}

const AssignTab = ({peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT, selectedLab, setSelectedLab}) => {

    const isPossibleLab = (lab, pt) => {
        if (!lab) {
            return false;
        }
        if (lab.pt.length >= lab.maxPTs) {
            return false;
        }
        let assignedLabs = [];
        labs.forEach((possibleLab) => {
            pt.labs.forEach((assignedLab) => {
                if (possibleLab.course === assignedLab.course && possibleLab.section === assignedLab.section) {
                    assignedLabs.push(possibleLab);
                }
            })
        })
        // console.log(assignedLabs);

        const timeSplit = lab.time.split(' ')
        const days = timeSplit[0];
        const startEnd = timeSplit.slice(1).join(' ');
        const startEndSplit = startEnd.split('-');
        const startTime = startEndSplit[0].trim();
        const endTime = startEndSplit[1].trim();
        // console.log(startEndSplit);
        for (const day of days) {
            if (pt.busyTimes[day].length === 0) {
                continue;
            }
            const checkTimeStart = new Date(`${dayToWeekdayMap[day]} ${startTime}`);
            const checkTimeEnd = new Date(`${dayToWeekdayMap[day]} ${endTime}`);
            for (const timeRange of pt.busyTimes[day]) {
                const timeRangeSplit = timeRange.split('-');
                const ptBusyStart = new Date(`${dayToWeekdayMap[day]} ${timeRangeSplit[0]}`);
                const ptBusyEnd = new Date(`${dayToWeekdayMap[day]} ${timeRangeSplit[1]}`);
                // console.log(ptBusyEnd, '<', checkTimeStart, 'is', ptBusyEnd < checkTimeStart)
                // console.log(ptBusyStart, '>', checkTimeEnd, 'is', ptBusyStart > checkTimeEnd)
                if (!(ptBusyEnd < checkTimeStart || ptBusyStart > checkTimeEnd)) {
                    console.log(ptBusyEnd, '<', checkTimeStart, '||', ptBusyStart, '>', checkTimeEnd);
                    // console.log(`${lab.course} - ${lab.section} failed check: hours`);
                    return false;
                }
            }

            for (const assignedLab of assignedLabs) {
                const assignedLabSplit = assignedLab.time.split(' ');
                const assignedDays = assignedLabSplit[0];
                const assignedStartEnd = assignedLabSplit.slice(1).join(' ');
                const assignedStartEndSplit = assignedStartEnd.split('-');
                const assignedStartTime = assignedStartEndSplit[0].trim();
                const assignedEndTime = assignedStartEndSplit[1].trim();

                for (const assignedDay of assignedDays) {
                    const assignedCheckTimeStart = new Date(`${dayToWeekdayMap[assignedDay]} ${assignedStartTime}`);
                    const assignedCheckTimeEnd = new Date(`${dayToWeekdayMap[assignedDay]} ${assignedEndTime}`);
                    if (!(assignedCheckTimeEnd < checkTimeStart || assignedCheckTimeStart > checkTimeEnd)) {
                        // console.log(`${lab.course} - ${lab.section} failed check: lab`);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    const getPossibleLabs = () => {
        // console.log(selectedPT);
        if (selectedPT) {
            let possibleLabs = [];
            for (const lab of labs) {
                if (isPossibleLab(lab, selectedPT)) {
                    possibleLabs.push(lab);
                }
            }
            possibleLabs.sort((labA, labB) => {
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
            })
            return possibleLabs;
        }

        return [];
    }

    const getAssignedLabs = () => {
        if (selectedPT) {
            let assignedLabs = [];
            for (const {course, section} of selectedPT.labs) {
                labs.forEach((lab) => {
                    if (lab.course === course && lab.section === section) {
                        assignedLabs.push(lab);
                    }
                })
            }
            assignedLabs.sort((labA, labB) => {
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
            })
            return assignedLabs;
        }

        return [];
    }

    const getUnassignedLabs = () => {
        let unassignedLabs = [];
        for (const lab of labs) {
            // console.log(lab.pt.length, '<', labs)
            if (lab.pt.length < lab.maxPTs) {
                unassignedLabs.push(lab);
            }
        }

        unassignedLabs.sort((labA, labB) => {
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

        // console.log(unassignedLabs);

        return unassignedLabs;
    }

    const addLabToPT = (lab) => {
        let uin = selectedPT.uin;
        lab.pt.push(uin);
        let updatedPT = peerTeachers.find(pt => pt.uin === uin);
        updatedPT.hours += lab.hours;
        updatedPT.labs.push({ 'course': lab.course, 'section': lab.section });
        setLabs(labs.map((elem) => (elem.course === lab.course && elem.section === lab.section) ? lab : elem));
        setPeerTeachers(peerTeachers.map((elem) => (elem.uin === uin) ? updatedPT : elem));
        // setSelectedPT(updatedPT);
    }

    const removeLabFromPT = (lab) => {
        let uin = selectedPT.uin;
        lab.pt = lab.pt.filter((elem) => elem !== uin);
        let updatedPT = peerTeachers.find(pt => pt.uin === uin);
        updatedPT.hours -= lab.hours;
        updatedPT.labs = updatedPT.labs.filter((elem) => !(elem.course === lab.course && elem.section === lab.section));
        setLabs(labs.map((elem) => (elem.course === lab.course && elem.section === lab.section) ? lab : elem));
        setPeerTeachers(peerTeachers.map((elem) => (elem.uin === uin) ? updatedPT : elem));
        // setSelectedPT(updatedPT);
    }

    return (
        <>
        <Box
            sx={{
                backgroundColor: '#510000',
                padding: '10px 50px 10px 50px',
                marginBottom: '10px',
                // height: 600,
                width: '900px',
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                spacing={2}
                divider={<Divider orientation="vertical" flexItem sx={{ backgroundColor: '#211306', width: '4px'}} />}
            >
                <Stack
                    sx={{
                        flex: 1,
                    }}
                >
                    <Typography variant="h5" component="div" sx={{fontWeight: 'bold'}}>
                        {
                            selectedPT ? 
                                `${selectedPT.firstname} ${selectedPT.lastname}`
                            :
                                'Peer Teacher'
                        }
                    </Typography>
                    <Divider flexItem sx={{ backgroundColor: '#211306', height: '4px', margin: '5px' }} />
                    <Box
                        sx={{
                            height: 600,
                            overflow: 'auto'
                        }}
                    >
                        <Stack
                            divider={<Divider flexItem sx={{ backgroundColor: '#510000', height: '5px' }} />}
                        >
                            {
                                Object.values(peerTeachers).map((peerTeacher, i) => {
                                    return <PTCard key={i} peerTeacher={peerTeacher} setSelectedPT={setSelectedPT} available={isPossibleLab(selectedLab, peerTeacher)} />
                                })
                            }
                        </Stack>
                    </Box>
                    {/* <PTCard 
                        peerTeacher={peerTeacher}
                    /> */}
                </Stack>
                <Stack
                    sx={{
                        flex: 1,
                    }}
                >
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        Possible Labs
                    </Typography>
                    <Divider flexItem sx={{ backgroundColor: '#211306', height: '4px', margin: '5px' }} />
                    <Box
                        sx={{
                            height: 600,
                            overflow: 'auto'
                        }}
                    >
                        <Stack
                            divider={<Divider flexItem sx={{ backgroundColor: '#510000', height: '5px' }} />}
                        >
                            {
                                Object.values(getPossibleLabs()).map((lab, i) => {
                                    return <LabCard key={i} lab={lab} addLab={addLabToPT} />
                                })
                            }
                        </Stack>
                    </Box>
                    {/* <PTCard 
                        peerTeacher={peerTeacher}
                    /> */}
                </Stack>
                <Stack
                    sx={{
                        flex: 1,
                    }}
                >
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        Assigned Labs
                    </Typography>
                    <Divider flexItem sx={{ backgroundColor: '#211306', height: '4px', margin: '5px' }} />
                    <Box
                        sx={{
                            height: 600,
                            overflow: 'auto'
                        }}
                    >
                        <Stack
                            divider={<Divider flexItem sx={{ backgroundColor: '#510000', height: '5px' }} />}
                        >
                            {
                                Object.values(getAssignedLabs()).map((lab, i) => {
                                    return <LabCard key={i} lab={lab} peerTeacher={selectedPT} removeLab={removeLabFromPT} />
                                })
                            }
                        </Stack>
                    </Box>
                </Stack>
            </Stack>
        </Box>
        <Box
            sx={{
                padding: '10px 50px 10px 50px',
                width: '900px',
                // overflow: 'auto',
                alignItems: 'center',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
            }}
        >
            <Typography variant='h5' component="div" sx={{ fontWeight: 'bold', alignContent: 'center', textAlign: 'center' }}>
                Unassigned Labs
            </Typography>
                {
                    getUnassignedLabs().length === 0 ?
                        <Typography variant='h6' component="div" sx={{ fontWeight: 'bold', color: '#FFFFF0' }}>
                            None
                        </Typography>
                    :
                        <Box
                            sx={{
                                flexDirection: 'row', // Ensures items are aligned in a single row
                                display: 'flex', // Makes the Box a flex container
                                overflow: 'auto', // Enables horizontal scrolling if the items overflow
                                width: '100%', // Set the width to ensure it takes up the full container width
                                gap: 2, // Optional: Adds spacing between the items
                                flexShrink: 0,
                                flexWrap: 'wrap',
                                // alignContent: 'center',
                                justifyContent: 'center',
                                margin: 0,
                                padding: 0,
                                marginTop: '20px',
                            }}
                        >
                            {
                                Object.values(getUnassignedLabs()).map((lab, i) => {
                                    return <UnassignedLabCard key={i} lab={lab} selectedLab={selectedLab} setSelectedLab={setSelectedLab} />
                                })
                            }
                        </Box>
                }
        </Box>
        </>
    )
}

export default AssignTab;