import { useEffect, useRef, useState } from 'react';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { autoschedule, clearScheduleAssignments, DEFAULT_AUTOSCHEDULER_RULES } from '../../utils/autoschedule';

const RULE_OPTIONS = {
    lab: [
        ['honors-first', 'Honors sections first'],
        ['course-priority', 'Course priority'],
        ['section-priority', 'Section priority'],
    ],
    match: [
        ['professor-match', 'Had this professor'],
        ['preferred-course', 'Preferred PT class'],
        ['balance-hours', 'Honor desired lab hours'],
        ['fewest-sections', 'Fewest assigned sections'],
    ],
};

const RuleSet = ({ title, description, scope, rules, disabled, onChange }) => {
    const options = RULE_OPTIONS[scope];
    const availableOptions = options.filter(([type]) => !rules.some((rule) => rule.type === type));
    const move = (index, direction) => {
        const next = [...rules];
        [next[index], next[index + direction]] = [next[index + direction], next[index]];
        onChange(next);
    };

    return <section className="autoscheduler-rules">
        <header><div><h2>{title}</h2><p>{description}</p></div>
            <select disabled={disabled || !availableOptions.length} value="" aria-label={`Add ${title} rule`} onChange={(event) => {
                const type = event.target.value;
                if (!type) return;
                const rule = type === 'course-priority'
                    ? { type, value: DEFAULT_AUTOSCHEDULER_RULES.lab.find((item) => item.type === type).value }
                    : type === 'section-priority' ? { type, value: '' } : { type };
                onChange([...rules, rule]);
            }}>
                <option value="">{availableOptions.length ? 'Add rule…' : 'All rules added'}</option>
                {availableOptions.map(([type, label]) => <option value={type} key={type}>{label}</option>)}
            </select>
        </header>
        <ol>
            {rules.map((rule, index) => <li key={rule.type}>
                <span className="autoscheduler-rules__number">{index + 1}</span>
                <div><strong>{options.find(([type]) => type === rule.type)?.[1] || rule.type}</strong>
                    {['course-priority', 'section-priority'].includes(rule.type) && <label>Highest to lowest, use = for ties<input disabled={disabled} placeholder={rule.type === 'section-priority' ? '200 > 201 > 500' : undefined} value={rule.value || ''} onChange={(event) => onChange(rules.map((item) => item.type === rule.type ? { ...item, value: event.target.value } : item))} /></label>}
                </div>
                <div className="autoscheduler-rules__actions">
                    <button disabled={disabled || index === 0} type="button" aria-label="Move rule up" onClick={() => move(index, -1)}><ArrowUpwardRoundedIcon /></button>
                    <button disabled={disabled || index === rules.length - 1} type="button" aria-label="Move rule down" onClick={() => move(index, 1)}><ArrowDownwardRoundedIcon /></button>
                    <button disabled={disabled} type="button" aria-label="Remove rule" onClick={() => onChange(rules.filter((item) => item.type !== rule.type))}><DeleteOutlineRoundedIcon /></button>
                </div>
            </li>)}
            {!rules.length && <li className="autoscheduler-rules__empty">No rules. Add one above.</li>}
        </ol>
    </section>;
};

const labKey = (lab) => `${lab.course}-${lab.section}`;

