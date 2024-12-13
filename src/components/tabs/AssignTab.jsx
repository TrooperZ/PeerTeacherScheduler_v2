import Box from '@mui/material/Box';

import PTCard from './assign-tab-components/PTCard';
import LabCard from './assign-tab-components/LabCard';
import { Stack, Divider, Typography } from '@mui/material';
import { useState } from 'react';

const AssignTab = ({peerTeachers, setPeerTeachers, labs, setLabs}) => {

    const [ selectedPT, setSelectedPT ] = useState(null);

    const getPossibleLabs = () => {
        if (selectedPT) {

        }

        return [];
    }

    return (
        <Box
            sx={{
                backgroundColor: '#510000',
                padding: '10px 50px 10px 50px',
                // height: 600,
                width: '60vw',
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
                        Peer Teacher
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
                                    return <PTCard key={i} peerTeacher={peerTeacher} />
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
                        Labs
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
                                Object.values(labs).map((lab, i) => {
                                    return <LabCard key={i} lab={lab} />
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
                                Object.values(labs).map((lab, i) => {
                                    return <LabCard key={i} lab={lab} peerTeacher />
                                })
                            }
                        </Stack>
                    </Box>
                </Stack>
            </Stack>
        </Box>
    )
}

export default AssignTab;