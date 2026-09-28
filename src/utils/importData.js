import { addCourseColors } from './schedule.js';

export const VALID_LAB_COURSES = ['110', '111', '120', '121', '206', '221', '222', '312', '313', '314', '315', '331'];

const sortPeerTeachers = (peerTeachers) => [...peerTeachers].sort((a, b) =>
    a.lastname.localeCompare(b.lastname) || a.firstname.localeCompare(b.firstname)
);

export const parsePeerTeacher = (text) => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('The file is empty.');

    if (trimmed.startsWith('{')) {
        const data = JSON.parse(trimmed);
        if (!data.firstname?.trim() || !data.lastname?.trim()) throw new Error('First and last name are required.');
        return {
            ...data,
            firstname: data.firstname.trim(),
            lastname: data.lastname.trim(),
            uin: String(data.uin || '').trim(),
            hours: Number(data.hours || 0),
            busyTimes: data.busyTimes || { M: [], T: [], W: [], R: [], F: [] },
            labs: Array.isArray(data.labs) ? data.labs : [],
        };
    }

    const lines = trimmed.split(/\r?\n/);
    const info = lines[0].trim().split(/\s+/);
    if (info.length < 3) throw new Error('Expected a name and UIN on the first line.');
    const busyTimes = { M: [], T: [], W: [], R: [], F: [] };
    lines.slice(1).forEach((line) => {
        const [days = '', ...time] = line.trim().split(/\s+/);
        if (!time.length) return;
        [...days.toUpperCase()].forEach((day) => {
            if (busyTimes[day]) busyTimes[day].push(time.join(''));
        });
    });

    return {
        firstname: info.slice(0, -2).join(' '),
        lastname: info.at(-2),
        uin: info.at(-1),
        hours: 0,
        busyTimes,
        labs: [],
    };
};

export const mergePeerTeachers = (current, additions) => sortPeerTeachers([
    ...current.filter((pt) => !additions.some((addition) => addition.uin && addition.uin === pt.uin)),
    ...additions,
]);

export const courseRequestOptions = (method, body) => method === 'GET'
    ? { method: 'GET', headers: { Accept: 'application/json' } }
    : { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(JSON.parse(body)) };

export const parseLabs = (text, { excludeGalveston = false } = {}) => {
    const response = JSON.parse(text);
    const source = Array.isArray(response) ? response : [response.data, response.results, response.sections].find(Array.isArray);
    if (!source) throw new Error('The course response must contain a JSON array.');
    const labs = [];

    source.forEach((data) => {
        if (excludeGalveston && data.SWV_CLASS_SEARCH_SITE === 'Galveston') return;
        if (data.SWV_CLASS_SEARCH_SUBJECT !== 'CSCE' || !VALID_LAB_COURSES.includes(data.SWV_CLASS_SEARCH_COURSE)) return;
        if (!data.SWV_CLASS_SEARCH_JSON_CLOB) return;
        const professors = data.SWV_CLASS_SEARCH_INSTRCTR_JSON
            ? JSON.parse(data.SWV_CLASS_SEARCH_INSTRCTR_JSON.replace('\\', '')).map(({ NAME }) => NAME).join('')
            : '';
        const meetings = JSON.parse(data.SWV_CLASS_SEARCH_JSON_CLOB.replace('\\', ''));

        meetings.filter(({ SSRMEET_MTYP_CODE }) => SSRMEET_MTYP_CODE === 'Laboratory').forEach((meeting, index) => {
            const dayFields = [['MON', 'M'], ['TUE', 'T'], ['WED', 'W'], ['THU', 'R'], ['FRI', 'F']];
            const days = dayFields.filter(([field]) => meeting[`SSRMEET_${field}_DAY`]).map(([, day]) => day).join('');
            const begin = new Date(`07/26/2003 ${meeting.SSRMEET_BEGIN_TIME}`);
            const end = new Date(`07/26/2003 ${meeting.SSRMEET_END_TIME}`);
            labs.push({
                course: data.SWV_CLASS_SEARCH_COURSE,
                section: index ? `${data.SWV_CLASS_SEARCH_SECTION}-${index + 1}` : data.SWV_CLASS_SEARCH_SECTION,
                professor: professors,
                time: `${days} ${meeting.SSRMEET_BEGIN_TIME} - ${meeting.SSRMEET_END_TIME}`,
                location: `${meeting.SSRMEET_BLDG_CODE || ''} ${meeting.SSRMEET_ROOM_CODE || ''}`.trim(),
                hours: Math.max(1, (end - begin) / 3600000) * days.length,
                pt: [],
                maxPTs: 1,
            });
        });
    });

    const unique = new Map(labs.map((lab) => [`${lab.course}-${lab.section}`, lab]));
    return addCourseColors([...unique.values()].sort((a, b) =>
        a.course.localeCompare(b.course, undefined, { numeric: true }) || a.section.localeCompare(b.section, undefined, { numeric: true })
    ));
};

export const mergeLabs = (current, additions) => {
    const replacements = new Set(additions.map((lab) => `${lab.course}-${lab.section}`));
    return addCourseColors([...current.filter((lab) => !replacements.has(`${lab.course}-${lab.section}`)), ...additions]);
};

export const getLabConfigurationOptions = (labs) => {
    const honors = labs.filter(({ section }) => /^2\d{2}/.test(section)).map(({ course, section, professor }) => ({
        key: `${course}-${section}`,
        label: `CSCE ${course}-${section}`,
        course,
        section,
        professor: professor?.replace(/\s+\([^)]+\)$/, '') || 'Professor not listed',
    })).sort((a, b) => a.course.localeCompare(b.course, undefined, { numeric: true }) || a.section.localeCompare(b.section, undefined, { numeric: true }));
    const professors = [...new Map(labs.filter(({ professor }) => professor).map(({ course, professor }) => {
        const key = `${course}::${professor}`;
        const name = professor.replace(/\s+\([^)]+\)$/, '');
        return [key, { key, label: `CSCE ${course} - ${name}`, course, professor: name }];
    })).values()].sort((a, b) => a.course.localeCompare(b.course, undefined, { numeric: true }) || a.professor.localeCompare(b.professor));
    const professorCourses = [];
    professors.forEach((option) => {
        const group = professorCourses.at(-1);
        if (group?.course === option.course) group.options.push(option);
        else professorCourses.push({ course: option.course, options: [option] });
    });
    return { honors, professors, professorCourses };
};