const PerLabRules = ({ labs, peerTeachers, rules, disabled, onChange }) => {
    const [queries, setQueries] = useState({});
    const availableLabs = labs.filter((lab) => !rules.some((rule) => rule.labKey === labKey(lab)));
    const matchingPeerTeachers = (key, field) => {
        const query = (queries[`${key}:${field}`] || '').trim().toLowerCase();
        return peerTeachers.filter((pt) => `${pt.firstname} ${pt.lastname} ${pt.uin}`.toLowerCase().includes(query));
    };
    const updateUin = (key, field, uin, checked) => onChange(rules.map((rule) => {
        if (rule.labKey !== key) return rule;
        const otherField = field === 'preferredUins' ? 'excludedUins' : 'preferredUins';
        return {
            ...rule,
            [field]: checked ? [...(rule[field] || []), uin] : (rule[field] || []).filter((value) => value !== uin),
            [otherField]: checked ? (rule[otherField] || []).filter((value) => value !== uin) : (rule[otherField] || []),
        };
    }));

    return <section className="autoscheduler-lab-rules">
        <header><div><h2>Per-lab rules</h2><p>Prefer or exclude specific peer teachers for individual sections.</p></div>
            <select disabled={disabled || !availableLabs.length} value="" aria-label="Add per-lab rule" onChange={(event) => {
                if (!event.target.value) return;
                onChange([...rules, { labKey: event.target.value, preferredUins: [], excludedUins: [] }]);
            }}>
                <option value="">{availableLabs.length ? 'Add section rule…' : 'All sections configured'}</option>
                {availableLabs.map((lab) => <option value={labKey(lab)} key={labKey(lab)}>CSCE {lab.course} - {lab.section}</option>)}
            </select>
        </header>
        {rules.length > 0 ? <div className="autoscheduler-lab-rules__list">{rules.map((rule) => {
            const lab = labs.find((item) => labKey(item) === rule.labKey);
            if (!lab) return null;
            return <article key={rule.labKey}>
                <header><div><strong>CSCE {lab.course} - {lab.section}</strong><small>{lab.professor || 'Professor not listed'} · {lab.time}</small></div><button disabled={disabled} type="button" aria-label={`Remove rules for CSCE ${lab.course} - ${lab.section}`} onClick={() => onChange(rules.filter((item) => item.labKey !== rule.labKey))}><DeleteOutlineRoundedIcon /></button></header>
                <div className="autoscheduler-lab-rules__choices">
                    {[['preferredUins', 'Prefer'], ['excludedUins', 'Exclude']].map(([field, label]) => <details key={field}>
                        <summary>{label} <span>{rule[field]?.length || 0}</span></summary>
                        <div>
                            <input className="autoscheduler-lab-rules__search" value={queries[`${rule.labKey}:${field}`] || ''} onChange={(event) => setQueries((current) => ({ ...current, [`${rule.labKey}:${field}`]: event.target.value }))} placeholder="Search PTs" aria-label={`Search PTs to ${label.toLowerCase()} for CSCE ${lab.course} - ${lab.section}`} />
                            {matchingPeerTeachers(rule.labKey, field).map((pt) => <label key={pt.uin}><input disabled={disabled} type="checkbox" checked={rule[field]?.includes(pt.uin) || false} onChange={(event) => updateUin(rule.labKey, field, pt.uin, event.target.checked)} /><span><strong>{pt.firstname} {pt.lastname}</strong><small>{pt.uin}</small></span></label>)}
                            {!matchingPeerTeachers(rule.labKey, field).length && <p>No peer teachers match.</p>}
                        </div>
                    </details>)}
                </div>
            </article>;
        })}</div> : <p className="autoscheduler-lab-rules__empty">No section-specific rules. Global rules apply to every lab.</p>}
        <p className="autoscheduler-lab-rules__note">Exclusions affect new matches only. Existing and locked assignments stay in place.</p>
    </section>;
};

