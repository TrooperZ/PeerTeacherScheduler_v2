const clone = (value) => structuredClone(value);
const isObject = (value) => value !== null && typeof value === 'object';
const UNSAFE_PATH_PARTS = new Set(['__proto__', 'constructor', 'prototype']);

const changesBetween = (before, after, path = []) => {
    if (Object.is(before, after)) return [];
    if (!isObject(before) || !isObject(after) || Array.isArray(before) !== Array.isArray(after)) {
        return [{ op: 'replace', path, before: clone(before), after: clone(after) }];
    }

    if (Array.isArray(before)) {
        const changes = [];
        const sharedLength = Math.min(before.length, after.length);
        for (let index = 0; index < sharedLength; index += 1) {
            changes.push(...changesBetween(before[index], after[index], [...path, index]));
        }
        for (let index = before.length - 1; index >= after.length; index -= 1) {
            changes.push({ op: 'remove', path: [...path, index], before: clone(before[index]) });
        }
        for (let index = before.length; index < after.length; index += 1) {
            changes.push({ op: 'add', path: [...path, index], after: clone(after[index]) });
        }
        return changes;
    }

    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => {
        if (!(key in after)) return [{ op: 'remove', path: [...path, key], before: clone(before[key]) }];
        if (!(key in before)) return [{ op: 'add', path: [...path, key], after: clone(after[key]) }];
        return changesBetween(before[key], after[key], [...path, key]);
    });
};

export const databaseSnapshot = (labs, peerTeachers, settings) => clone({ labs, peerTeachers, settings });

export const createDatabaseChanges = (before, after) => changesBetween(before, after);

const applyChange = (database, change) => {
    const parent = change.path.slice(0, -1).reduce((value, key) => {
        if (!isObject(value) || !Object.hasOwn(value, key)) throw new Error('Invalid history path.');
        return value[key];
    }, database);
    if (!isObject(parent)) throw new Error('Invalid history path.');
    const key = change.path.at(-1);
    if (change.op === 'remove') {
        if (Array.isArray(parent)) parent.splice(key, 1);
        else delete parent[key];
    } else if (change.op === 'add' && Array.isArray(parent)) {
        parent.splice(key, 0, clone(change.after));
    } else {
        parent[key] = clone(change.after);
    }
};

export const replayDatabaseHistory = (history, entryIndex) => {
    const database = clone(history.base);
    history.entries.slice(0, entryIndex + 1).forEach(({ changes }) => changes.forEach((change) => applyChange(database, change)));
    return database;
};

const isSnapshot = (value) => isObject(value) && Array.isArray(value.labs) && Array.isArray(value.peerTeachers) && isObject(value.settings);
const isChange = (change) => isObject(change)
    && ['add', 'remove', 'replace'].includes(change.op)
    && Array.isArray(change.path)
    && change.path.length > 0
    && ['labs', 'peerTeachers', 'settings'].includes(change.path[0])
    && change.path.every((part) => (typeof part === 'string' && !UNSAFE_PATH_PARTS.has(part)) || (Number.isInteger(part) && part >= 0))
    && (change.op === 'remove' ? Object.hasOwn(change, 'before') : Object.hasOwn(change, 'after'));

export const loadDatabaseHistory = (snapshot, history) => {
    if (!isObject(history) || !isSnapshot(history.base) || !Array.isArray(history.entries)
        || !history.entries.every((entry) => isObject(entry) && typeof entry.timestamp === 'string'
            && (entry.source === undefined || ['manual', 'autoscheduler'].includes(entry.source))
            && Array.isArray(entry.changes) && entry.changes.every(isChange))) {
        return { base: clone(snapshot), entries: [] };
    }
    try {
        const latest = replayDatabaseHistory(history, history.entries.length - 1);
        if (createDatabaseChanges(latest, snapshot).length) return { base: clone(snapshot), entries: [] };
        return clone(history);
    } catch {
        return { base: clone(snapshot), entries: [] };
    }
};

export const formatChangePath = (path) => path.reduce((label, part) => (
    typeof part === 'number' ? `${label}[${part}]` : `${label}${label ? '.' : ''}${part}`
), '');

const labKey = ({ course, section }) => `${course}-${section}`;
const labName = (lab) => `CSCE ${lab.course}-${lab.section}`;
const ptName = (pt, uin) => pt ? `${pt.firstname} ${pt.lastname}` : `PT ${uin}`;
const words = (value) => String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
const displayValue = (value) => value === undefined ? 'not set' : typeof value === 'boolean' ? (value ? 'On' : 'Off') : JSON.stringify(value);
const assignmentNames = (uins, peerTeachers) => uins.length
    ? uins.map((uin) => ptName(peerTeachers.get(uin), uin)).join(', ')
    : 'Unassigned';

