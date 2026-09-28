import { useEffect, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

const LabEditor = ({ labs, setLabs, displayLabs = labs, onUpdate, onRemove }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [removal, setRemoval] = useState(null);
    const [removeDelay, setRemoveDelay] = useState(0);
    const selectedLab = labs[selectedIndex] || labs[0];

    useEffect(() => {
        if (!removal || !removeDelay) return undefined;
        const timer = window.setTimeout(() => setRemoveDelay((current) => current - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [removal, removeDelay]);

    const updateLab = (field, value) => {
        const updatedLab = { ...selectedLab, [field]: ['hours', 'maxPTs'].includes(field) ? Number(value) : value };
        if (onUpdate) onUpdate(selectedLab, updatedLab);
        else setLabs((current) => current.map((lab) => lab === selectedLab ? updatedLab : lab));
    };

    const createLab = () => {
        setLabs((current) => [...current, { course: '', section: '', professor: '', time: '', location: '', hours: 1, pt: [], maxPTs: 1, _setupLabId: crypto.randomUUID() }]);
        setSelectedIndex(labs.length);
    };

    const removeLab = () => {
        if (onRemove) onRemove(removal.lab, removal.index);
        else setLabs((current) => current.filter((_, index) => index !== removal.index));
        setSelectedIndex(Math.max(0, Math.min(removal.index, labs.length - 2)));
        setRemoval(null);
    };

    return <>
        <button className="lab-config-create" type="button" onClick={createLab}><AddRoundedIcon /> Create lab manually</button>
        <div className="lab-config-layout">
            <aside className="lab-config-list" aria-label="Labs">
                {labs.map((lab, index) => <button type="button" className={selectedIndex === index ? 'is-selected' : ''} style={{ '--lab-color': displayLabs[index]?.color }} onClick={() => setSelectedIndex(index)} key={lab._setupLabId || `${lab.course}-${lab.section}`}><strong>{lab.course && lab.section ? `CSCE ${lab.course}-${lab.section}` : 'New lab'}</strong><span>{lab.time || 'Add lab details'}</span></button>)}
            </aside>
            {selectedLab && <div className="lab-config-detail">
                <div className="lab-config-detail__title"><span>Selected lab</span><h2>{selectedLab.course && selectedLab.section ? `CSCE ${selectedLab.course}-${selectedLab.section}` : 'New lab'}</h2></div>
                <div className="lab-config-fields">
                    <label>Course<input value={selectedLab.course} onChange={(event) => updateLab('course', event.target.value)} /></label>
                    <label>Section<input value={selectedLab.section} onChange={(event) => updateLab('section', event.target.value)} /></label>
                    <label className="is-wide">Professor<input value={selectedLab.professor || ''} onChange={(event) => updateLab('professor', event.target.value)} /></label>
                    <label className="is-wide">Time<input value={selectedLab.time || ''} onChange={(event) => updateLab('time', event.target.value)} /></label>
                    <label>Room<input value={selectedLab.location || ''} onChange={(event) => updateLab('location', event.target.value)} /></label>
                    <label>Hours<input min="0" step="0.5" type="number" value={selectedLab.hours} onChange={(event) => updateLab('hours', event.target.value)} /></label>
                    <label>Max PTs<input min="1" type="number" value={selectedLab.maxPTs} onChange={(event) => updateLab('maxPTs', event.target.value)} /></label>
                </div>
                <button className="lab-config-remove" type="button" onClick={() => { setRemoval({ lab: selectedLab, index: selectedIndex }); setRemoveDelay(3); }}><DeleteOutlineRoundedIcon /> Remove lab</button>
            </div>}
        </div>

        {removal && <div className="lab-remove-modal" role="presentation" onKeyDown={(event) => { if (event.key === 'Escape') setRemoval(null); }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRemoval(null); }}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="lab-remove-title">
                <span>Remove lab</span>
                <h2 id="lab-remove-title">Are you sure?</h2>
                <p>This lab will not be included in the database.</p>
                <dl>
                    <div><dt>Class</dt><dd>CSCE {removal.lab.course || 'Not set'}</dd></div>
                    <div><dt>Section</dt><dd>{removal.lab.section || 'Not set'}</dd></div>
                    <div><dt>Time</dt><dd>{removal.lab.time || 'Not set'}</dd></div>
                    <div><dt>Professor</dt><dd>{removal.lab.professor || 'Not set'}</dd></div>
                </dl>
                <footer>
                    <button type="button" autoFocus onClick={() => setRemoval(null)}>Cancel</button>
                    <button type="button" className="is-danger" disabled={removeDelay > 0} onClick={removeLab}>{removeDelay ? `Confirm (${removeDelay})` : 'Confirm'}</button>
                </footer>
            </section>
        </div>}
    </>;
};

export default LabEditor;
