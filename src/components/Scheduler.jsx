import React, {useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { ThemeProvider } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import PeerTeachersTab from './tabs/PeerTeachersTab';
import LabsTab from './tabs/LabsTab';
import UploadTab from './tabs/UploadTab';
import AssignTab from './tabs/AssignTab';

import theme from '../theme'



const Scheduler = () => {
    const [value, setValue] = useState('1');
    const [peerTeachers, setPeerTeachers] = useState([]);
    const [labs, setLabs] = useState([]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div style={{ color: "black", width: '90vw', height: '100vh', display: 'flex'}}>
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', width: '100%', flex: 1 }}>
                {/* Tab List Section - Left side of screen */}
                <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', flexShrink: 0 }}>
                    <TabContext value={value}>
                        <TabList
                            onChange={handleChange}
                            aria-label="lab API tabs example"
                            orientation="vertical"
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                            }} // Left-aligned vertically
                        >
                            <Tab 
                                label="Upload" 
                                value="1" 
                                sx={{
                                    outline: 'none',
                                    '&:focus': {
                                        outline: 'none', // Remove focus outline
                                    },
                                }} 
                            />
                            <Tab 
                                label="Peer Teachers" 
                                value="2"
                                sx={{
                                    outline: 'none',
                                    '&:focus': {
                                        outline: 'none', // Remove focus outline
                                    },
                                }} 
                            />
                            <Tab 
                                label="Labs" 
                                value="3" 
                                sx={{
                                    outline: 'none',
                                    '&:focus': {
                                        outline: 'none', // Remove focus outline
                                    },
                                }} 
                            />
                            <Tab 
                                label="Assign Labs" 
                                value="4" 
                                sx={{
                                    outline: 'none',
                                    '&:focus': {
                                        outline: 'none', // Remove focus outline
                                    },
                                }} 
                            />
                        </TabList>
                    </TabContext>
                </Box>

                {/* Tab Panels Section - Right of the tabs */}
                <Box sx={{ flexGrow: 1, padding: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <TabContext value={value}>
                        <TabPanel value="1">
                            <UploadTab 
                                peerTeachers={peerTeachers}
                                setPeerTeachers={setPeerTeachers}
                                labs={labs}
                                setLabs={setLabs}
                            />
                        </TabPanel>
                        <TabPanel value="2">
                            <PeerTeachersTab 
                                peerTeachers={peerTeachers}
                                setPeerTeachers={setPeerTeachers}
                                labs={labs}
                                setLabs={setLabs}
                            />
                        </TabPanel>
                        <TabPanel value="3">
                            <LabsTab 
                                peerTeachers={peerTeachers}
                                setPeerTeachers={setPeerTeachers}
                                labs={labs}
                                setLabs={setLabs}
                            />
                        </TabPanel>
                        <TabPanel value="4">
                            <AssignTab
                                peerTeachers={peerTeachers}
                                setPeerTeachers={setPeerTeachers}
                                labs={labs}
                                setLabs={setLabs}
                            />
                        </TabPanel>
                    </TabContext>
                </Box>
            </Box>
        </ThemeProvider>
    </div>
    );
}

export default Scheduler;