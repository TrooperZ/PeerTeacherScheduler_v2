import { useMemo, useState } from 'react';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import { formatChangePath, replayDatabaseHistory, summarizeDatabaseChanges } from '../../utils/databaseHistory';

const sourceLabel = (source) => source === 'autoscheduler' ? 'Autoscheduler' : source === 'manual' ? 'You' : 'Unknown source';

const DiffTab = ({ history, onRestore }) => {
    const [selectedIndex, setSelectedIndex] = useState(history.entries.length - 1);
    const index = Math.min(selectedIndex, history.entries.length - 1);
    const selected = history.entries[index];
    const scopes = useMemo(() => selected ? [...new Set(selected.changes.map(({ path }) => path[0]))] : [], [selected]);
    const before = useMemo(() => index > 0 ? replayDatabaseHistory(history, index - 1) : history.base, [history, index]);
    const after = useMemo(() => selected ? replayDatabaseHistory(history, index) : history.base, [history, index, selected]);
    const events = useMemo(() => selected ? summarizeDatabaseChanges(before, after, selected.changes) : [], [after, before, selected]);

    return (
        <section className="diff-view">
            <header>
                <span>Database history</span>
                <h1>Diff</h1>
                <p>Every saved schedule, person, lab, and setting change in this browser session.</p>
            </header>

            {!selected ? <div className="diff-empty">No changes yet.</div> : (
                <div className="diff-layout">
                    <ol className="diff-timeline" aria-label="Database changes">
                        {history.entries.map((entry, entryIndex) => {
                            const entryScopes = [...new Set(entry.changes.map(({ path }) => path[0]))];
                            return (
                                <li key={`${entry.timestamp}-${entryIndex}`}>
                                    <button className={entryIndex === index ? 'is-active' : ''} type="button" onClick={() => setSelectedIndex(entryIndex)}>
                                        <strong>{sourceLabel(entry.source)}</strong>
                                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                        <small>{entryScopes.map((scope) => scope === 'peerTeachers' ? 'Peer teachers' : scope[0].toUpperCase() + scope.slice(1)).join(', ')}</small>
                                    </button>
                                </li>
                            );
                        }).reverse()}
                    </ol>

                    <section className="diff-details">
                        <header>
                            <div><span>{sourceLabel(selected.source)} · {scopes.join(' · ')}</span><h2>{new Date(selected.timestamp).toLocaleString()}</h2></div>
                            <button type="button" onClick={() => onRestore(replayDatabaseHistory(history, index))}><RestoreRoundedIcon /> Restore this version</button>
                        </header>
                        <div className="diff-changes">
                            {events.map((event, eventIndex) => (
                                <article key={`${event.title}-${eventIndex}`}>
                                    <strong>{event.title}</strong>
                                    <span>{event.detail}</span>
                                    <div className="diff-event-values">
                                        <span><small>Previous</small>{event.before}</span>
                                        <i aria-hidden="true">→</i>
                                        <span><small>Current</small>{event.after}</span>
                                    </div>
                                </article>
                            ))}
                            <details>
                                <summary>Technical details ({selected.changes.length})</summary>
                                {selected.changes.map((change, changeIndex) => (
                                    <article key={`${formatChangePath(change.path)}-${changeIndex}`}>
                                        <code>{formatChangePath(change.path)}</code>
                                        <span>{JSON.stringify(change.before) || 'not set'} → {JSON.stringify(change.after) || 'not set'}</span>
                                    </article>
                                ))}
                            </details>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
};

export default DiffTab;
