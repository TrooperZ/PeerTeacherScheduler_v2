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

import theme from '../theme'



const Scheduler = () => {
    const [value, setValue] = useState('1');
    const [peerTeachers, setPeerTeachers] = useState([]);
    const [labs, setLabs] = useState([]);

    useEffect(() => {
        // setPeerTeachers(
        //     [
        //         { uin: 1, firstname: "Test", lastname: "LOL", hours: 500, notes: '' },
        //         { uin: 0, firstname: "ABCD", hours: 500, notes: '' },
        //         { uin: -12, firstname: 'test', lastname: 'lol', hours: 100, notes: '' },
        //         { uin: -10, firstname: 'azba', hours: 100, notes: '' },
        //         { uin: 3, firstname: 'bbbb', hours: 100, notes: '' },
        //         { uin: 111111111, firstname: 'SUPER LONG NAME OMG WHY IS THIS NAME SO LONG', lastname: 'BRUH', hours: 1000000, notes: 'SUPER DUPER EXTREMELY LONG NOTES HOW IS IT SO LONG OH MAN IT CAN"T FIT ON THE PAGE!!!!!!!!!!!!!11' }
        //     ]
        // )
        // setLabs(
        //     [
        //         { id: 1, lab: 'test', },
        //         { id: 2, lab: 'test2', },
        //         { id: 3, lab: 'adsfasdf', },
        //     ]
        // )
    }, []);

    // setLabs()

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
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} // Left-aligned vertically
                        >
                            <Tab label="Upload" value="1" />
                            <Tab label="Peer Teachers" value="2" />
                            <Tab label="Labs" value="3" />
                            <Tab label="Assign Labs" value="4" />
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
                        <TabPanel value="4">Item Four</TabPanel>
                    </TabContext>
                </Box>
            </Box>
        </ThemeProvider>
    </div>
    );
}

export default Scheduler;