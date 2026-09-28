import { getLabCompatibility } from './schedule.js';

export const DEFAULT_AUTOSCHEDULER_RULES = {
    lab: [
        { type: 'honors-first' },
        { type: 'course-priority', value: '331 = 313 > 312 > 221 > 120 > 110 = 111' },
    ],
    match: [
        { type: 'professor-match' },
        { type: 'preferred-course' },
        { type: 'balance-hours' },
    ],
};

const labKey = (lab) => `${lab.course}-${lab.section}`;
const normalizeProfessor = (value = '') => value.replace(/\s*\([^)]+\)\s*$/, '').trim().toLowerCase();
const courseRanks = (value = '') => new Map(value.split('>').flatMap((tier, rank) =>
    tier.split('=').map((course) => [course.trim(), rank]).filter(([course]) => course)
));

const compareLabs = (a, b, rules, honorsSections) => {
    for (const rule of rules) {
        if (rule.type === 'honors-first') {
            const aHonors = honorsSections.has(labKey(a)) || /^2\d{2}/.test(String(a.section));
            const bHonors = honorsSections.has(labKey(b)) || /^2\d{2}/.test(String(b.section));
            if (aHonors !== bHonors) return Number(bHonors) - Number(aHonors);
        }
        if (rule.type === 'course-priority') {
            const ranks = courseRanks(rule.value);
            const difference = (ranks.get(String(a.course)) ?? Infinity) - (ranks.get(String(b.course)) ?? Infinity);
            if (difference) return difference;
        }
        if (rule.type === 'section-priority') {
            const ranks = courseRanks(rule.value);
            const difference = (ranks.get(String(a.section)) ?? Infinity) - (ranks.get(String(b.section)) ?? Infinity);
            if (difference) return difference;
        }
    }
    return String(a.course).localeCompare(String(b.course), undefined, { numeric: true })
        || String(a.section).localeCompare(String(b.section), undefined, { numeric: true });
};

