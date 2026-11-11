import { getLabCompatibility, isPTEligibleForCourse, parseLabTime, parseRange, splitBusyRanges } from './schedule.js';

const name = (pt) => `${pt.firstname} ${pt.lastname}`;
const key = (lab) => `${lab.course}-${lab.section}`;
const overlap = (a, b) => a.start < b.end && b.start < a.end;

export const reviewSchedule = (labs, peerTeachers, labRules = []) => {
    const issues = [];
    const open = [];
    for (const lab of labs) {
        const label = `CSCE ${key(lab)}`;
        const parsed = parseLabTime(lab.time);
        if (!parsed) issues.push(`${label}: invalid lab time`);
        if ((lab.pt || []).length > Number(lab.maxPTs || 0)) issues.push(`${label}: over capacity`);
        const missing = Math.max(0, Number(lab.maxPTs || 0) - (lab.pt || []).length);
        if (missing) {
            const excluded = new Set(labRules.find((rule) => rule.labKey === key(lab))?.excludedUins || []);
            const candidates = peerTeachers.map((pt) => ({ name: name(pt), reason: excluded.has(pt.uin) ? 'Excluded by lab rule' : getLabCompatibility(lab, pt, labs).reason }));
            open.push({ label, missing, candidates });
        }
        for (const uin of lab.pt || []) {
            const pt = peerTeachers.find((item) => item.uin === uin);
            if (!pt) { issues.push(`${label}: assigned PT ${uin} not found`); continue; }
            if (!isPTEligibleForCourse(pt, lab.course)) issues.push(`${label}: ${name(pt)} has an eligibility override`);
            if (parsed && parsed.days.some((day) => splitBusyRanges(pt.busyTimes?.[day]).some((range) => {
                const busy = parseRange(range); return busy && overlap(parsed, busy);
            }))) issues.push(`${label}: ${name(pt)} is busy at this time`);
        }
    }
    for (const pt of peerTeachers) {
        const assigned = labs.filter((lab) => lab.pt?.includes(pt.uin));
        for (let i = 0; i < assigned.length; i++) for (let j = i + 1; j < assigned.length; j++) {
            const a = parseLabTime(assigned[i].time), b = parseLabTime(assigned[j].time);
            if (a && b && a.days.some((day) => b.days.includes(day)) && overlap(a, b)) issues.push(`${name(pt)}: ${key(assigned[i])} conflicts with ${key(assigned[j])}`);
        }
        const hours = assigned.reduce((sum, lab) => sum + Number(lab.hours || 0), 0);
        if (Math.abs(hours - Number(pt.hours || 0)) > 0.001) issues.push(`${name(pt)}: stored hours do not match assignments`);
        const refs = new Set((pt.labs || []).map(key));
        if (assigned.some((lab) => !refs.has(key(lab))) || refs.size !== assigned.length) issues.push(`${name(pt)}: assignment records do not match`);
    }
    const workload = peerTeachers.map((pt) => ({ name: name(pt), hours: labs.filter((lab) => lab.pt?.includes(pt.uin)).reduce((sum, lab) => sum + Number(lab.hours || 0), 0), target: pt.desiredLabHours === '' || pt.desiredLabHours == null ? null : Number(pt.desiredLabHours) }));
    return { issues, open, workload };
};
