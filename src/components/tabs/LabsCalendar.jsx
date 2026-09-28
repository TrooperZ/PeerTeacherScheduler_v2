import { useState } from 'react';
import { Popover } from '@mui/material';
import { DAY_NAMES, formatTime, layoutOverlappingEvents, parseLabTime } from '../../utils/schedule';

const DAYS = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
const START_MINUTE = 8 * 60;
const END_MINUTE = 22 * 60;
const TOP_GAP = 20;

const LabsCalendar = ({ labs, peerTeachers, course, selectedLab, onSelectLab, compact = false }) => {
    const [eventInfo, setEventInfo] = useState(null);
    const visibleLabs = course ? labs.filter((lab) => lab.course === course) : labs;
    const parsedLabs = visibleLabs.map((lab) => parseLabTime(lab.time)).filter(Boolean);
    const visibleDays = compact && parsedLabs.length ? DAYS.filter((day) => parsedLabs.some(({ days }) => days.includes(day))) : DAYS;
    const startMinute = compact && parsedLabs.length ? Math.max(0, Math.floor(Math.min(...parsedLabs.map(({ start }) => start)) / 60) * 60 - 60) : START_MINUTE;
    const endMinute = compact && parsedLabs.length ? Math.min(24 * 60, Math.ceil(Math.max(...parsedLabs.map(({ end }) => end)) / 60) * 60 + 60) : END_MINUTE;
    const namesByUin = new Map(peerTeachers.map((pt) => [pt.uin, `${pt.firstname} ${pt.lastname}`]));
    const hours = Array.from({ length: (endMinute - startMinute) / 60 + 1 }, (_, index) => startMinute + index * 60);
    const labsByDay = new Map(visibleDays.map((day) => {
        const events = visibleLabs.flatMap((lab) => {
            const parsed = parseLabTime(lab.time);
            return parsed?.days.includes(day) ? [{ lab, parsed }] : [];
        });
        return [day, layoutOverlappingEvents(events)];
    }));

    return (
        <>
            <div className="pt-calendar-scroll labs-calendar-scroll">
                <div className="pt-calendar" style={{ '--calendar-height': `${endMinute - startMinute + TOP_GAP}px`, '--calendar-top-gap': `${TOP_GAP}px`, '--calendar-days': visibleDays.length }}>
                    <div className="pt-calendar__corner" />
                    {visibleDays.map((day) => <div className="pt-calendar__day" key={day}>{DAY_NAMES[day].slice(0, 3)}</div>)}
                    <div className="pt-calendar__times">
                        {hours.map((minute) => <span key={minute} style={{ top: TOP_GAP + minute - startMinute }}>{formatTime(`${Math.floor(minute / 60)}:00`)}</span>)}
                    </div>
                    {visibleDays.map((day) => (
                        <div className="pt-calendar__column" key={day}>
                            {labsByDay.get(day).map(({ lab, parsed, lane, laneCount }) => {
                                const assignedNames = (lab.pt || []).map((uin) => namesByUin.get(uin)).filter(Boolean);
                                const unassigned = assignedNames.length === 0;
                                return parsed.end > startMinute && parsed.start < endMinute ? (
                                    <button
                                        type="button"
                                        className={`calendar-event calendar-event--class labs-calendar-event${unassigned ? ' calendar-event--unassigned' : ''}${selectedLab?.course === lab.course && selectedLab?.section === lab.section ? ' is-selected' : ''}`}
                                        style={{
                                            '--event-top': `${TOP_GAP + Math.max(0, parsed.start - startMinute)}px`,
                                            '--event-height': `${Math.max(42, Math.min(parsed.end, endMinute) - Math.max(parsed.start, startMinute))}px`,
                                            '--event-color': lab.color,
                                            '--event-lane': lane,
                                            '--event-lane-count': laneCount,
                                        }}
                                        key={`${lab.course}-${lab.section}-${day}`}
                                        onClick={(event) => onSelectLab
                                            ? onSelectLab(lab)
                                            : setEventInfo({ anchorEl: event.currentTarget, day, lab, parsed, assignedNames })}
                                    >
                                        <strong>CSCE {lab.course} - {lab.section}</strong>
                                        <span>{parsed.label}</span>
                                        <b>{assignedNames.join(', ') || 'Unassigned'}</b>
                                    </button>
                                ) : null;
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <Popover
                open={!onSelectLab && Boolean(eventInfo)}
                anchorEl={eventInfo?.anchorEl}
                onClose={() => setEventInfo(null)}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                slotProps={{ paper: { className: 'calendar-event-popover' } }}
            >
                {eventInfo && (
                    <div className="calendar-event-info">
                        <span className="calendar-event-info__eyebrow">Lab details</span>
                        <h3>CSCE {eventInfo.lab.course} - {eventInfo.lab.section}</h3>
                        <dl>
                            <div><dt>Professor</dt><dd>{eventInfo.lab.professor || 'Not listed'}</dd></div>
                            <div><dt>Section</dt><dd>{eventInfo.lab.section}</dd></div>
                            <div><dt>Day</dt><dd>{DAY_NAMES[eventInfo.day]}</dd></div>
                            <div><dt>Time</dt><dd>{eventInfo.parsed.label}</dd></div>
                            <div><dt>Room</dt><dd>{eventInfo.lab.location || 'Not listed'}</dd></div>
                            <div><dt>Assigned PT</dt><dd>{eventInfo.assignedNames.join(', ') || 'Unassigned'}</dd></div>
                            <div><dt>Weekly hours</dt><dd>{eventInfo.lab.hours ?? 'Not listed'}</dd></div>
                            <div><dt>Max PTs</dt><dd>{eventInfo.lab.maxPTs ?? 'Not listed'}</dd></div>
                        </dl>
                    </div>
                )}
            </Popover>
        </>
    );
};

export default LabsCalendar;
