import { useState } from 'react';
import AssignLabsV2 from './AssignLabsV2';
import ScheduleByPT from './ScheduleByPT';

const labKey = (lab) => `${lab.course}-${lab.section}`;

const SchedulingTab = ({ peerTeachers, setPeerTeachers, labs, setLabs, selectedLab, setSelectedLab, onToggleLock, onToggleSectionLock }) => {
    const [mode, setMode] = useState('lab-calendar');
    const assign = (lab, pt) => {
        setLabs((current) => current.map((item) => labKey(item) === labKey(lab) && !item.pt?.includes(pt.uin) ? { ...item, pt: [...(item.pt || []), pt.uin] } : item));
        setPeerTeachers((current) => current.map((item) => item.uin === pt.uin && !item.labs?.some((assigned) => labKey(assigned) === labKey(lab)) ? { ...item, hours: Number(item.hours || 0) + Number(lab.hours || 0), labs: [...(item.labs || []), { course: lab.course, section: lab.section }] } : item));
    };
    const remove = (lab, pt) => {
        if (lab.lockedPTs?.includes(pt.uin)) return;
        setLabs((current) => current.map((item) => labKey(item) === labKey(lab) ? { ...item, pt: (item.pt || []).filter((uin) => uin !== pt.uin), lockedPTs: (item.lockedPTs || []).filter((uin) => uin !== pt.uin) } : item));
        setPeerTeachers((current) => current.map((item) => item.uin === pt.uin && item.labs?.some((assigned) => labKey(assigned) === labKey(lab)) ? { ...item, hours: Math.max(0, Number(item.hours || 0) - Number(lab.hours || 0)), labs: item.labs.filter((assigned) => labKey(assigned) !== labKey(lab)) } : item));
    };
    return <section className="scheduling-tab">
        <div className="scheduling-tab__switch view-switch" role="tablist" aria-label="Scheduling method">
            <button type="button" role="tab" aria-selected={mode === 'lab-calendar'} className={mode === 'lab-calendar' ? 'is-active' : ''} onClick={() => setMode('lab-calendar')}>Lab calendar</button>
            <button type="button" role="tab" aria-selected={mode === 'lab-list'} className={mode === 'lab-list' ? 'is-active' : ''} onClick={() => setMode('lab-list')}>Lab list</button>
            <button type="button" role="tab" aria-selected={mode === 'pt'} className={mode === 'pt' ? 'is-active' : ''} onClick={() => setMode('pt')}>By PT</button>
        </div>
        {mode.startsWith('lab-') ? <AssignLabsV2 view={mode === 'lab-list' ? 'list' : 'schedule'} peerTeachers={peerTeachers} labs={labs} selectedLab={selectedLab} setSelectedLab={setSelectedLab} onAssign={assign} onRemove={remove} onToggleLock={onToggleLock} onToggleSectionLock={onToggleSectionLock} /> : <ScheduleByPT peerTeachers={peerTeachers} labs={labs} onAssign={assign} onRemove={remove} />}
    </section>;
};

export default SchedulingTab;
