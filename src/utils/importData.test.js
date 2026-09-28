import assert from 'node:assert/strict';
import test from 'node:test';
import { courseRequestOptions, getLabConfigurationOptions, mergePeerTeachers, parseLabs, parsePeerTeacher, parseScheduleDatabase } from './importData.js';

test('parses configured PT JSON and replaces duplicate UINs', () => {
    const pt = parsePeerTeacher(JSON.stringify({ firstname: ' Amin ', lastname: ' Karic ', uin: '123', busyTimes: { M: ['09:00-10:00'] } }));
    assert.equal(pt.firstname, 'Amin');
    assert.deepEqual(pt.labs, []);
    assert.equal(mergePeerTeachers([{ firstname: 'Old', lastname: 'Name', uin: '123' }], [pt])[0].firstname, 'Amin');
});

test('parses Howdy laboratory meetings', () => {
    const response = JSON.stringify([{
        SWV_CLASS_SEARCH_SUBJECT: 'CSCE', SWV_CLASS_SEARCH_COURSE: '120', SWV_CLASS_SEARCH_SECTION: '500',
        SWV_CLASS_SEARCH_SITE: 'Galveston',
        SWV_CLASS_SEARCH_INSTRCTR_JSON: JSON.stringify([{ NAME: 'Ada Lovelace' }]),
        SWV_CLASS_SEARCH_JSON_CLOB: JSON.stringify([{ SSRMEET_MTYP_CODE: 'Laboratory', SSRMEET_MON_DAY: 'Y', SSRMEET_BEGIN_TIME: '09:10 AM', SSRMEET_END_TIME: '10:00 AM', SSRMEET_BLDG_CODE: 'ZACH', SSRMEET_ROOM_CODE: '500' }]),
    }]);
    const labs = parseLabs(response);
    assert.equal(labs.length, 1);
    assert.equal(labs[0].time, 'M 09:10 AM - 10:00 AM');
    assert.equal(labs[0].hours, 1);
    assert.equal(parseLabs(response, { excludeGalveston: true }).length, 0);
});

test('accepts wrapped course-section responses', () => {
    const labs = parseLabs(JSON.stringify({ data: [{
        SWV_CLASS_SEARCH_SUBJECT: 'CSCE', SWV_CLASS_SEARCH_COURSE: '221', SWV_CLASS_SEARCH_SECTION: '501',
        SWV_CLASS_SEARCH_JSON_CLOB: JSON.stringify([{ SSRMEET_MTYP_CODE: 'Laboratory', SSRMEET_TUE_DAY: 'Y', SSRMEET_BEGIN_TIME: '02:20 PM', SSRMEET_END_TIME: '03:10 PM' }]),
    }] }));
    assert.equal(labs[0].course, '221');
});

test('builds editable GET and POST course requests', () => {
    assert.equal(courseRequestOptions('GET', 'not used').body, undefined);
    assert.deepEqual(JSON.parse(courseRequestOptions('POST', '{"termCode":"202631"}').body), { termCode: '202631' });
    assert.throws(() => courseRequestOptions('POST', '{invalid}'));
});

test('rejects malformed schedule databases before the UI consumes them', () => {
    assert.throws(() => parseScheduleDatabase('{"labs":[{}],"peerTeachers":[]}'));
    assert.throws(() => parseScheduleDatabase('{"labs":[],"peerTeachers":[{}]}'));
    assert.deepEqual(parseScheduleDatabase('{"labs":[{"course":"120","section":"500"}],"peerTeachers":[{"firstname":"Ada","lastname":"Lovelace"}]}').labs.length, 1);
});

test('builds honors and unique course-professor configuration options', () => {
    const options = getLabConfigurationOptions([
        { course: '312', section: '200', professor: 'Amit Merchant (P)' },
        { course: '110', section: '500', professor: 'Ki Hwan K. Yum (P)' },
        { course: '312', section: '201', professor: 'Amit Merchant (P)' },
        { course: '312', section: '500', professor: 'Rabinarayan Mahapatra (P)' },
    ]);
    assert.deepEqual(options.honors.map(({ key }) => key), ['312-200', '312-201']);
    assert.equal(options.honors[0].professor, 'Amit Merchant');
    assert.deepEqual(options.professors.map(({ label }) => label), ['CSCE 110 - Ki Hwan K. Yum', 'CSCE 312 - Amit Merchant', 'CSCE 312 - Rabinarayan Mahapatra']);
    assert.deepEqual(options.professorCourses.map(({ course }) => course), ['110', '312']);
});
