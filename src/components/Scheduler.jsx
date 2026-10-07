import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import DatabaseRoundedIcon from '@mui/icons-material/StorageRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import theme from '../theme';
import { addCourseColors } from '../utils/schedule';
import { createDatabaseChanges, databaseSnapshot, loadDatabaseHistory } from '../utils/databaseHistory';
import SchedulingTab from './tabs/SchedulingTab';
import AutoschedulerTab from './tabs/AutoschedulerTab';
import CreateDatabaseWizard from './CreateDatabaseWizard';
import LabsTab from './tabs/LabsTab';
import DiffTab from './tabs/DiffTab';
import PeerTeachersTab from './tabs/PeerTeachersTab';
import UploadTab from './tabs/UploadTab';
import WelcomeScreen from './WelcomeScreen';

const Scheduler = () => {
    const [mode, setMode] = useState('welcome');
    const [view, setView] = useState('people');
    const [labs, setLabs] = useState([]);
    const [peerTeachers, setPeerTeachers] = useState([]);
    const [settings, setSettings] = useState({ labConfiguration: { separateHonors: true, separateProfessors: false } });
    const [history, setHistory] = useState({ base: databaseSnapshot([], [], {}), entries: [] });
    const previousDatabase = useRef(null);
    const historySource = useRef('manual');
    const [selectedPT, setSelectedPT] = useState(null);
    const [selectedLab, setSelectedLab] = useState(null);

    const totalSlots = labs.reduce((total, lab) => total + Number(lab.maxPTs || 0), 0);
    const filledSlots = labs.reduce((total, lab) => total + (lab.pt?.length || 0), 0);
    const openSlots = labs.reduce((total, lab) => total + (lab.assignmentLocked ? 0 : Math.max(0, Number(lab.maxPTs || 0) - (lab.pt?.length || 0))), 0);
    const lockedSlots = labs.reduce((total, lab) => total + (lab.assignmentLocked ? Math.max(0, Number(lab.maxPTs || 0) - (lab.pt?.length || 0)) : 0), 0);

    useEffect(() => {
        if (mode !== 'workspace') return;
        const current = databaseSnapshot(labs, peerTeachers, settings);
        const source = historySource.current;
        historySource.current = 'manual';
        if (previousDatabase.current) {
            const changes = createDatabaseChanges(previousDatabase.current, current);
            if (changes.length) setHistory((value) => ({
                ...value,
                entries: [...value.entries, { source, timestamp: new Date().toISOString(), changes }],
            }));
        }
        previousDatabase.current = current;
    }, [labs, mode, peerTeachers, settings]);

    const toggleAssignmentLock = (lab, peerTeacher) => setLabs((current) => current.map((item) => {
        if (item.course !== lab.course || item.section !== lab.section || !item.pt?.includes(peerTeacher.uin)) return item;
        const locked = item.lockedPTs || [];
        return { ...item, lockedPTs: locked.includes(peerTeacher.uin) ? locked.filter((uin) => uin !== peerTeacher.uin) : [...locked, peerTeacher.uin] };
    }));

    const toggleSectionLock = (lab) => setLabs((current) => current.map((item) =>
        item.course === lab.course && item.section === lab.section ? { ...item, assignmentLocked: !item.assignmentLocked } : item
    ));

    const exportDatabase = () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify({ labs, peerTeachers, settings, history })], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'database.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const views = [
        ['scheduling', 'Scheduling', AssignmentTurnedInRoundedIcon],
        ['autoscheduler', 'Autoscheduler', AutoAwesomeRoundedIcon],
        ['people', 'Peer teachers', Groups2RoundedIcon],
        ['labs', 'Labs', CalendarMonthRoundedIcon],
        ['diff', 'Diff', HistoryRoundedIcon],
        ['data', 'Data', DatabaseRoundedIcon],
    ];

    const loadDatabase = ({ labs: uploadedLabs, peerTeachers: uploadedPeerTeachers, settings: uploadedSettings, history: uploadedHistory }) => {
        const nextLabs = addCourseColors(uploadedLabs, uploadedSettings?.labConfiguration);
        const nextSettings = uploadedSettings || { labConfiguration: { separateHonors: true, separateProfessors: false } };
        const snapshot = databaseSnapshot(nextLabs, uploadedPeerTeachers, nextSettings);
        previousDatabase.current = snapshot;
        setLabs(nextLabs);
        setPeerTeachers(uploadedPeerTeachers);
        setSettings(nextSettings);
        setHistory(loadDatabaseHistory(snapshot, uploadedHistory));
        setSelectedPT(null);
        setSelectedLab(null);
        setMode('workspace');
    };

    if (mode === 'welcome') return <ThemeProvider theme={theme}><WelcomeScreen onDatabaseLoaded={loadDatabase} onStartNew={() => {
        setLabs([]);
        setPeerTeachers([]);
        previousDatabase.current = null;
        setMode('setup');
    }} /></ThemeProvider>;

    if (mode === 'setup') return <ThemeProvider theme={theme}><CreateDatabaseWizard
        peerTeachers={peerTeachers}
        setPeerTeachers={setPeerTeachers}
        labs={labs}
        setLabs={setLabs}
        onCancel={() => setMode('welcome')}
        onComplete={(database) => {
            const snapshot = databaseSnapshot(database.labs, database.peerTeachers, database.settings);
            previousDatabase.current = snapshot;
            setPeerTeachers(database.peerTeachers);
            setLabs(database.labs);
            setSettings(database.settings);
            setHistory({ base: snapshot, entries: [] });
            setView('people');
            setMode('workspace');
        }}
    /></ThemeProvider>;

    return (
        <ThemeProvider theme={theme}>
            <div className="revamp-shell">
                <header className="revamp-header">
                    <a className="revamp-brand" href="/" aria-label="TAMU PT Scheduler v2">
                        <strong>TAMU PT Scheduler v2</strong>
                    </a>

                    <nav className="revamp-nav" aria-label="Scheduler views">
                        {views.map(([id, label, Icon]) => (
                            <button className={view === id ? 'is-active' : ''} type="button" onClick={() => setView(id)} key={id}>
                                <Icon />
                                {label}
                            </button>
                        ))}
                    </nav>

                    <button className="revamp-export" type="button" onClick={exportDatabase}>
                        <DownloadRoundedIcon />
                        Export
                    </button>
                </header>

                <section className="revamp-status" aria-label="Schedule status">
                    <div><strong>{peerTeachers.length}</strong><span>peer teachers</span></div>
                    <i />
                    <div><strong>{labs.length}</strong><span>labs</span></div>
                    <i />
                    <div><strong>{filledSlots}/{totalSlots}</strong><span>slots staffed</span></div>
                    <span className={openSlots ? 'revamp-status__open' : 'revamp-status__complete'}>
                        {openSlots ? `${openSlots} open ${openSlots === 1 ? 'slot' : 'slots'}` : lockedSlots ? `${lockedSlots} locked ${lockedSlots === 1 ? 'slot' : 'slots'}` : 'Schedule complete'}
                    </span>
                    <p>Changes stay in browser and must be exported before refreshing/exiting!</p>
                </section>

                <main className="revamp-content" id="main-content">
                    {view === 'scheduling' && (
                        <SchedulingTab
                            peerTeachers={peerTeachers}
                            setPeerTeachers={setPeerTeachers}
                            labs={labs}
                            setLabs={setLabs}
                            selectedLab={selectedLab}
                            setSelectedLab={setSelectedLab}
                            onToggleLock={toggleAssignmentLock}
                            onToggleSectionLock={toggleSectionLock}
                        />
                    )}
                    {view === 'autoscheduler' && (
                        <AutoschedulerTab
                            labs={labs}
                            setLabs={setLabs}
                            peerTeachers={peerTeachers}
                            setPeerTeachers={setPeerTeachers}
                            settings={settings}
                            setSettings={setSettings}
                            onToggleLock={toggleAssignmentLock}
                            onAutoschedule={() => { historySource.current = 'autoscheduler'; }}
                        />
                    )}
                    {view === 'people' && (
                        <PeerTeachersTab
                            peerTeachers={peerTeachers}
                            setPeerTeachers={setPeerTeachers}
                            labs={labs}
                            setLabs={setLabs}
                            selectedPT={selectedPT}
                            setSelectedPT={setSelectedPT}
                        />
                    )}
                    {view === 'labs' && (
                        <LabsTab peerTeachers={peerTeachers} setPeerTeachers={setPeerTeachers} labs={labs} setLabs={setLabs} />
                    )}
                    {view === 'diff' && (
                        <DiffTab history={history} onRestore={(database) => {
                            setLabs(database.labs);
                            setPeerTeachers(database.peerTeachers);
                            setSettings(database.settings);
                            setSelectedLab(null);
                            setSelectedPT(null);
                        }} />
                    )}
                    {view === 'data' && (
                        <section className="revamp-data">
                            <header>
                                <span>Setup</span>
                                <h1>Schedule data</h1>
                                <p>Import source files, replace this database, or save a copy.</p>
                            </header>
                            <UploadTab
                                peerTeachers={peerTeachers}
                                setPeerTeachers={setPeerTeachers}
                                labs={labs}
                                setLabs={setLabs}
                                selectedPT={selectedPT}
                                setSelectedPT={setSelectedPT}
                            />
                        </section>
                    )}
                </main>
            </div>
        </ThemeProvider>
    );
};

export default Scheduler;
