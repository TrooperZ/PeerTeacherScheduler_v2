import { useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LabsCalendar from './LabsCalendar';
import { getLabCompatibility, parseLabTime } from '../../utils/schedule';

const labKey = (lab) => `${lab.course}-${lab.section}`;
const labLabel = (lab) => `CSCE ${lab.course} - ${lab.section}`;

const AssignLabsV2 = ({ title = 'Schedule by lab', view = 'schedule', peerTeachers, labs, selectedLab, setSelectedLab, onAssign, onRemove, onToggleLock, onToggleSectionLock }) => {
    const courses = useMemo(() => [...new Set(labs.map(({ course }) => course))].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true })
    ), [labs]);
    const [hiddenCourses, setHiddenCourses] = useState([]);
    const [staffing, setStaffing] = useState('all');
    const [query, setQuery] = useState('');
    const [ptQuery, setPtQuery] = useState('');

    const currentLab = selectedLab && labs.find((lab) => labKey(lab) === labKey(selectedLab));
    const totalSlots = labs.reduce((total, lab) => total + Number(lab.maxPTs || 0), 0);
    const filledSlots = labs.reduce((total, lab) => total + (lab.pt?.length || 0), 0);
    const openSlots = labs.reduce((total, lab) => total + (lab.assignmentLocked ? 0 : Math.max(0, Number(lab.maxPTs || 0) - (lab.pt?.length || 0))), 0);

    const visibleLabs = labs.filter((lab) => {
        const open = !lab.assignmentLocked && (lab.pt?.length || 0) < Number(lab.maxPTs || 0);
        const searchable = [lab.course, lab.section, lab.professor, lab.location, ...(lab.pt || []).map((uin) => {
            const pt = peerTeachers.find((item) => item.uin === uin);
            return pt ? `${pt.firstname} ${pt.lastname}` : uin;
        })].join(' ').toLowerCase();
        return !hiddenCourses.includes(lab.course)
            && (staffing === 'all' || (staffing === 'open' ? open : !open))
            && searchable.includes(query.trim().toLowerCase());
    });

    const toggleCourse = (course) => {
        const hiding = !hiddenCourses.includes(course);
        setHiddenCourses((current) => hiding ? [...current, course] : current.filter((value) => value !== course));
        if (hiding && currentLab?.course === course) setSelectedLab(null);
    };

    const assignedPTs = currentLab ? peerTeachers.filter((pt) => currentLab.pt?.includes(pt.uin)) : [];
    const candidates = currentLab ? peerTeachers
        .filter((pt) => !currentLab.pt?.includes(pt.uin))
        .map((pt) => ({ pt, ...getLabCompatibility(currentLab, pt, labs) }))
        .filter(({ pt }) => `${pt.firstname} ${pt.lastname} ${pt.uin}`.toLowerCase().includes(ptQuery.trim().toLowerCase()))
        .sort((a, b) => Number(b.compatible) - Number(a.compatible) || a.pt.lastname.localeCompare(b.pt.lastname)) : [];

    return (
        <section className="assign-v2">
            <header className="view-header assign-v2__header">
                <div>
                    <Typography component="h1" className="view-title">{title}</Typography>
                    <Typography className="view-subtitle">
                        {labs.length} sections · {filledSlots}/{totalSlots} staffed · {openSlots} open
                    </Typography>
                </div>
            </header>

            <div className="assign-v2__toolbar">
                <label className="assign-v2__search">
                    <span className="sr-only">Search labs</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search labs, rooms, professors, or PTs" />
                </label>
                <div className="assign-v2__filter-field">
                    <span>Courses</span>
                    <details className="assign-v2__course-filter">
                        <summary>{courses.length - hiddenCourses.length} of {courses.length} shown</summary>
                        <div className="assign-v2__course-menu">
                            <div className="assign-v2__course-actions">
                                <button type="button" onClick={() => setHiddenCourses([])}>Show all</button>
                                <button type="button" onClick={() => { setHiddenCourses(courses); setSelectedLab(null); }}>Hide all</button>
                            </div>
                            {courses.map((value) => (
                                <label key={value}>
                                    <input type="checkbox" checked={!hiddenCourses.includes(value)} onChange={() => toggleCourse(value)} />
                                    <i style={{ '--course-color': labs.find((lab) => lab.course === value)?.color }} />
                                    CSCE {value}
                                </label>
                            ))}
                        </div>
                    </details>
                </div>
                <label>Assigned
                    <select value={staffing} onChange={(event) => setStaffing(event.target.value)}>
                        <option value="all">Any status</option>
                        <option value="open">Open slots</option>
                        <option value="full">Fully staffed</option>
                    </select>
                </label>
            </div>

            <div className="assign-v2__workspace">
                <main className="assign-v2__browser">
                    {visibleLabs.length ? view === 'schedule' ? (
                        <LabsCalendar labs={visibleLabs} peerTeachers={peerTeachers} selectedLab={currentLab} onSelectLab={setSelectedLab} compact />
                    ) : (
                        <div className="assign-v2__list">
                            {visibleLabs.map((lab) => {
                                const open = Math.max(0, Number(lab.maxPTs || 0) - (lab.pt?.length || 0));
                                return (
                                    <button type="button" className={currentLab && labKey(currentLab) === labKey(lab) ? 'is-selected' : ''} onClick={() => setSelectedLab(lab)} key={labKey(lab)}>
                                        <span><strong>{labLabel(lab)}</strong><small>{lab.time} · {lab.location || 'Room not listed'}</small></span>
                                        <b className={open && !lab.assignmentLocked ? 'is-open' : ''}>{lab.assignmentLocked ? 'Locked' : open ? `${open} open` : 'Staffed'}</b>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="assign-v2__empty">No labs match these filters.</div>
                    )}
                </main>

                <aside className="assign-v2__inspector" aria-live="polite">
                    {currentLab ? (
                        <>
                            <div className={`assign-v2__lab-heading${currentLab.assignmentLocked ? ' is-locked' : ''}`}>
                                <div><span>Lab details</span><button type="button" onClick={() => onToggleSectionLock(currentLab)}><BlockRoundedIcon />{currentLab.assignmentLocked ? 'Assignments blocked' : 'Block assignments'}</button></div>
                                <h2>{labLabel(currentLab)}</h2>
                                <p>{parseLabTime(currentLab.time)?.label || currentLab.time}</p>
                            </div>
                            <dl className="assign-v2__facts">
                                <div><dt>Professor</dt><dd>{currentLab.professor || 'Not listed'}</dd></div>
                                <div><dt>Room</dt><dd>{currentLab.location || 'Not listed'}</dd></div>
                                <div><dt>Hours</dt><dd>{currentLab.hours ?? '—'}</dd></div>
                                <div><dt>Assigned</dt><dd>{currentLab.pt?.length || 0} / {currentLab.maxPTs}</dd></div>
                            </dl>

                            <section className="assign-v2__people assign-v2__assigned">
                                <h3>Assigned</h3>
                                {assignedPTs.length ? assignedPTs.map((pt) => (
                                    <div className={`assign-v2__person${currentLab.lockedPTs?.includes(pt.uin) ? ' is-locked' : ''}`} key={pt.uin}>
                                        <span><strong>{pt.firstname} {pt.lastname}</strong><small>{pt.hours} assigned hours{currentLab.lockedPTs?.includes(pt.uin) ? ' · Locked' : ''}</small></span>
                                        <div className="assign-v2__person-actions">
                                            <button type="button" className="assign-v2__lock" aria-label={`${currentLab.lockedPTs?.includes(pt.uin) ? 'Unlock' : 'Lock'} ${pt.firstname} ${pt.lastname}`} onClick={() => onToggleLock(currentLab, pt)}>{currentLab.lockedPTs?.includes(pt.uin) ? <LockRoundedIcon /> : <LockOpenRoundedIcon />}{currentLab.lockedPTs?.includes(pt.uin) ? 'PT locked' : 'Lock PT'}</button>
                                            <button type="button" disabled={currentLab.lockedPTs?.includes(pt.uin)} className="assign-v2__remove" onClick={() => onRemove(currentLab, pt)}>Remove</button>
                                        </div>
                                    </div>
                                )) : <p className="assign-v2__muted">No PT assigned.</p>}
                            </section>

                            <section className="assign-v2__people assign-v2__candidates">
                                <div className="assign-v2__people-heading">
                                    <h3>Peer teachers</h3>
                                    <input aria-label="Search peer teachers" value={ptQuery} onChange={(event) => setPtQuery(event.target.value)} placeholder="Search" />
                                </div>
                                {candidates.map(({ pt, compatible, reason }) => (
                                    <div className="assign-v2__person" key={pt.uin}>
                                        <span><strong>{pt.firstname} {pt.lastname}</strong><small>{pt.hours} hours · {reason}</small></span>
                                        <button type="button" disabled={!compatible} onClick={() => onAssign(currentLab, pt)}>Assign</button>
                                    </div>
                                ))}
                                {!candidates.length && <p className="assign-v2__muted">No peer teachers match.</p>}
                            </section>
                        </>
                    ) : (
                        <div className="assign-v2__empty assign-v2__empty--inspector">
                            <strong>Select a lab</strong>
                            <span>Choose a section to review assignments and availability.</span>
                        </div>
                    )}
                </aside>
            </div>
        </section>
    );
};

export default AssignLabsV2;
