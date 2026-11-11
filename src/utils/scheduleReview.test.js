import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewSchedule } from './scheduleReview.js';

test('review detects conflicts, overrides, unfilled slots and workload', () => {
    const labs = [
        { course: '331', section: '501', time: 'M 09:00 AM - 10:00 AM', pt: ['1'], maxPTs: 1, hours: 1 },
        { course: '120', section: '502', time: 'M 09:30 AM - 10:30 AM', pt: ['1'], maxPTs: 2, hours: 1 },
    ];
    const pts = [{ firstname: 'A', lastname: 'B', uin: '1', classesCanPT: [], busyTimes: { M: ['09:00-09:15'] }, labs: [{ course: '331', section: '501' }, { course: '120', section: '502' }], hours: 2, desiredLabHours: 3 }];
    const result = reviewSchedule(labs, pts);
    assert.ok(result.issues.some((issue) => issue.includes('eligibility override')));
    assert.ok(result.issues.some((issue) => issue.includes('busy')));
    assert.ok(result.issues.some((issue) => issue.includes('conflicts with')));
    assert.equal(result.open[0].missing, 1);
    assert.equal(result.workload[0].hours, 2);
    assert.equal(result.workload[0].target, 3);
});


test('review flags invalid clock values', () => {
    const result = reviewSchedule([{ course: '120', section: '501', time: 'M 99:99 AM - 10:00 AM', pt: [], maxPTs: 1 }], []);
    assert.ok(result.issues.some((issue) => issue.includes('invalid lab time')));
});
