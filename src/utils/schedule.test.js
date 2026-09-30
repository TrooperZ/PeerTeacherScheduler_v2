import assert from 'node:assert/strict';
import test from 'node:test';
import { addCourseColors, COURSE_COLORS, getLabCompatibility, getPTLabState, isPTEligibleForCourse, layoutOverlappingEvents, normalizeBusyRanges, parseLabTime, parseRange, splitBusyRanges } from './schedule.js';

test('normalizes schedule data for the calendar', () => {
    assert.equal(COURSE_COLORS.length, 32);
    assert.equal(new Set(COURSE_COLORS).size, 32);
    assert.deepEqual(parseRange('8:00-11:10'), { start: 480, end: 670, label: '8:00 AM – 11:10 AM' });
    assert.deepEqual(parseRange('1:50-2:40'), { start: 830, end: 880, label: '1:50 PM – 2:40 PM' });
    assert.deepEqual(parseLabTime('TR 02:20 PM - 03:10 PM').days, ['T', 'R']);
    assert.deepEqual(splitBusyRanges(['9:10-10:00&13:50-14:40']), ['9:10-10:00', '13:50-14:40']);
    assert.deepEqual(normalizeBusyRanges(['9:10-10:00, 1:50 PM-2:40 PM']), ['09:10-10:00', '13:50-14:40']);
    assert.throws(() => normalizeBusyRanges(['not a time']), /valid time range/);
    assert.equal(addCourseColors([{ course: '221' }, { course: '221' }])[0].color,
        addCourseColors([{ course: '221' }, { course: '221' }])[1].color);
    const grouped = addCourseColors([
        { course: '120', section: '200', professor: 'Ada' },
        { course: '120', section: '500', professor: 'Ada' },
        { course: '120', section: '501', professor: 'Grace' },
    ], { separateHonors: true, honorsSections: ['120-200'], separateProfessors: true, professorGroups: ['120::Ada'] });
    assert.equal(new Set(grouped.map(({ color }) => color)).size, 3);
    assert.deepEqual(
        layoutOverlappingEvents([
            { id: 'a', parsed: { start: 480, end: 540 } },
            { id: 'b', parsed: { start: 510, end: 570 } },
            { id: 'c', parsed: { start: 570, end: 600 } },
        ]).map(({ lane, laneCount }) => [lane, laneCount]),
        [[0, 2], [1, 2], [0, 1]],
    );
});

test('explains PT compatibility without rejecting back-to-back labs', () => {
    const labs = [
        { course: '120', section: '501', time: 'M 09:10 AM - 10:00 AM', pt: [], maxPTs: 1 },
        { course: '221', section: '502', time: 'M 10:00 AM - 10:50 AM', pt: [], maxPTs: 1 },
    ];
    const pt = { uin: '1', labs: [{ course: '120', section: '501' }], busyTimes: { M: [], T: [], W: [], R: [], F: [] } };

    assert.deepEqual(getLabCompatibility(labs[1], pt, labs), { compatible: true, reason: 'Available' });
    assert.equal(getLabCompatibility({ ...labs[1], time: 'M 09:30 AM - 10:20 AM' }, pt, labs).reason, 'Conflicts with 120-501');
    assert.equal(getLabCompatibility({ ...labs[1], time: 'T 09:30 AM - 10:20 AM' }, { ...pt, busyTimes: { ...pt.busyTimes, T: ['09:00-10:00'] } }, labs).reason, 'Busy at this time');
});

test('classifies PT scheduling overlays', () => {
    const lab = { course: '221', section: '501', time: 'M 09:10 AM - 10:00 AM', pt: [], maxPTs: 1 };
    const pt = { uin: '1', labs: [], busyTimes: { M: ['09:30-10:30'] } };
    assert.equal(getPTLabState(lab, pt, [lab]).state, 'conflict');
    assert.equal(getPTLabState({ ...lab, pt: ['1'] }, pt, [lab]).state, 'assigned');
    assert.equal(getPTLabState({ ...lab, pt: ['2'] }, pt, [lab]).reason, 'Assigned To Other');
    for (const course of ['110', '111', '120', '221']) {
        assert.equal(isPTEligibleForCourse({ classesCanPT: ['312'] }, course), true);
    }
    assert.equal(isPTEligibleForCourse({ classesCanPT: ['120'] }, '312'), false);
    assert.equal(isPTEligibleForCourse({}, '221'), true);
    assert.equal(getLabCompatibility({ ...lab, course: '312' }, { ...pt, busyTimes: {}, classesCanPT: ['331'] }, [lab]).reason, 'Not eligible for this course');
    assert.equal(getLabCompatibility({ ...lab, assignmentLocked: true }, { ...pt, busyTimes: {} }, [lab]).reason, 'Section is locked');
});
