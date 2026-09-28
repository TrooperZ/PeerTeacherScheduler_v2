export const PT_DAYS = ['M', 'T', 'W', 'R', 'F'];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const snapMinutes = (minutes, step = 15) => Math.round(minutes / step) * step;

export const hasDragIntent = (deltaX, deltaY, threshold = 8) => Math.hypot(deltaX, deltaY) >= threshold;

export const minutesToTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, '0');
    return `${String(hour).padStart(2, '0')}:${minute}`;
};

export const timeToMinutes = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

export const buildPtSubmission = ({ firstName, lastName, uin, desiredLabHours, canPt, wantsPt, busySlots, professors }) => ({
    firstname: firstName.trim(),
    lastname: lastName.trim(),
    uin: uin.trim(),
    desiredLabHours: Number(desiredLabHours),
    classesCanPT: [...canPt].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    preferredClasses: [...wantsPt].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    busyTimes: Object.fromEntries(PT_DAYS.map((day) => [
        day,
        busySlots
            .filter((slot) => slot.day === day)
            .sort((a, b) => a.start - b.start)
            .map((slot) => `${minutesToTime(slot.start)}-${minutesToTime(slot.end)}`),
    ])),
    professorsHad: Object.fromEntries([...canPt].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((course) => [
        course,
        [...(professors[course]?.selected || []), ...(professors[course]?.other?.trim() ? [professors[course].other.trim()] : [])],
    ])),
});