export const summarizeDatabaseChanges = (before, after, changes) => {
    const events = [];
    const beforeLabs = new Map(before.labs.map((lab) => [labKey(lab), lab]));
    const afterLabs = new Map(after.labs.map((lab) => [labKey(lab), lab]));
    const peerTeachers = new Map([...before.peerTeachers, ...after.peerTeachers].map((pt) => [pt.uin, pt]));

    afterLabs.forEach((lab, key) => {
        const previous = beforeLabs.get(key);
        if (!previous) {
            events.push({ title: `Added ${labName(lab)}`, detail: lab.professor || lab.time || 'New lab', before: 'Does not exist', after: labName(lab) });
            return;
        }
        const oldAssignments = new Set(previous.pt || []);
        const newAssignments = new Set(lab.pt || []);
        newAssignments.forEach((uin) => {
            if (!oldAssignments.has(uin)) events.push({
                title: `Assigned ${ptName(peerTeachers.get(uin), uin)}`,
                detail: labName(lab),
                before: assignmentNames(previous.pt || [], peerTeachers),
                after: assignmentNames(lab.pt || [], peerTeachers),
            });
        });
        oldAssignments.forEach((uin) => {
            if (!newAssignments.has(uin)) events.push({
                title: `Removed ${ptName(peerTeachers.get(uin), uin)}`,
                detail: labName(lab),
                before: assignmentNames(previous.pt || [], peerTeachers),
                after: assignmentNames(lab.pt || [], peerTeachers),
            });
        });
        const oldLocks = new Set(previous.lockedPTs || []);
        const newLocks = new Set(lab.lockedPTs || []);
        newLocks.forEach((uin) => {
            if (!oldLocks.has(uin)) events.push({ title: `Locked ${ptName(peerTeachers.get(uin), uin)}`, detail: labName(lab), before: 'Unlocked', after: 'Locked' });
        });
        oldLocks.forEach((uin) => {
            if (!newLocks.has(uin)) events.push({ title: `Unlocked ${ptName(peerTeachers.get(uin), uin)}`, detail: labName(lab), before: 'Locked', after: 'Unlocked' });
        });
    });
    beforeLabs.forEach((lab, key) => {
        if (!afterLabs.has(key)) events.push({ title: `Removed ${labName(lab)}`, detail: lab.professor || lab.time || 'Lab removed', before: labName(lab), after: 'Does not exist' });
    });

    const beforePTs = new Map(before.peerTeachers.map((pt) => [pt.uin, pt]));
    const afterPTs = new Map(after.peerTeachers.map((pt) => [pt.uin, pt]));
    afterPTs.forEach((pt, uin) => {
        if (!beforePTs.has(uin)) events.push({ title: `Added ${ptName(pt, uin)}`, detail: 'Peer teacher', before: 'Does not exist', after: ptName(pt, uin) });
    });
    beforePTs.forEach((pt, uin) => {
        if (!afterPTs.has(uin)) events.push({ title: `Removed ${ptName(pt, uin)}`, detail: 'Peer teacher', before: ptName(pt, uin), after: 'Does not exist' });
    });

    changes.forEach((change) => {
        const [scope, index, field, ...rest] = change.path;
        if (scope === 'settings') {
            const label = [index, field, ...rest].filter((part) => part !== undefined).map(words).join(' / ');
            events.push({ title: `Changed ${label}`, detail: 'Setting', before: displayValue(change.before), after: displayValue(change.after) });
        } else if (scope === 'labs' && !['pt', 'lockedPTs'].includes(field)) {
            const lab = after.labs[index] || before.labs[index];
            if (lab && beforeLabs.has(labKey(lab)) && afterLabs.has(labKey(lab))) {
                events.push({ title: `Updated ${labName(lab)}`, detail: words(field), before: displayValue(change.before), after: displayValue(change.after) });
            }
        } else if (scope === 'peerTeachers' && !['labs', 'hours'].includes(field)) {
            const pt = after.peerTeachers[index] || before.peerTeachers[index];
            if (pt && beforePTs.has(pt.uin) && afterPTs.has(pt.uin)) {
                events.push({ title: `Updated ${ptName(pt, pt.uin)}`, detail: words(field), before: displayValue(change.before), after: displayValue(change.after) });
            }
        }
    });

    return events.length ? events : changes.map((change) => ({
        title: words(change.path[0]),
        detail: formatChangePath(change.path),
        before: displayValue(change.before),
        after: displayValue(change.after),
    }));
};
