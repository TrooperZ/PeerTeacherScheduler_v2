export const COURSE_COLORS = [
    '#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff375f', '#64d2ff',
    '#ffd60a', '#5e5ce6', '#ff6482', '#40c8e0', '#70d7a0', '#ac8e68',
    '#ff453a', '#32ade6', '#c7f464', '#ff6b35', '#00c7be', '#b8a1ff',
    '#ffb3c1', '#8bd450', '#d17bff', '#ff8c42', '#4dd0e1', '#e6c229',
    '#7f8cff', '#ef476f', '#06d6a0', '#f78c6b', '#9be564', '#c77dff',
    '#48cae4', '#f4a261',
];

export const DAY_NAMES = {
    U: 'Sunday', M: 'Monday', T: 'Tuesday', W: 'Wednesday',
    R: 'Thursday', F: 'Friday', S: 'Saturday',
};

const padTime = (value) => value.trim().replace(/\s+/g, ' ');

export const formatTime = (value) => {
    const match = padTime(value).match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return value;
    let hour = Number(match[1]);
    const minute = match[2];
    const suffix = match[3]?.toUpperCase() || (hour >= 12 ? 'PM' : 'AM');
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${suffix}`;
};

const formatMinutes = (minutes) => {
    const hour = Math.floor(minutes / 60) % 24;
    const minute = String(minutes % 60).padStart(2, '0');
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const parseClock = (value, inferAfternoon = true) => {
    const match = padTime(value).match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = match[3]?.toUpperCase();
    if (suffix === 'PM' && hour < 12) hour += 12;
    if (suffix === 'AM' && hour === 12) hour = 0;
    if (!suffix && inferAfternoon && hour > 0 && hour < 8) hour += 12;
    return hour * 60 + minute;
};

export const parseRange = (range, inferAfternoon = true) => {
    const [startText, endText] = range.split(/\s*-\s*/);
    if (!startText || !endText) return null;
    const start = parseClock(startText, inferAfternoon);
    let end = parseClock(endText, inferAfternoon);
    if (start === null || end === null) return null;
    if (end <= start && end + 12 * 60 <= 24 * 60) end += 12 * 60;
    return { start, end, label: `${formatMinutes(start)} – ${formatMinutes(end)}` };
};

export const parseLabTime = (time = '') => {
    const match = time.match(/^([UMTWRFS]+)\s+(.+?)\s*-\s*(.+)$/i);
    if (!match) return null;
    const range = parseRange(`${match[2]}-${match[3]}`, false);
    return range && { days: [...match[1].toUpperCase()], ...range };
};

const labColorKey = (lab, configuration) => {
    if (configuration?.separateHonors && configuration.honorsSections?.includes(`${lab.course}-${lab.section}`)) return `honors:${lab.course}-${lab.section}`;
    if (configuration?.separateProfessors && configuration.professorGroups?.includes(`${lab.course}::${lab.professor}`)) return `professor:${lab.course}::${lab.professor}`;
    return `course:${lab.course}`;
};

export const addCourseColors = (labs, configuration) => {
    const courseKeys = [...new Set(labs.map(({ course }) => course))]
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
        .map((course) => `course:${course}`);
    const keys = [...courseKeys, ...new Set(labs.map((lab) => labColorKey(lab, configuration)).filter((key) => !courseKeys.includes(key)))];
    const colors = new Map(keys.map((key, index) => [key, COURSE_COLORS[index % COURSE_COLORS.length]]));
    return labs.map((lab) => ({ ...lab, color: configuration ? colors.get(labColorKey(lab, configuration)) : lab.color || colors.get(labColorKey(lab)) }));
};

export const splitBusyRanges = (ranges = []) => ranges
    .flatMap((range) => range.split('&'))
    .map((range) => range.trim())
    .filter(Boolean);

export const normalizeBusyRanges = (ranges = []) => splitBusyRanges(ranges.flatMap((range) => range.split(','))).map((range) => {
    const parsed = parseRange(range);
    if (!parsed || parsed.end <= parsed.start) throw new Error(`Use a valid time range, such as 09:00-10:00.`);
    const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return `${toTime(parsed.start)}-${toTime(parsed.end)}`;
});

const rangesOverlap = (a, b) => a.start < b.end && b.start < a.end;

const UNIVERSALLY_ELIGIBLE_COURSES = new Set(['110', '111', '120', '221']);

export const isPTEligibleForCourse = (peerTeacher, course) => UNIVERSALLY_ELIGIBLE_COURSES.has(String(course))
    || !Array.isArray(peerTeacher?.classesCanPT)
    || peerTeacher.classesCanPT.map(String).includes(String(course));

export const getLabCompatibility = (lab, peerTeacher, labs) => {
    if (!lab || !peerTeacher) return { compatible: false, reason: 'Select a lab' };
    if (lab.pt?.includes(peerTeacher.uin)) return { compatible: false, reason: 'Already assigned' };
    if (lab.assignmentLocked) return { compatible: false, reason: 'Section is locked' };
    if ((lab.pt?.length || 0) >= lab.maxPTs) return { compatible: false, reason: 'Lab is full' };
    if (!isPTEligibleForCourse(peerTeacher, lab.course)) return { compatible: false, reason: 'Not eligible for this course' };

    const candidate = parseLabTime(lab.time);
    if (!candidate) return { compatible: false, reason: 'Invalid lab time' };

    for (const day of candidate.days) {
        const busy = splitBusyRanges(peerTeacher.busyTimes?.[day]).map((range) => parseRange(range));
        if (busy.some((range) => range && rangesOverlap(candidate, range))) {
            return { compatible: false, reason: 'Busy at this time' };
        }
    }

    const assignedLabs = (peerTeacher.labs || []).flatMap(({ course, section }) => {
        const assigned = labs.find((item) => item.course === course && item.section === section);
        return assigned ? [assigned] : [];
    });

    for (const assignedLab of assignedLabs) {
        const assigned = parseLabTime(assignedLab.time);
        if (assigned && candidate.days.some((day) => assigned.days.includes(day)) && rangesOverlap(candidate, assigned)) {
            return { compatible: false, reason: `Conflicts with ${assignedLab.course}-${assignedLab.section}` };
        }
    }

    return { compatible: true, reason: 'Available' };
};

export const getPTLabState = (lab, peerTeacher, labs) => {
    if (lab.pt?.includes(peerTeacher.uin)) return { state: 'assigned', reason: 'Assigned to this PT' };
    if (lab.pt?.length) return { state: 'assigned-other', reason: 'Assigned To Other' };
    const compatibility = getLabCompatibility(lab, peerTeacher, labs);
    return { state: compatibility.compatible ? 'available' : 'conflict', reason: compatibility.reason };
};

export const layoutOverlappingEvents = (events) => {
    const sorted = [...events].sort((a, b) => a.parsed.start - b.parsed.start || a.parsed.end - b.parsed.end);
    const groups = [];
    sorted.forEach((event) => {
        const group = groups.at(-1);
        if (!group || event.parsed.start >= group.end) groups.push({ end: event.parsed.end, events: [event] });
        else {
            group.end = Math.max(group.end, event.parsed.end);
            group.events.push(event);
        }
    });

    return groups.flatMap(({ events: group }) => {
        const laneEnds = [];
        const laidOut = group.map((event) => {
            let lane = laneEnds.findIndex((end) => end <= event.parsed.start);
            if (lane === -1) lane = laneEnds.length;
            laneEnds[lane] = event.parsed.end;
            return { ...event, lane };
        });
        return laidOut.map((event) => ({ ...event, laneCount: laneEnds.length }));
    });
};
