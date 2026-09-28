import { useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Button, IconButton, Popover, Tooltip } from '@mui/material';
import { DAY_NAMES, formatTime, parseLabTime, parseRange, splitBusyRanges } from '../../utils/schedule';

const DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
const START_MINUTE = 8 * 60;
const END_MINUTE = 22 * 60;
const HOUR_HEIGHT = 60;
const TOP_GAP = 20;

const eventStyle = ({ start, end }) => ({
    '--event-top': `${TOP_GAP + Math.max(0, start - START_MINUTE)}px`,
    '--event-height': `${Math.max(24, Math.min(end, END_MINUTE) - Math.max(start, START_MINUTE))}px`,
});

const PeerTeacherDetail = ({ peerTeacher, labs, onBack }) => {
    const [eventInfo, setEventInfo] = useState(null);
    const assignedLabs = labs.filter((lab) => lab.pt?.includes(peerTeacher.uin));
    const busyByDay = DAYS.map((day) => ({
        day,
        ranges: splitBusyRanges(peerTeacher.busyTimes?.[day]),
    })).filter(({ ranges }) => ranges.length);
    const hours = Array.from({ length: (END_MINUTE - START_MINUTE) / 60 + 1 }, (_, index) => START_MINUTE + index * 60);

    return (
        <section className="pt-detail" aria-labelledby="pt-detail-name">
            <header className="pt-detail__toolbar">
                <Button onClick={onBack} color="inherit" startIcon={<ArrowBackRoundedIcon />}>Peer Teachers</Button>
                <Tooltip title="Settings are coming next">
                    <span>
                        <IconButton aria-label={`Settings for ${peerTeacher.firstname} ${peerTeacher.lastname}`}>
                            <SettingsRoundedIcon />
                        </IconButton>
                    </span>
                </Tooltip>
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
        </section>
    );
};

export default PeerTeacherDetail;
