import { labs } from '../../scraped-labs.json';

export const COURSE_CATALOG = Object.fromEntries(
    [...new Set(labs.map(({ course }) => course))].map((course) => [
        course,
        [...new Set(labs.filter((lab) => lab.course === course).map(({ professor }) => professor).filter(Boolean))].sort(),
    ]),
);