const AutoschedulerTab = ({ labs, setLabs, peerTeachers, setPeerTeachers, settings, setSettings, onToggleLock }) => {
    const rules = settings.autoschedulerRules || DEFAULT_AUTOSCHEDULER_RULES;
    const seed = settings.autoschedulerSeed ?? 'schedule-1';
    const labRules = settings.autoschedulerLabRules || [];
    const algorithm = settings.autoschedulerAlgorithm || 'priority';
    const [run, setRun] = useState({ status: 'idle', progress: 0, total: 0, assignments: 0, skippedSlots: 0, changes: [] });
    const timer = useRef(null);

    useEffect(() => () => window.clearInterval(timer.current), []);

    const updateRules = (scope, next) => setSettings((current) => ({
        ...current,
        autoschedulerRules: { ...(current.autoschedulerRules || DEFAULT_AUTOSCHEDULER_RULES), [scope]: next },
    }));

    const clearAssignments = (includeLocked) => {
        const message = includeLocked
            ? 'Clear every assignment, including locked assignments?'
            : 'Clear all unlocked assignments? Locked assignments will stay in place.';
        if (!window.confirm(message)) return;
        const cleared = clearScheduleAssignments({ labs, peerTeachers, includeLocked });
        setLabs(cleared.labs);
        setPeerTeachers(cleared.peerTeachers);
        setRun({ status: 'idle', progress: 0, total: 0, assignments: 0, skippedSlots: 0, changes: [] });
    };

    const start = () => {
        const result = autoschedule({
            labs,
            peerTeachers,
            rules,
            honorsSections: settings.labConfiguration?.honorsSections,
            labRules,
            seed,
            algorithm,
        });
        if (!result.openSlots) {
            setRun({ status: 'complete', progress: 0, total: 0, assignments: 0, skippedSlots: 0, changes: [] });
            return;
        }

        let progress = 0;
        setRun({ status: 'running', progress, total: result.openSlots, assignments: 0, skippedSlots: 0, changes: [] });
        window.clearInterval(timer.current);
        timer.current = window.setInterval(() => {
            progress += 1;
            if (progress < result.openSlots) {
                setRun((current) => ({ ...current, progress }));
                return;
            }
            window.clearInterval(timer.current);
            setLabs(result.labs);
            setPeerTeachers(result.peerTeachers);
            setRun({ status: 'complete', progress: result.openSlots, total: result.openSlots, assignments: result.assignments, skippedSlots: result.skippedSlots, changes: result.changes });
        }, Math.max(20, Math.floor(700 / result.openSlots)));
    };

    return <section className="autoscheduler-view">
        <header className="autoscheduler-view__header">
            <div><span>Scheduling</span><h1>Autoscheduler</h1><p>Fill open lab slots using an editable priority stack. Existing assignments stay in place.</p></div>
            <div className="autoscheduler-view__actions">
                <label className="autoscheduler-seed"><span>Shuffle seed</span><div><input disabled={run.status === 'running'} value={seed} onChange={(event) => setSettings((current) => ({ ...current, autoschedulerSeed: event.target.value }))} /><button disabled={run.status === 'running'} type="button" onClick={() => setSettings((current) => ({ ...current, autoschedulerSeed: crypto.randomUUID().slice(0, 8) }))}>New seed</button></div></label>
                <button className="autoscheduler-view__primary" disabled={run.status === 'running' || !labs.length || !peerTeachers.length} type="button" onClick={start}>Autoschedule</button>
                <div>
                    <button disabled={run.status === 'running' || !labs.some((lab) => lab.pt?.some((uin) => !lab.lockedPTs?.includes(uin)))} type="button" onClick={() => clearAssignments(false)}>Clear Assignments</button>
                    <button className="is-danger" disabled={run.status === 'running' || !labs.some((lab) => lab.pt?.length)} type="button" onClick={() => clearAssignments(true)}>Clear Assignments and Locked Assignments</button>
                </div>
            </div>
        </header>

        <fieldset className="autoscheduler-algorithms" disabled={run.status === 'running'}>
            <legend>Scheduling algorithm</legend>
            <label className={algorithm === 'priority' ? 'is-selected' : ''}>
                <input type="radio" name="autoscheduler-algorithm" value="priority" checked={algorithm === 'priority'} onChange={(event) => setSettings((current) => ({ ...current, autoschedulerAlgorithm: event.target.value }))} />
                <span><strong>Algorithm A</strong><small>Priority order · fills labs using the configured order</small></span>
            </label>
            <label className={algorithm === 'scarcity' ? 'is-selected' : ''}>
                <input type="radio" name="autoscheduler-algorithm" value="scarcity" checked={algorithm === 'scarcity'} onChange={(event) => setSettings((current) => ({ ...current, autoschedulerAlgorithm: event.target.value }))} />
                <span><strong>Algorithm B</strong><small>Scarcity first · fills labs with the fewest available PTs first</small></span>
            </label>
        </fieldset>

        {run.status !== 'idle' && <section className={`autoscheduler-progress is-${run.status}`} aria-live="polite">
            <div><strong>{run.status === 'running' ? 'Matching peer teachers…' : 'Autoschedule complete'}</strong><span>{run.total ? `${run.progress} of ${run.total} open slots checked` : 'No open slots to schedule'}</span></div>
            <progress max={run.total || 1} value={run.progress} />
            {run.status === 'complete' && run.total > 0 && <p>{run.assignments} assignments added · {run.skippedSlots} slots could not be matched</p>}
        </section>}

        {run.status === 'complete' && run.changes.length > 0 && <section className="autoscheduler-results">
            <header><div><h2>New assignments</h2><p>Lock any result that must remain fixed for future scheduling.</p></div><span>{run.changes.length}</span></header>
            <div>{run.changes.map((change) => {
                const lab = labs.find((item) => item.course === change.course && item.section === change.section);
                const pt = peerTeachers.find((item) => item.uin === change.uin);
                if (!lab || !pt) return null;
                const locked = lab.lockedPTs?.includes(pt.uin);
                return <article className={locked ? 'is-locked' : ''} key={`${change.course}-${change.section}-${change.uin}`}>
                    <span><strong>CSCE {lab.course} - {lab.section}</strong><small>{pt.firstname} {pt.lastname}</small></span>
                    <button type="button" aria-label={`${locked ? 'Unlock' : 'Lock'} ${pt.firstname} ${pt.lastname} in CSCE ${lab.course} - ${lab.section}`} onClick={() => onToggleLock(lab, pt)}>{locked ? <LockRoundedIcon /> : <LockOpenRoundedIcon />}{locked ? 'Locked' : 'Lock'}</button>
                </article>;
            })}</div>
        </section>}

        <PerLabRules labs={labs} peerTeachers={peerTeachers} rules={labRules} disabled={run.status === 'running'} onChange={(next) => setSettings((current) => ({ ...current, autoschedulerLabRules: next }))} />

        <div className="autoscheduler-rule-grid">
            <RuleSet title="Lab order" description="Which sections are filled first." scope="lab" rules={rules.lab || []} disabled={run.status === 'running'} onChange={(next) => updateRules('lab', next)} />
            <RuleSet title="PT match order" description="How compatible peer teachers are ranked." scope="match" rules={rules.match || []} disabled={run.status === 'running'} onChange={(next) => updateRules('match', next)} />
        </div>
    </section>;
};

export default AutoschedulerTab;
