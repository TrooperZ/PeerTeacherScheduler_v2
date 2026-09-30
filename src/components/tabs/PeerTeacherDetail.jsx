import { useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Popover } from '@mui/material';
import { DAY_NAMES, formatTime, normalizeBusyRanges, parseLabTime, parseRange, splitBusyRanges } from '../../utils/schedule';

const DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
const START_MINUTE = 8 * 60;
const END_MINUTE = 22 * 60;
const HOUR_HEIGHT = 60;
const TOP_GAP = 20;

const eventStyle = ({ start, end }) => ({
    '--event-top': `${TOP_GAP + Math.max(0, start - START_MINUTE)}px`,
    '--event-height': `${Math.max(24, Math.min(end, END_MINUTE) - Math.max(start, START_MINUTE))}px`,
});

const PeerTeacherDetail = ({ peerTeacher, labs, onBack, onSaveSettings }) => {
    const [eventInfo, setEventInfo] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [settings, setSettings] = useState(null);
    const assignedLabs = labs.filter((lab) => lab.pt?.includes(peerTeacher.uin));
    const busyByDay = DAYS.map((day) => ({
        day,
        ranges: splitBusyRanges(peerTeacher.busyTimes?.[day]),
    })).filter(({ ranges }) => ranges.length);
    const hours = Array.from({ length: (END_MINUTE - START_MINUTE) / 60 + 1 }, (_, index) => START_MINUTE + index * 60);
    const courses = [...new Set([
        ...labs.map(({ course }) => String(course)),
        ...(peerTeacher.classesCanPT || []).map(String),
        ...(peerTeacher.preferredClasses || []).map(String),
        ...Object.keys(peerTeacher.professorsHad || {}),
    ])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const openSettings = () => {
        setSettings({
            firstName: peerTeacher.firstname,
            lastName: peerTeacher.lastname,
            uin: peerTeacher.uin,
            desiredLabHours: peerTeacher.desiredLabHours ?? '',
            classesCanPT: (peerTeacher.classesCanPT || []).map(String),
            preferredClasses: (peerTeacher.preferredClasses || []).map(String),
            busyTimes: Object.fromEntries(DAYS.map((day) => [day, splitBusyRanges(peerTeacher.busyTimes?.[day]).join(', ')])),
            professorsHad: Object.fromEntries(courses.map((course) => [course, (peerTeacher.professorsHad?.[course] || []).join(', ')])),
        });
        setSettingsError('');
        setSettingsOpen(true);
    };

    const toggleCourse = (field, course, checked) => setSettings((current) => {
        const values = checked ? [...current[field], course] : current[field].filter((value) => value !== course);
        return {
            ...current,
            [field]: values,
            ...(field === 'classesCanPT' && !checked ? { preferredClasses: current.preferredClasses.filter((value) => value !== course) } : {}),
        };
    });

    const saveSettings = () => {
        try {
            const firstname = settings.firstName.trim();
            const lastname = settings.lastName.trim();
            const uin = settings.uin.trim();
            if (!firstname || !lastname) throw new Error('First and last name are required.');
            if (!/^\d{9}$/.test(uin)) throw new Error('UIN must contain exactly nine digits.');
            const busyTimes = Object.fromEntries(DAYS.map((day) => [day, normalizeBusyRanges([settings.busyTimes[day] || ''])]));
            const classesCanPT = [...new Set(settings.classesCanPT)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            const preferredClasses = [...new Set(settings.preferredClasses.filter((course) => classesCanPT.includes(course)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            const desiredLabHours = settings.desiredLabHours === '' ? undefined : Number(settings.desiredLabHours);
            if (desiredLabHours !== undefined && (!Number.isInteger(desiredLabHours) || desiredLabHours < 0)) throw new Error('Desired lab hours must be a whole number of zero or more.');
            const professorsHad = Object.fromEntries(classesCanPT.map((course) => [course,
                (settings.professorsHad[course] || '').split(',').map((name) => name.trim()).filter(Boolean),
            ]));
            onSaveSettings({ ...peerTeacher, firstname, lastname, uin, desiredLabHours, classesCanPT, preferredClasses, busyTimes, professorsHad });
            setSettingsOpen(false);
        } catch (error) {
            setSettingsError(error.message);
        }
    };

    return (
        <section className="pt-detail" aria-labelledby="pt-detail-name">
            <header className="pt-detail__toolbar">
                <Button onClick={onBack} color="inherit" startIcon={<ArrowBackRoundedIcon />}>Peer Teachers</Button>
                <IconButton aria-label={`Settings for ${peerTeacher.firstname} ${peerTeacher.lastname}`} onClick={openSettings}>
                    <SettingsRoundedIcon />
                </IconButton>
            </header>

            <div className="pt-detail__identity">
                <h1 id="pt-detail-name">{peerTeacher.firstname} {peerTeacher.lastname}</h1>
                <p>UIN {peerTeacher.uin}</p>
            </div>

            <div className="pt-detail__summary">
                <section>
                    <h2>Sections</h2>
                    {assignedLabs.length ? assignedLabs.map((lab) => {
                        const parsed = parseLabTime(lab.time);
                        return <p key={`${lab.course}-${lab.section}`}>CSCE {lab.course} - {lab.section} <span>({parsed?.label || lab.time})</span></p>;
                    }) : <p className="pt-detail__empty">No sections assigned</p>}
                </section>
                <section>
                    <h2>Busy Times</h2>
                    {busyByDay.length ? busyByDay.map(({ day, ranges }) => (
                        <p key={day}>{DAY_NAMES[day]} <span>{ranges.map((range) => parseRange(range)?.label || range).join(', ')}</span></p>
                    )) : <p className="pt-detail__empty">No busy times</p>}
                </section>
            </div>

            <section className="pt-calendar-section" aria-labelledby="calendar-title">
                <div className="pt-calendar-heading">
                    <div>
                        <h2 id="calendar-title">Calendar View</h2>
                        <p>Busy times and assigned sections</p>
                    </div>
                    <div className="pt-calendar-legend" aria-label="Calendar legend">
                        <span><i className="legend-swatch legend-swatch--busy" />Busy</span>
                        {[...new Map(assignedLabs.map((lab) => [lab.course, lab])).values()].map((lab) => (
                            <span key={lab.course}><i className="legend-swatch" style={{ background: lab.color }} />CSCE {lab.course}</span>
                        ))}
                    </div>
                </div>

                <div className="pt-calendar-scroll">
                    <div className="pt-calendar" style={{ '--calendar-height': `${END_MINUTE - START_MINUTE + TOP_GAP}px`, '--calendar-top-gap': `${TOP_GAP}px` }}>
                        <div className="pt-calendar__corner" />
                        {DAYS.map((day) => <div className="pt-calendar__day" key={day}>{DAY_NAMES[day].slice(0, 3)}</div>)}
                        <div className="pt-calendar__times">
                            {hours.map((minute) => <span key={minute} style={{ top: TOP_GAP + (minute - START_MINUTE) * HOUR_HEIGHT / 60 }}>{formatTime(`${Math.floor(minute / 60)}:00`)}</span>)}
                        </div>
                        {DAYS.map((day) => (
                            <div className="pt-calendar__column" key={day}>
                                {splitBusyRanges(peerTeacher.busyTimes?.[day]).map((range, index) => {
                                    const parsed = parseRange(range);
                                    return parsed && parsed.end > START_MINUTE && parsed.start < END_MINUTE ? (
                                        <button type="button" className="calendar-event calendar-event--busy" style={eventStyle(parsed)} key={`${range}-${index}`}
                                            onClick={(event) => setEventInfo({ anchorEl: event.currentTarget, day, parsed })}>
                                            <strong>Busy Time</strong><span>{parsed.label}</span>
                                        </button>
                                    ) : null;
                                })}
                                {assignedLabs.flatMap((lab) => {
                                    const parsed = parseLabTime(lab.time);
                                    if (!parsed?.days.includes(day) || parsed.end <= START_MINUTE || parsed.start >= END_MINUTE) return [];
                                    return [<button type="button" className="calendar-event calendar-event--class" style={{ ...eventStyle(parsed), '--event-color': lab.color }} key={`${lab.course}-${lab.section}-${day}`}
                                        onClick={(event) => setEventInfo({ anchorEl: event.currentTarget, day, parsed, lab })}>
                                        <strong>CSCE {lab.course} - {lab.section}</strong><span>{parsed.label}</span>
                                    </button>];
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Popover
                open={Boolean(eventInfo)}
                anchorEl={eventInfo?.anchorEl}
                onClose={() => setEventInfo(null)}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                slotProps={{ paper: { className: 'calendar-event-popover' } }}
            >
                {eventInfo?.lab ? (
                    <div className="calendar-event-info">
                        <span className="calendar-event-info__eyebrow">Assigned section</span>
                        <h3>CSCE {eventInfo.lab.course} - {eventInfo.lab.section}</h3>
                        <dl>
                            <div><dt>Professor</dt><dd>{eventInfo.lab.professor || 'Not listed'}</dd></div>
                            <div><dt>Section</dt><dd>{eventInfo.lab.section}</dd></div>
                            <div><dt>Day</dt><dd>{DAY_NAMES[eventInfo.day]}</dd></div>
                            <div><dt>Time</dt><dd>{eventInfo.parsed.label}</dd></div>
                            <div><dt>Room</dt><dd>{eventInfo.lab.location || 'Not listed'}</dd></div>
                            <div><dt>Weekly hours</dt><dd>{eventInfo.lab.hours ?? 'Not listed'}</dd></div>
                        </dl>
                    </div>
                ) : eventInfo && (
                    <div className="calendar-event-info">
                        <span className="calendar-event-info__eyebrow">Availability</span>
                        <h3>Busy Time</h3>
                        <dl>
                            <div><dt>Day</dt><dd>{DAY_NAMES[eventInfo.day]}</dd></div>
                            <div><dt>Time</dt><dd>{eventInfo.parsed.label}</dd></div>
                            <div><dt>Status</dt><dd>Unavailable</dd></div>
                        </dl>
                    </div>
                )}
            </Popover>

            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { className: 'pt-settings-dialog' } }}>
                <DialogTitle>PT settings</DialogTitle>
                {settings && <DialogContent dividers>
                    <p className="pt-settings-dialog__hint">Changes affect future compatibility checks and autoscheduling. Changing the UIN updates existing assignments and locks.</p>
                    <div className="pt-settings-dialog__identity">
                        <label>First name<input autoComplete="given-name" value={settings.firstName} onChange={(event) => setSettings((current) => ({ ...current, firstName: event.target.value }))} /></label>
                        <label>Last name<input autoComplete="family-name" value={settings.lastName} onChange={(event) => setSettings((current) => ({ ...current, lastName: event.target.value }))} /></label>
                        <label>UIN<input inputMode="numeric" maxLength="9" value={settings.uin} onChange={(event) => setSettings((current) => ({ ...current, uin: event.target.value.replace(/\D/g, '').slice(0, 9) }))} /></label>
                    </div>
                    <label className="pt-settings-dialog__field">Desired lab hours
                        <input type="number" min="0" step="1" value={settings.desiredLabHours} onChange={(event) => setSettings((current) => ({ ...current, desiredLabHours: event.target.value }))} />
                    </label>
                    <fieldset className="pt-settings-dialog__courses"><legend>Classes I can PT for</legend>{courses.map((course) => <label key={course}><input type="checkbox" checked={settings.classesCanPT.includes(course)} onChange={(event) => toggleCourse('classesCanPT', course, event.target.checked)} />CSCE {course}</label>)}</fieldset>
                    <fieldset className="pt-settings-dialog__courses"><legend>Classes I prefer to PT for</legend>{courses.map((course) => <label key={course}><input type="checkbox" disabled={!settings.classesCanPT.includes(course)} checked={settings.preferredClasses.includes(course)} onChange={(event) => toggleCourse('preferredClasses', course, event.target.checked)} />CSCE {course}</label>)}</fieldset>
                    <fieldset className="pt-settings-dialog__busy"><legend>Busy times</legend><small>Use 24-hour ranges separated by commas, for example 09:00-10:00, 13:00-14:00.</small>{DAYS.map((day) => <label key={day}>{DAY_NAMES[day]}<input value={settings.busyTimes[day]} onChange={(event) => setSettings((current) => ({ ...current, busyTimes: { ...current.busyTimes, [day]: event.target.value } }))} /></label>)}</fieldset>
                    <fieldset className="pt-settings-dialog__professors"><legend>Professors previously had</legend><small>One or more names separated by commas.</small>{settings.classesCanPT.map((course) => <label key={course}>CSCE {course}<input value={settings.professorsHad[course] || ''} onChange={(event) => setSettings((current) => ({ ...current, professorsHad: { ...current.professorsHad, [course]: event.target.value } }))} placeholder="Professor names" /></label>)}</fieldset>
                    {settingsError && <p className="pt-settings-dialog__error" role="alert">{settingsError}</p>}
                </DialogContent>}
                <DialogActions><Button onClick={() => setSettingsOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveSettings}>Save settings</Button></DialogActions>
            </Dialog>
        </section>
    );
};

export default PeerTeacherDetail;
