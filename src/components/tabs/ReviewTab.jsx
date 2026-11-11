import { useState } from 'react';
import { reviewSchedule } from '../../utils/scheduleReview';
import { downloadPTWorkbook } from '../../utils/labsWorkbook';

const ReviewTab = ({ labs, peerTeachers, settings, baseline }) => {
    const [onlyDifferences, setOnlyDifferences] = useState(false);
    const { issues, open, workload } = reviewSchedule(labs, peerTeachers, settings.autoschedulerLabRules);
    const previous = new Map((baseline?.labs || []).map((lab) => [`${lab.course}-${lab.section}`, lab]));
    const changes = labs.flatMap((lab) => {
        const old = previous.get(`${lab.course}-${lab.section}`);
        const before = old?.pt || [], after = lab.pt || [];
        const describe = (uin) => { const pt = peerTeachers.find((item) => item.uin === uin) || baseline?.peerTeachers?.find((item) => item.uin === uin); return pt ? `${pt.firstname} ${pt.lastname}` : uin; };
        return [...after.filter((uin) => !before.includes(uin)).map((uin) => `CSCE ${lab.course}-${lab.section}: added ${describe(uin)}`), ...before.filter((uin) => !after.includes(uin)).map((uin) => `CSCE ${lab.course}-${lab.section}: removed ${describe(uin)}`)];
    });
    for (const lab of baseline?.labs || []) if (!labs.some((item) => item.course === lab.course && item.section === lab.section)) for (const uin of lab.pt || []) changes.push(`CSCE ${lab.course}-${lab.section}: removed assignment for ${baseline.peerTeachers.find((pt) => pt.uin === uin)?.firstname || uin} (section removed)`);
    return <section className="schedule-review"><header><h1>Schedule review</h1><p>Check issues and workloads before sharing the schedule.</p><button type="button" onClick={() => downloadPTWorkbook(labs, peerTeachers, changes)}>Export PT schedule and changes</button></header>
        <h2>Checks ({issues.length})</h2>{issues.length ? <ul>{issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul> : <p>No conflicts found by these checks.</p>}
        <h2>Unfilled sections ({open.length})</h2>{open.length ? open.map((item) => <details key={item.label}><summary>{item.label}: {item.missing} open</summary>{item.candidates.length ? <ul>{item.candidates.map((candidate, i) => <li key={i}>{candidate.name}: {candidate.reason}</li>)}</ul> : <p>No peer teachers loaded.</p>}</details>) : <p>All slots are filled.</p>}
        <h2>Workload</h2><label><input type="checkbox" checked={onlyDifferences} onChange={(event) => setOnlyDifferences(event.target.checked)} /> Show only above or below target</label><table><thead><tr><th>Peer teacher</th><th>Assigned hours</th><th>Desired hours</th><th>Difference</th></tr></thead><tbody>{workload.filter((row) => !onlyDifferences || (row.target !== null && row.hours !== row.target)).map((row, i) => <tr key={i}><td>{row.name}</td><td>{row.hours}</td><td>{row.target ?? 'Not set'}</td><td>{row.target === null ? '-' : row.hours - row.target}</td></tr>)}</tbody></table>
        <h2>Changes since last JSON export or load ({changes.length})</h2>{changes.length ? <ul>{changes.map((change, i) => <li key={i}>{change}</li>)}</ul> : <p>No assignment changes.</p>}
    </section>;
};
export default ReviewTab;
