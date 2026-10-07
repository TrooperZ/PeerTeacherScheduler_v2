import { useMemo, useState } from 'react';
import { Popover } from '@mui/material';
import { DAY_NAMES, formatTime, getPTLabState, isPTEligibleForCourse, layoutOverlappingEvents, parseLabTime, parseRange, splitBusyRanges } from '../../utils/schedule';

const DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
const START = 7 * 60;
const END = 18 * 60;
const GAP = 20;
const labKey = (lab) => `${lab.course}-${lab.section}`;

const eventStyle = (parsed) => ({
    '--event-top': `${GAP + Math.max(0, parsed.start - START)}px`,
    '--event-height': `${Math.max(42, Math.min(parsed.end, END) - Math.max(parsed.start, START))}px`,
});

const ScheduleByPT = ({ peerTeachers, labs, onAssign, onRemove }) => {
    const [selectedUin, setSelectedUin] = useState(peerTeachers[0]?.uin || '');
    const [course, setCourse] = useState('');
    const [query, setQuery] = useState('');
    const [eventInfo, setEventInfo] = useState(null);
    const selectedPT = peerTeachers.find((pt) => pt.uin === selectedUin) || peerTeachers[0];
    const courses = useMemo(() => [...new Set(labs.map((lab) => lab.course))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })), [labs]);
    const selectedCourse = courses.includes(course) ? course : courses[0];
    const courseLabs = labs.filter((lab) => lab.course === selectedCourse);
    const calendarLabs = [...courseLabs, ...labs.filter((lab) => lab.pt?.includes(selectedPT?.uin) && lab.course !== selectedCourse)];
    const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, index) => START + index * 60);
    const filteredPTs = peerTeachers.filter((pt) => `${pt.firstname} ${pt.lastname} ${pt.uin}`.toLowerCase().includes(query.toLowerCase()));
    const labsByDay = new Map(DAYS.map((day) => [day, layoutOverlappingEvents(
        calendarLabs.flatMap((lab) => {
            const parsed = parseLabTime(lab.time);
            return parsed?.days.includes(day) ? [{ parsed, lab, key: `${labKey(lab)}-${day}` }] : [];
        })
    )]));

    if (!selectedPT) return <div className="assign-v2__empty"><strong>No peer teachers</strong><span>Add peer teachers before scheduling.</span></div>;

    return (
        <section className="schedule-pt">
            <header className="view-header schedule-pt__header">
                <div><h1>Schedule by PT</h1><p>Select a peer teacher, then choose a course group to place sections on their calendar.</p></div>
                <div className="schedule-pt__selected"><span>Selected</span><strong>{selectedPT.firstname} {selectedPT.lastname}</strong><small>{selectedPT.hours || 0} assigned hours</small></div>
            </header>
            <div className="schedule-pt__workspace">
                <aside className="schedule-pt__people">
                    <label><span>Peer teachers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or UIN" /></label>
                    <div>{filteredPTs.map((pt) => <button type="button" className={pt.uin === selectedPT.uin ? 'is-active' : ''} onClick={() => setSelectedUin(pt.uin)} key={pt.uin}><strong>{pt.firstname} {pt.lastname}</strong><small>{pt.hours || 0} hours · {pt.labs?.length || 0} sections</small></button>)}</div>
                </aside>
                <main className="schedule-pt__calendar">
                    {!isPTEligibleForCourse(selectedPT, selectedCourse) && <div className="schedule-pt__eligibility" role="alert">Not Eligible to be Scheduled</div>}
                    <div className="schedule-pt__calendar-heading"><div><h2>{selectedPT.firstname}&rsquo;s calendar</h2><p>Click an available section to assign it. Click a full-color section to remove it.</p></div><div className="schedule-pt__legend"><span className="is-available">Available</span><span className="is-conflict">Conflict</span><span className="is-assigned">Assigned</span></div></div>
                    <div className="pt-calendar-scroll">
                        <div className="pt-calendar" style={{ '--calendar-height': `${END - START + GAP}px`, '--calendar-top-gap': `${GAP}px`, '--calendar-days': DAYS.length }}>
                            <div className="pt-calendar__corner" />
                            {DAYS.map((day) => <div className="pt-calendar__day" key={day}>{DAY_NAMES[day].slice(0, 3)}</div>)}
                            <div className="pt-calendar__times">{hours.map((minute) => <span key={minute} style={{ top: GAP + minute - START }}>{formatTime(`${Math.floor(minute / 60)}:00`)}</span>)}</div>
                            {DAYS.map((day) => <div className="pt-calendar__column" key={day}>
                                {splitBusyRanges(selectedPT.busyTimes?.[day]).map((range, index) => {
                                    const parsed = parseRange(range);
                                    return parsed && parsed.end > START && parsed.start < END ? <div className="calendar-event calendar-event--busy schedule-pt__busy" style={eventStyle(parsed)} key={`${range}-${index}`}><strong>Busy</strong><span>{parsed.label}</span></div> : null;
                                })}
                                {labsByDay.get(day).map(({ parsed, lab, key, lane, laneCount }) => {
                                    if (parsed.end <= START || parsed.start >= END) return null;
                                    const laneStyle = { ...eventStyle(parsed), '--event-lane': lane, '--event-lane-count': laneCount };
                                    const status = getPTLabState(lab, selectedPT, labs);
                                    const locked = status.state === 'assigned' && lab.lockedPTs?.includes(selectedPT.uin);
                                    const eligibilityWarning = status.reason === 'Not eligible for this course';
                                    const clickable = status.state === 'available' || status.state === 'assigned-other' || eligibilityWarning || (status.state === 'assigned' && !locked);
                                    return <button type="button" disabled={!clickable} className={`calendar-event schedule-pt__event schedule-pt__lab is-${status.state}${locked ? ' is-locked' : ''}`} style={{ ...laneStyle, '--event-color': lab.color }} onClick={(event) => {
                                        if (status.state === 'assigned') onRemove(lab, selectedPT);
                                        else if (status.state === 'assigned-other') setEventInfo({ anchorEl: event.currentTarget, day, lab, parsed });
                                        else onAssign(lab, selectedPT);
                                    }} key={key}><strong>CSCE {lab.course} - {lab.section}</strong><span>{parsed.label}</span>{locked && <b>Locked</b>}{status.state === 'assigned-other' && <b>Assigned To Other</b>}{status.state === 'conflict' && <b>{status.reason === 'Busy at this time' ? 'Busy' : status.reason}</b>}</button>;
                                })}
                            </div>)}
                        </div>
                    </div>
                </main>
                <aside className="schedule-pt__courses"><span>Class groups</span>{courses.map((value) => <button type="button" className={value === selectedCourse ? 'is-active' : ''} onClick={() => setCourse(value)} key={value}><i style={{ background: labs.find((lab) => lab.course === value)?.color }} />CSCE {value}<small>{labs.filter((lab) => lab.course === value && ['available', 'assigned'].includes(getPTLabState(lab, selectedPT, labs).state)).length}</small></button>)}</aside>
            </div>
            <Popover open={Boolean(eventInfo)} anchorEl={eventInfo?.anchorEl} onClose={() => setEventInfo(null)} anchorOrigin={{ vertical: 'center', horizontal: 'right' }} transformOrigin={{ vertical: 'center', horizontal: 'left' }} slotProps={{ paper: { className: 'calendar-event-popover' } }}>
                {eventInfo && <div className="calendar-event-info">
                    <span className="calendar-event-info__eyebrow">Assigned to another PT</span>
                    <h3>CSCE {eventInfo.lab.course} - {eventInfo.lab.section}</h3>
                    <dl>
                        <div><dt>Professor</dt><dd>{eventInfo.lab.professor || 'Not listed'}</dd></div>
                        <div><dt>Day</dt><dd>{DAY_NAMES[eventInfo.day]}</dd></div>
                        <div><dt>Time</dt><dd>{eventInfo.parsed.label}</dd></div>
                        <div><dt>Room</dt><dd>{eventInfo.lab.location || 'Not listed'}</dd></div>
                        <div><dt>Assigned PT</dt><dd>{(eventInfo.lab.pt || []).map((uin) => peerTeachers.find((pt) => pt.uin === uin)).filter(Boolean).map((pt) => `${pt.firstname} ${pt.lastname}`).join(', ') || 'Unknown'}</dd></div>
                        <div><dt>Weekly hours</dt><dd>{eventInfo.lab.hours ?? 'Not listed'}</dd></div>
                    </dl>
                </div>}
            </Popover>
        </section>
    );
};

export default ScheduleByPT;
