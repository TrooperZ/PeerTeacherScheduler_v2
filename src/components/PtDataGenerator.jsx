import { useEffect, useMemo, useRef, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { COURSE_CATALOG } from '../data/courseCatalog';
import { buildPtSubmission, clamp, hasDragIntent, minutesToTime, PT_DAYS, snapMinutes, timeToMinutes } from '../utils/ptDataGenerator';
import { parsePeerTeacher } from '../utils/importData';
import { parseRange, splitBusyRanges } from '../utils/schedule';

const DAY_NAMES = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', R: 'Thursday', F: 'Friday' };
const START_MINUTE = 8 * 60;
const END_MINUTE = 22 * 60;
const MINUTE_HEIGHT = 1;
const MIN_SLOT = 15;
const TOP_GAP = 20;

const formatClock = (minutes) => new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit',
}).format(new Date(2020, 0, 1, Math.floor(minutes / 60), minutes % 60));

const Toggle = ({ checked, disabled = false, label, onChange }) => (
    <label className={`pt-generator-toggle${disabled ? ' is-disabled' : ''}`}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
        <span aria-hidden="true">{checked && <CheckRoundedIcon />}</span>
        {label}
    </label>
);

const BusyCalendar = ({ slots, setSlots }) => {
    const [selectedId, setSelectedId] = useState(null);
    const interaction = useRef(null);
    const suppressClick = useRef(false);
    const detailsRef = useRef(null);
    const selected = slots.find((slot) => slot.id === selectedId);
    const hours = Array.from({ length: 15 }, (_, index) => START_MINUTE + index * 60);

    useEffect(() => {
        const move = (event) => {
            const active = interaction.current;
            if (!active) return;
            const pointerDeltaX = event.clientX - active.pointerX;
            const pointerDeltaY = event.clientY - active.pointerY;
            if (!active.started && !hasDragIntent(pointerDeltaX, pointerDeltaY)) return;
            if (!active.started) {
                active.started = true;
                active.element.classList.add('is-dragging');
            }
            const deltaY = snapMinutes(pointerDeltaY / MINUTE_HEIGHT);
            const deltaDays = Math.round(pointerDeltaX / active.columnWidth);
            const element = active.element;

            if (active.mode === 'move') {
                const duration = active.slot.end - active.slot.start;
                const start = clamp(active.slot.start + deltaY, START_MINUTE, END_MINUTE - duration);
                const dayIndex = clamp(active.dayIndex + deltaDays, 0, PT_DAYS.length - 1);
                active.preview = { ...active.slot, day: PT_DAYS[dayIndex], start, end: start + duration };
                element.style.transform = `translate(${(dayIndex - active.dayIndex) * active.columnWidth}px, ${start - active.slot.start}px)`;
            } else {
                const start = active.mode === 'resize-start'
                    ? clamp(active.slot.start + deltaY, START_MINUTE, active.slot.end - MIN_SLOT)
                    : active.slot.start;
                const end = active.mode === 'resize-end'
                    ? clamp(active.slot.end + deltaY, active.slot.start + MIN_SLOT, END_MINUTE)
                    : active.slot.end;
                active.preview = { ...active.slot, start, end };
                element.style.top = `${TOP_GAP + start - START_MINUTE}px`;
                element.style.height = `${end - start}px`;
            }
        };

        const end = () => {
            const active = interaction.current;
            if (!active) return;
            active.element.style.transform = active.originalStyle.transform;
            active.element.style.top = active.originalStyle.top;
            active.element.style.height = active.originalStyle.height;
            active.element.classList.remove('is-dragging');
            if (active.preview) setSlots((current) => current.map((slot) => slot.id === active.slot.id ? active.preview : slot));
            suppressClick.current = active.started;
            if (active.started) window.setTimeout(() => { suppressClick.current = false; }, 0);
            interaction.current = null;
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
        };
    }, [setSlots]);

    useEffect(() => {
        if (!selectedId) return undefined;
        const dismiss = (event) => {
            if (detailsRef.current?.contains(event.target) || event.target.closest('.pt-busy-slot')) return;
            setSelectedId(null);
        };
        document.addEventListener('pointerdown', dismiss, true);
        return () => document.removeEventListener('pointerdown', dismiss, true);
    }, [selectedId]);

    const startInteraction = (event, slot, mode) => {
        event.stopPropagation();
        const element = event.currentTarget.closest('.pt-busy-slot');
        const column = element.parentElement;
        interaction.current = {
            mode, slot, element, pointerX: event.clientX, pointerY: event.clientY,
            columnWidth: column.getBoundingClientRect().width,
            dayIndex: PT_DAYS.indexOf(slot.day), preview: null, started: false,
            originalStyle: { transform: element.style.transform, top: element.style.top, height: element.style.height },
        };
    };

    const createSlot = (day, start) => {
        const slot = { id: crypto.randomUUID(), day, start, end: start + 60 };
        setSlots((current) => [...current, slot]);
        setSelectedId(slot.id);
    };

    const addSlot = (event, day) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        createSlot(day, clamp(snapMinutes(event.clientY - bounds.top - TOP_GAP + START_MINUTE), START_MINUTE, END_MINUTE - 60));
    };

    const updateSelected = (patch) => setSlots((current) => current.map((slot) => slot.id === selectedId ? { ...slot, ...patch } : slot));
    const removeSelected = () => {
        setSlots((current) => current.filter((slot) => slot.id !== selectedId));
        setSelectedId(null);
    };

    return (
        <div className="pt-busy-editor">
            <div className="pt-busy-editor__hint">
                <span>Click anywhere to add a one-hour block. Drag blocks to move them, or drag an edge to resize.</span>
                <button type="button" onClick={() => createSlot('M', 9 * 60)}>Add busy time</button>
            </div>
            <div className="pt-busy-calendar-scroll">
                <div className="pt-busy-calendar" style={{ '--busy-calendar-height': `${END_MINUTE - START_MINUTE + TOP_GAP}px`, '--busy-calendar-top-gap': `${TOP_GAP}px` }}>
                    <div className="pt-busy-calendar__corner" />
                    {PT_DAYS.map((day) => <div className="pt-busy-calendar__day" key={day}>{DAY_NAMES[day]}</div>)}
                    <div className="pt-busy-calendar__times">
                        {hours.map((minute) => <span key={minute} style={{ top: TOP_GAP + minute - START_MINUTE }}>{formatClock(minute)}</span>)}
                    </div>
                    {PT_DAYS.map((day) => (
                        <div className="pt-busy-calendar__column" onPointerDown={(event) => addSlot(event, day)} key={day}>
                            {slots.filter((slot) => slot.day === day).map((slot) => (
                                <button
                                    className={`pt-busy-slot${slot.id === selectedId ? ' is-selected' : ''}`}
                                    style={{ top: TOP_GAP + slot.start - START_MINUTE, height: slot.end - slot.start }}
                                    type="button"
                                    key={slot.id}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (suppressClick.current) {
                                            suppressClick.current = false;
                                            return;
                                        }
                                        setSelectedId(slot.id);
                                    }}
                                    onPointerDown={(event) => startInteraction(event, slot, 'move')}
                                >
                                    <i className="pt-busy-slot__handle pt-busy-slot__handle--top" onPointerDown={(event) => startInteraction(event, slot, 'resize-start')} />
                                    <strong>Busy</strong>
                                    <span>{formatClock(slot.start)} to {formatClock(slot.end)}</span>
                                    <i className="pt-busy-slot__handle pt-busy-slot__handle--bottom" onPointerDown={(event) => startInteraction(event, slot, 'resize-end')} />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <aside className="pt-busy-details" aria-label="Edit busy time" ref={detailsRef}>
                    <div>
                        <strong>Edit busy time</strong>
                        <button type="button" aria-label="Close busy time editor" onClick={() => setSelectedId(null)}><CloseRoundedIcon /></button>
                    </div>
                    <label>Day<select value={selected.day} onChange={(event) => updateSelected({ day: event.target.value })}>{PT_DAYS.map((day) => <option value={day} key={day}>{DAY_NAMES[day]}</option>)}</select></label>
                    <label>Starts<input type="time" min="08:00" max="21:45" step="900" value={minutesToTime(selected.start)} onChange={(event) => {
                        const start = clamp(timeToMinutes(event.target.value), START_MINUTE, END_MINUTE - MIN_SLOT);
                        updateSelected({ start, end: clamp(Math.max(start + MIN_SLOT, selected.end), start + MIN_SLOT, END_MINUTE) });
                    }} /></label>
                    <label>Ends<input type="time" min="08:15" max="22:00" step="900" value={minutesToTime(selected.end)} onChange={(event) => updateSelected({ end: clamp(timeToMinutes(event.target.value), selected.start + MIN_SLOT, END_MINUTE) })} /></label>
                    <button className="pt-busy-details__delete" type="button" onClick={removeSelected}><DeleteOutlineRoundedIcon /> Delete busy time</button>
                </aside>
            )}
        </div>
    );
};

const PtDataGenerator = () => {
    const courses = useMemo(() => Object.keys(COURSE_CATALOG).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), []);
    const professorsByCourse = COURSE_CATALOG;
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [uin, setUin] = useState('');
    const [desiredLabHours, setDesiredLabHours] = useState('');
    const [canPt, setCanPt] = useState([]);
    const [wantsPt, setWantsPt] = useState([]);
    const [busySlots, setBusySlots] = useState([]);
    const [professors, setProfessors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loadMessage, setLoadMessage] = useState('');
    const profileInput = useRef(null);

    const toggleCourse = (course, checked) => {
        setCanPt((current) => checked ? [...current, course] : current.filter((value) => value !== course));
        if (!checked) {
            setWantsPt((current) => current.filter((value) => value !== course));
            setProfessors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== course)));
        }
    };

    const updateProfessor = (course, professor, checked) => setProfessors((current) => ({
        ...current,
        [course]: {
            ...current[course],
            selected: checked
                ? [...(current[course]?.selected || []), professor]
                : (current[course]?.selected || []).filter((value) => value !== professor),
        },
    }));

    const loadProfile = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        try {
            const profile = parsePeerTeacher(await file.text());
            const loadedCourses = (profile.classesCanPT || []).map(String).filter((course) => courses.includes(course));
            setFirstName(profile.firstname);
            setLastName(profile.lastname);
            setUin(String(profile.uin || '').replace(/\D/g, '').slice(0, 9));
            setDesiredLabHours(profile.desiredLabHours ?? '');
            setCanPt(loadedCourses);
            setWantsPt((profile.preferredClasses || []).map(String).filter((course) => loadedCourses.includes(course)));
            setBusySlots(PT_DAYS.flatMap((day) => splitBusyRanges(profile.busyTimes?.[day]).flatMap((range) => {
                const parsed = parseRange(range);
                return parsed ? [{ id: crypto.randomUUID(), day, start: parsed.start, end: parsed.end }] : [];
            })));
            setProfessors(Object.fromEntries(loadedCourses.map((course) => {
                const names = profile.professorsHad?.[course] || [];
                const selected = names.filter((name) => professorsByCourse[course].includes(name));
                const other = names.filter((name) => !professorsByCourse[course].includes(name)).join(', ');
                return [course, { selected, hasOther: Boolean(other), other }];
            })));
            setSubmitted(false);
            setLoadMessage(`Loaded ${file.name}. Downloading saves a new timestamp.`);
        } catch {
            setLoadMessage('That file is not a valid PT profile.');
        }
    };

    const download = (event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!firstName.trim() || !lastName.trim() || !/^\d{9}$/.test(uin) || desiredLabHours === '' || !canPt.length) return;
        const data = buildPtSubmission({ firstName, lastName, uin, desiredLabHours, canPt, wantsPt, busySlots, professors });
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${firstName.trim()}-${lastName.trim()}-pt-data.json`.toLowerCase().replace(/\s+/g, '-');
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="pt-generator-page">
            <form className="pt-generator-form" onSubmit={download} noValidate>
                <section className="pt-generator-intro">
                    <p>Set up your availability</p>
                    <h1>PT Schedule Profile</h1>
                    <button className="pt-generator-load" type="button" onClick={() => profileInput.current?.click()}>Load saved profile</button>
                    <input ref={profileInput} hidden type="file" accept=".json,application/json" onChange={loadProfile} />
                    {loadMessage && <span>{loadMessage}</span>}
                </section>

                <section className="pt-generator-section" aria-labelledby="name-heading">
                    <div className="pt-generator-section__number">01</div>
                    <div className="pt-generator-section__content">
                        <h2 id="name-heading">Your name</h2>
                        <div className="pt-generator-name-grid">
                            <label>First name<input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} aria-invalid={submitted && !firstName.trim()} /></label>
                            <label>Last name<input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} aria-invalid={submitted && !lastName.trim()} /></label>
                        </div>
                        {submitted && (!firstName.trim() || !lastName.trim()) && <p className="pt-generator-error">Enter your first and last name.</p>}
                        <label className="pt-generator-uin">UIN<input inputMode="numeric" autoComplete="off" maxLength="9" value={uin} onChange={(event) => setUin(event.target.value.replace(/\D/g, '').slice(0, 9))} aria-invalid={submitted && !/^\d{9}$/.test(uin)} /></label>
                        {submitted && !/^\d{9}$/.test(uin) && <p className="pt-generator-error">Enter your nine-digit UIN.</p>}
                        <label className="pt-generator-uin">How many lab hours do you want to work?
                            <input type="number" min="0" step="1" value={desiredLabHours} onChange={(event) => setDesiredLabHours(event.target.value.replace(/\D/g, ''))} aria-invalid={submitted && desiredLabHours === ''} />
                            <small>1 lab session = 1 hour</small>
                        </label>
                        {submitted && desiredLabHours === '' && <p className="pt-generator-error">Enter the number of lab hours you want.</p>}
                    </div>
                </section>

                <section className="pt-generator-section" aria-labelledby="can-pt-heading">
                    <div className="pt-generator-section__number">02</div>
                    <div className="pt-generator-section__content">
                        <h2 id="can-pt-heading">Classes I can PT for</h2>
                        <p>Select ALL the classes you can PT for.</p>
                        <div className="pt-generator-course-grid">{courses.map((course) => <Toggle key={course} label={`CSCE ${course}`} checked={canPt.includes(course)} onChange={(event) => toggleCourse(course, event.target.checked)} />)}</div>
                        {submitted && !canPt.length && <p className="pt-generator-error">Select at least one class.</p>}
                    </div>
                </section>

                <section className="pt-generator-section" aria-labelledby="want-pt-heading">
                    <div className="pt-generator-section__number">03</div>
                    <div className="pt-generator-section__content">
                        <h2 id="want-pt-heading">Classes I want to PT for</h2>
                        <p>Your preferences must be classes you selected above. We will prioritize these.</p>
                        <div className="pt-generator-course-grid">{courses.map((course) => <Toggle key={course} label={`CSCE ${course}`} disabled={!canPt.includes(course)} checked={wantsPt.includes(course)} onChange={(event) => setWantsPt((current) => event.target.checked ? [...current, course] : current.filter((value) => value !== course))} />)}</div>
                    </div>
                </section>

                <section className="pt-generator-section pt-generator-section--wide" aria-labelledby="busy-heading">
                    <div className="pt-generator-section__number">04</div>
                    <div className="pt-generator-section__content">
                        <h2 id="busy-heading">Configure busy times</h2>
                        <p>Add classes, meetings, and any time you cannot work.</p>
                        <BusyCalendar slots={busySlots} setSlots={setBusySlots} />
                    </div>
                </section>

                <section className="pt-generator-section" aria-labelledby="professors-heading">
                    <div className="pt-generator-section__number">05</div>
                    <div className="pt-generator-section__content">
                        <h2 id="professors-heading">Professors you had</h2>
                        <p>Choose the instructors you took for each class. If not listed or you do not recall, select Other.</p>
                        {!canPt.length && <div className="pt-generator-empty">Select classes above to see their current professors.</div>}
                        <div className="pt-generator-professors">
                            {[...canPt].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((course) => (
                                <fieldset key={course}>
                                    <legend>CSCE {course}</legend>
                                    <div className="pt-generator-professor-options">{professorsByCourse[course].map((professor) => <Toggle key={professor} label={professor} checked={professors[course]?.selected?.includes(professor) || false} onChange={(event) => updateProfessor(course, professor, event.target.checked)} />)}</div>
                                    <div className={`pt-generator-other${professors[course]?.hasOther ? ' is-open' : ''}`}>
                                        <Toggle label="Other" checked={Boolean(professors[course]?.hasOther)} onChange={(event) => setProfessors((current) => ({ ...current, [course]: { ...current[course], hasOther: event.target.checked, other: event.target.checked ? current[course]?.other || '' : '' } }))} />
                                        {professors[course]?.hasOther && <input aria-label={`Other professor for CSCE ${course}`} placeholder="Professor name" value={professors[course]?.other || ''} onChange={(event) => setProfessors((current) => ({ ...current, [course]: { ...current[course], other: event.target.value } }))} />}
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="pt-generator-submit">
                    <div><strong>Ready to send?</strong><span>Download your completed PT profile as JSON.</span></div>
                    <button type="submit"><DownloadRoundedIcon /> Download PT data</button>
                </footer>
            </form>
        </main>
    );
};

export default PtDataGenerator;
