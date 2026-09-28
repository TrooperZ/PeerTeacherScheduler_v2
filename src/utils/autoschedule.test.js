import assert from 'node:assert/strict';
import test from 'node:test';
import { autoschedule, clearScheduleAssignments, DEFAULT_AUTOSCHEDULER_RULES } from './autoschedule.js';

const available = { busyTimes: { M: [], T: [], W: [], R: [], F: [] }, hours: 0, labs: [] };

test('fills honors first and ranks professor history before class preference', () => {
    const labs = [
        { course: '312', section: '501', professor: 'Regular Professor (P)', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 },
        { course: '120', section: '200', professor: 'Honors Professor (P)', time: 'T 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 },
    ];
    const peerTeachers = [
        { ...available, firstname: 'Prefers', lastname: 'Course', uin: '1', classesCanPT: ['120', '312'], preferredClasses: ['120'] },
        { ...available, firstname: 'Had', lastname: 'Professor', uin: '2', classesCanPT: ['120', '312'], professorsHad: { 120: ['Honors Professor'] } },
    ];

    const result = autoschedule({ labs, peerTeachers, rules: DEFAULT_AUTOSCHEDULER_RULES, honorsSections: ['120-200'] });
    assert.deepEqual(result.labs.find(({ section }) => section === '200').pt, ['2']);
    assert.deepEqual(result.labs.find(({ section }) => section === '501').pt, ['1']);
    assert.equal(result.assignments, 2);
    assert.equal(result.changes.length, 2);
    assert.equal(result.peerTeachers.reduce((total, pt) => total + pt.hours, 0), 2);
});

test('preserves locked assignments and reports slots with no eligible available PT', () => {
    const labs = [{ course: '331', section: '200', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: ['1'], lockedPTs: ['1'], maxPTs: 2 }];
    const peerTeachers = [{ ...available, uin: '1', labs: [{ course: '331', section: '200' }], hours: 1, classesCanPT: ['331'] }];
    const result = autoschedule({ labs, peerTeachers });
    assert.deepEqual(result.labs[0].pt, ['1']);
    assert.deepEqual(result.labs[0].lockedPTs, ['1']);
    assert.equal(result.assignments, 0);
    assert.equal(result.skippedSlots, 1);
});

test('clears unlocked assignments or the entire schedule without leaving stale PT data', () => {
    const labs = [
        { course: '120', section: '200', hours: 2, pt: ['1', '2'], lockedPTs: ['1'] },
        { course: '221', section: '501', hours: 1, pt: ['2'] },
    ];
    const peerTeachers = [
        { uin: '1', hours: 2, labs: [{ course: '120', section: '200' }] },
        { uin: '2', hours: 3, labs: [{ course: '120', section: '200' }, { course: '221', section: '501' }] },
    ];

    const unlocked = clearScheduleAssignments({ labs, peerTeachers });
    assert.deepEqual(unlocked.labs.map(({ pt }) => pt), [['1'], []]);
    assert.deepEqual(unlocked.peerTeachers.map(({ hours }) => hours), [2, 0]);

    const everything = clearScheduleAssignments({ labs, peerTeachers, includeLocked: true });
    assert.deepEqual(everything.labs.map(({ pt, lockedPTs }) => [pt, lockedPTs]), [[[], []], [[], []]]);
    assert.deepEqual(everything.peerTeachers.map(({ labs: assigned }) => assigned), [[], []]);
});

test('uses the seed to shuffle equal matches deterministically', () => {
    const labs = [{ course: '120', section: '501', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 }];
    const peerTeachers = ['1', '2', '3', '4'].map((uin) => ({ ...available, firstname: 'Same', lastname: 'Priority', uin, classesCanPT: ['120'] }));
    const run = (seed) => autoschedule({ labs, peerTeachers, seed }).labs[0].pt[0];

    assert.equal(run('fall-2026'), run('fall-2026'));
    assert.notEqual(run('fall-2026'), run('spring-2027'));
});

test('supports optional section and assignment-count rules', () => {
    const labs = [
        { course: '120', section: '501', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 },
        { course: '120', section: '200', time: 'T 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 },
    ];
    const peerTeachers = [
        { ...available, firstname: 'More', lastname: 'Sections', uin: '1', classesCanPT: ['120'], labs: [{ course: '221', section: '501' }] },
        { ...available, firstname: 'Fewer', lastname: 'Sections', uin: '2', classesCanPT: ['120'] },
    ];
    const result = autoschedule({
        labs,
        peerTeachers,
        rules: { lab: [{ type: 'section-priority', value: '501 > 200' }], match: [{ type: 'fewest-sections' }] },
    });
    assert.deepEqual(result.changes[0], { course: '120', section: '501', uin: '2' });
});

test('applies per-lab PT preferences and exclusions before global matching rules', () => {
    const labs = [{ course: '120', section: '501', professor: 'Ada (P)', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 }];
    const peerTeachers = [
        { ...available, firstname: 'Preferred', lastname: 'PT', uin: '1', classesCanPT: ['120'] },
        { ...available, firstname: 'Professor', lastname: 'Match', uin: '2', classesCanPT: ['120'], professorsHad: { 120: ['Ada'] } },
    ];
    const run = (labRule) => autoschedule({ labs, peerTeachers, labRules: [{ labKey: '120-501', ...labRule }] }).labs[0].pt;

    assert.deepEqual(run({ preferredUins: ['1'] }), ['1']);
    assert.deepEqual(run({ preferredUins: ['1'], excludedUins: ['1'] }), ['2']);
});

test('follows desired lab hours while retaining legacy hour balancing', () => {
    const labs = [
        { course: '120', section: '500', time: 'M 08:00 AM - 09:00 AM', hours: 1, pt: [], maxPTs: 1 },
        { course: '120', section: '501', time: 'M 09:00 AM - 10:00 AM', hours: 1, pt: [], maxPTs: 1 },
        { course: '120', section: '502', time: 'M 10:00 AM - 11:00 AM', hours: 1, pt: [], maxPTs: 1 },
        { course: '120', section: '503', time: 'M 11:00 AM - 12:00 PM', hours: 1, pt: [], maxPTs: 1 },
    ];
    const peerTeachers = [
        { ...available, firstname: 'Three', lastname: 'Hours', uin: '1', classesCanPT: ['120'], desiredLabHours: 3 },
        { ...available, firstname: 'One', lastname: 'Hour', uin: '2', classesCanPT: ['120'], desiredLabHours: 1 },
    ];
    const rules = { lab: [], match: [{ type: 'balance-hours' }] };
    const result = autoschedule({ labs, peerTeachers, rules });
    assert.deepEqual(result.peerTeachers.map(({ hours }) => hours), [3, 1]);

    const legacyPeerTeachers = peerTeachers.map((pt) => {
        const legacy = { ...pt };
        delete legacy.desiredLabHours;
        return legacy;
    });
    const legacy = autoschedule({ labs: labs.slice(0, 2), peerTeachers: legacyPeerTeachers, rules });
    assert.deepEqual(legacy.peerTeachers.map(({ hours }) => hours), [1, 1]);
});

test('scarcity-first fills a constrained lab that priority order misses', () => {
    const labs = [
        { course: '331', section: '501', professor: 'Priority Professor (P)', time: 'TR 03:30 PM - 04:20 PM', hours: 2, pt: [], maxPTs: 1 },
        { course: '312', section: '501', professor: 'Other Professor (P)', time: 'TR 03:30 PM - 04:20 PM', hours: 2, pt: [], maxPTs: 1 },
    ];
    const peerTeachers = [
        { ...available, firstname: 'Only', lastname: 'Flexible', uin: '1', classesCanPT: ['312', '331'], professorsHad: { 331: ['Priority Professor'] } },
        { ...available, firstname: 'Course', lastname: 'Specific', uin: '2', classesCanPT: ['331'] },
    ];

    const priority = autoschedule({ labs, peerTeachers, algorithm: 'priority' });
    assert.equal(priority.assignments, 1);
    assert.equal(priority.skippedSlots, 1);

    const scarcity = autoschedule({ labs, peerTeachers, algorithm: 'scarcity' });
    assert.equal(scarcity.assignments, 2);
    assert.equal(scarcity.skippedSlots, 0);
    assert.deepEqual(scarcity.labs.map(({ pt }) => pt), [['2'], ['1']]);
});

test('skips section-locked labs without counting them as open or unmatched', () => {
    const labs = [{ course: '120', section: '500', time: 'M 08:00 AM - 09:00 AM', hours: 1, pt: [], maxPTs: 1, assignmentLocked: true }];
    const peerTeachers = [{ ...available, uin: '1', classesCanPT: ['120'] }];
    const result = autoschedule({ labs, peerTeachers });
    assert.deepEqual(result.labs[0].pt, []);
    assert.equal(result.openSlots, 0);
    assert.equal(result.skippedSlots, 0);
});