const seededRank = (seed, lab, peerTeacher) => {
    let hash = 2166136261;
    for (const character of `${seed}:${labKey(lab)}:${peerTeacher.uin}`) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const hourPreference = (peerTeacher, lab) => {
    const hours = Number(peerTeacher.hours || 0);
    const target = peerTeacher.desiredLabHours === '' || peerTeacher.desiredLabHours === undefined || peerTeacher.desiredLabHours === null
        ? null : Number(peerTeacher.desiredLabHours);
    if (!Number.isFinite(target) || target < 0) return { group: 1, rank: hours };
    const remaining = target - hours;
    const projected = hours + Number(lab.hours || 0);
    if (remaining > 0 && projected <= target) return { group: 0, rank: -remaining };
    if (remaining > 0) return { group: 2, rank: projected - target };
    return { group: 3, rank: hours - target };
};

const compareHourPreferences = (a, b, lab) => {
    const aPreference = hourPreference(a, lab);
    const bPreference = hourPreference(b, lab);
    return aPreference.group - bPreference.group || aPreference.rank - bPreference.rank;
};

const comparePeerTeachers = (a, b, lab, rules, seed, labRule) => {
    const preferred = new Set(labRule?.preferredUins || []);
    const preferredDifference = Number(preferred.has(b.uin)) - Number(preferred.has(a.uin));
    if (preferredDifference) return preferredDifference;
    for (const rule of rules) {
        if (rule.type === 'professor-match') {
            const professor = normalizeProfessor(lab.professor);
            const matched = (pt) => (pt.professorsHad?.[lab.course] || []).some((name) => normalizeProfessor(name) === professor);
            const difference = Number(matched(b)) - Number(matched(a));
            if (difference) return difference;
        }
        if (rule.type === 'preferred-course') {
            const preferred = (pt) => (pt.preferredClasses || []).map(String).includes(String(lab.course));
            const difference = Number(preferred(b)) - Number(preferred(a));
            if (difference) return difference;
        }
        if (rule.type === 'balance-hours') {
            const difference = compareHourPreferences(a, b, lab);
            if (difference) return difference;
        }
        if (rule.type === 'fewest-sections') {
            const difference = (a.labs?.length || 0) - (b.labs?.length || 0);
            if (difference) return difference;
        }
    }
    if (seed) {
        const difference = seededRank(seed, lab, a) - seededRank(seed, lab, b);
        if (difference) return difference;
    }
    return String(a.lastname).localeCompare(String(b.lastname))
        || String(a.firstname).localeCompare(String(b.firstname))
        || String(a.uin).localeCompare(String(b.uin));
};

export const autoschedule = ({ labs, peerTeachers, rules = DEFAULT_AUTOSCHEDULER_RULES, honorsSections = [], labRules = [], seed = '', algorithm = 'priority' }) => {
    const scheduledLabs = labs.map((lab) => ({
        ...lab,
        pt: [...(lab.pt || [])],
        lockedPTs: (lab.lockedPTs || []).filter((uin) => lab.pt?.includes(uin)),
    }));
    const scheduledPeerTeachers = peerTeachers.map((pt) => ({ ...pt, hours: Number(pt.hours || 0), labs: [...(pt.labs || [])] }));
    const openSlots = scheduledLabs.reduce((total, lab) => total + (lab.assignmentLocked ? 0 : Math.max(0, Number(lab.maxPTs || 0) - lab.pt.length)), 0);
    const honors = new Set(honorsSections);
    const orderedLabs = scheduledLabs.filter((lab) => !lab.assignmentLocked).sort((a, b) => compareLabs(a, b, rules.lab || [], honors));
    const exhausted = new Set();
    let assignments = 0;
    let skippedSlots = 0;
    const changes = [];

    while (true) {
        const openLabs = orderedLabs.filter((lab) => lab.pt.length < Number(lab.maxPTs || 0) && !exhausted.has(labKey(lab)));
        if (!openLabs.length) break;
        const ranked = openLabs.map((lab) => {
            const labRule = labRules.find((rule) => rule.labKey === labKey(lab));
            const excluded = new Set(labRule?.excludedUins || []);
            const candidates = scheduledPeerTeachers
                .filter((pt) => !excluded.has(pt.uin) && getLabCompatibility(lab, pt, scheduledLabs).compatible)
                .sort((a, b) => comparePeerTeachers(a, b, lab, rules.match || [], seed, labRule));
            return { lab, candidates };
        });
        if (algorithm === 'scarcity') ranked.sort((a, b) => a.candidates.length - b.candidates.length || compareLabs(a.lab, b.lab, rules.lab || [], honors));

        const { lab, candidates } = ranked[0];
        const peerTeacher = candidates[0];
        if (!peerTeacher) {
            skippedSlots += Number(lab.maxPTs || 0) - lab.pt.length;
            exhausted.add(labKey(lab));
            continue;
        }
        lab.pt.push(peerTeacher.uin);
        peerTeacher.labs.push({ course: lab.course, section: lab.section });
        peerTeacher.hours += Number(lab.hours || 0);
        assignments += 1;
        changes.push({ course: lab.course, section: lab.section, uin: peerTeacher.uin });
    }

    return { labs: scheduledLabs, peerTeachers: scheduledPeerTeachers, openSlots, assignments, skippedSlots, changes };
};

export const clearScheduleAssignments = ({ labs, peerTeachers, includeLocked = false }) => {
    const clearedLabs = labs.map((lab) => {
        const lockedPTs = includeLocked ? [] : (lab.lockedPTs || []).filter((uin) => lab.pt?.includes(uin));
        return { ...lab, pt: [...lockedPTs], lockedPTs };
    });
    const clearedPeerTeachers = peerTeachers.map((pt) => {
        const assigned = clearedLabs.filter((lab) => lab.pt.includes(pt.uin));
        return {
            ...pt,
            labs: assigned.map(({ course, section }) => ({ course, section })),
            hours: assigned.reduce((total, lab) => total + Number(lab.hours || 0), 0),
        };
    });
    return { labs: clearedLabs, peerTeachers: clearedPeerTeachers };
};
