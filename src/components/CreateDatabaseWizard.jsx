import { useMemo, useRef, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PeerTeachersTab from './tabs/PeerTeachersTab';
import LabEditor from './LabEditor';
import { courseRequestOptions, getLabConfigurationOptions, mergeLabs, mergePeerTeachers, parseLabs, parsePeerTeacher } from '../utils/importData';
import { addCourseColors } from '../utils/schedule';

const HOWDY_URL = 'https://howdy.tamu.edu/api/course-sections';
const HOWDY_PROXY_URL = '/api/howdy-course-sections';
const DEFAULT_REQUEST_BODY = `{
  "endRow": 0,
  "publicSearch": "Y",
  "startRow": 0,
  "termCode": "202631"
}`;
const STEPS = ['Upload peer teachers', 'Configure PTs', 'Load labs', 'Configure labs', 'Preview'];

const CreateDatabaseWizard = ({ peerTeachers, setPeerTeachers, labs, setLabs, onCancel, onComplete }) => {
    const [step, setStep] = useState(0);
    const [furthestStep, setFurthestStep] = useState(0);
    const [ptFiles, setPtFiles] = useState([]);
    const [labLoad, setLabLoad] = useState({ status: 'idle' });
    const [requestUrl, setRequestUrl] = useState(HOWDY_URL);
    const [requestMethod, setRequestMethod] = useState('POST');
    const [requestBody, setRequestBody] = useState(DEFAULT_REQUEST_BODY);
    const [excludeGalveston, setExcludeGalveston] = useState(true);
    const [selectedPT, setSelectedPT] = useState(null);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({ separateHonors: true, separateProfessors: false, honorsSections: [], professorGroups: [] });
    const ptInput = useRef(null);
    const labInput = useRef(null);
    const labResponse = useRef('');

    const configurationOptions = useMemo(() => getLabConfigurationOptions(labs), [labs]);
    const coloredLabs = useMemo(() => addCourseColors(labs, settings), [labs, settings]);
    const ptReady = peerTeachers.length > 0 && peerTeachers.every((pt) => pt.firstname?.trim() && pt.lastname?.trim() && pt.uin?.trim())
        && new Set(peerTeachers.map(({ uin }) => uin)).size === peerTeachers.length;

    const goTo = (next) => {
        setError('');
        setStep(next);
        setFurthestStep((current) => Math.max(current, next));
    };

    const addPtFiles = async (event) => {
        const files = [...event.target.files];
        event.target.value = '';
        if (!files.length) return;
        const queued = files.map((file) => ({ id: crypto.randomUUID(), name: file.name, status: 'waiting', progress: 0 }));
        setPtFiles((current) => [...current, ...queued]);
        setError('');

        for (let index = 0; index < files.length; index += 1) {
            const row = queued[index];
            setPtFiles((current) => current.map((item) => item.id === row.id ? { ...item, status: 'uploading', progress: 35 } : item));
            try {
                const pt = { ...parsePeerTeacher(await files[index].text()), _setupFileId: row.id };
                setPeerTeachers((current) => mergePeerTeachers(current, [pt]));
                setPtFiles((current) => current.map((item) => item.id === row.id ? { ...item, status: 'complete', progress: 100 } : item));
            } catch (uploadError) {
                setPtFiles((current) => current.map((item) => item.id === row.id ? { ...item, status: 'error', progress: 100, error: uploadError.message } : item));
            }
        }
    };

    const removePtFile = (id) => {
        setPtFiles((current) => current.filter((file) => file.id !== id));
        setPeerTeachers((current) => current.filter((pt) => pt._setupFileId !== id));
    };

    const initializeLabSettings = (nextLabs) => {
        const options = getLabConfigurationOptions(nextLabs);
        setSettings((current) => ({
            ...current,
            honorsSections: current.separateHonors ? options.honors.map(({ key }) => key) : [],
            professorGroups: current.separateProfessors ? options.professors.map(({ key }) => key) : [],
        }));
    };

    const toggleConfiguration = (field, key, checked) => {
        const enabledField = field === 'honorsSections' ? 'separateHonors' : 'separateProfessors';
        setSettings((current) => {
            const selections = checked ? [...new Set([...current[field], key])] : current[field].filter((item) => item !== key);
            return { ...current, [field]: selections, [enabledField]: selections.length > 0 };
        });
    };

    const fetchLabs = async (event) => {
        event.preventDefault();
        try {
            const url = new URL(requestUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS URL.');
            const options = courseRequestOptions(requestMethod, requestBody);
            setLabLoad({ status: 'loading', source: url.href === HOWDY_URL ? 'Howdy' : url.hostname });
            const response = await fetch(url.href === HOWDY_URL ? HOWDY_PROXY_URL : url, options);
            if (!response.ok) throw new Error(`The server returned ${response.status}.`);
            const responseText = await response.text();
            const imported = parseLabs(responseText, { excludeGalveston });
            if (!imported.length) throw new Error('The response contained no supported CSCE labs.');
            labResponse.current = responseText;
            setLabs(imported);
            initializeLabSettings(imported);
            setLabLoad({ status: 'complete', source: url.hostname, count: imported.length });
        } catch (loadError) {
            setLabLoad({ status: 'error', error: loadError.message });
        }
    };

    const uploadLabs = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setLabLoad({ status: 'loading', source: file.name });
        setError('');
        try {
            const responseText = await file.text();
            const imported = parseLabs(responseText, { excludeGalveston });
            if (!imported.length) throw new Error('No supported CSCE labs were found.');
            labResponse.current = responseText;
            const merged = mergeLabs(labs, imported);
            setLabs(merged);
            initializeLabSettings(merged);
            setLabLoad({ status: 'complete', source: file.name, count: imported.length });
        } catch (uploadError) {
            setLabLoad({ status: 'error', error: uploadError.message });
        }
    };

    const downloadLabResponse = () => {
        const url = URL.createObjectURL(new Blob([labResponse.current], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'course-sections-response.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const removeLab = (_, index) => {
        const nextLabs = labs.filter((__, labIndex) => labIndex !== index);
        const options = getLabConfigurationOptions(nextLabs);
        setLabs(nextLabs);
        setSettings((current) => ({
            ...current,
            honorsSections: current.honorsSections.filter((key) => options.honors.some((option) => option.key === key)),
            professorGroups: current.professorGroups.filter((key) => options.professors.some((option) => option.key === key)),
        }));
    };

    const next = () => {
        if (step === 0 && !peerTeachers.length) return setError('Upload at least one peer teacher file.');
        if (step === 1 && !ptReady) return setError('Every peer teacher needs a unique UIN, first name, and last name.');
        if (step === 2 && !labs.length) return setError('Load course data before continuing.');
        if (step === 3 && (!labs.length || labs.some((lab) => !String(lab.course).trim() || !String(lab.section).trim()))) return setError('Every lab needs a course and section.');
        if (step === STEPS.length - 1) {
            onComplete({
                settings: { labConfiguration: settings },
                peerTeachers: peerTeachers.map((pt) => {
                    const clean = { ...pt };
                    delete clean._setupFileId;
                    return clean;
                }),
                labs: addCourseColors(labs.map((lab) => {
                    const clean = { ...lab };
                    delete clean._setupLabId;
                    return clean;
                }), settings),
            });
            return;
        }
        goTo(step + 1);
    };

    const summary = useMemo(() => ({
        courses: new Set(labs.map(({ course }) => course)).size,
        professors: new Set(labs.map(({ professor }) => professor).filter(Boolean)).size,
    }), [labs]);

    return (
        <main className="setup-wizard">
            <header className="setup-wizard__header">
                <button type="button" className="setup-wizard__close" onClick={onCancel}><CloseRoundedIcon /> Exit setup</button>
                <div><span>New database</span><strong>{step + 1} of {STEPS.length}</strong></div>
            </header>

            <nav className="setup-steps" aria-label="Database setup progress">
                {STEPS.map((label, index) => (
                    <button type="button" className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} disabled={index > furthestStep} onClick={() => goTo(index)} key={label}>
                        <span>{index < step ? <CheckRoundedIcon /> : index + 1}</span>{label}
                    </button>
                ))}
            </nav>

            <section className={`setup-stage setup-stage--${step}`}>
                {step === 0 && <>
                    <header className="setup-stage__intro"><span>Peer teacher files</span><h1>Upload peer teachers</h1><p>Add the configured JSON files collected.</p></header>
                    <button className="setup-dropzone" type="button" onClick={() => ptInput.current?.click()}>
                        <CloudUploadRoundedIcon /><strong>Choose peer teacher files</strong><span>JSON files from the PT configuration form</span>
                    </button>
                    <input ref={ptInput} hidden type="file" accept=".json,.txt,application/json,text/plain" multiple onChange={addPtFiles} />
                    {ptFiles.length > 0 && <div className="setup-file-list">
                        <div className="setup-file-list__heading"><strong>{ptFiles.length} files</strong><button type="button" onClick={() => ptInput.current?.click()}>Add more</button></div>
                        {ptFiles.map((file) => <article className={`setup-file setup-file--${file.status}`} key={file.id}>
                            <div><strong>{file.name}</strong><span>{file.error || file.status}</span></div>
                            <div className="setup-file__progress"><i style={{ width: `${file.progress}%` }} /></div>
                            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removePtFile(file.id)}><DeleteOutlineRoundedIcon /></button>
                        </article>)}
                    </div>}
                </>}

                {step === 1 && <PeerTeachersTab setup peerTeachers={peerTeachers} setPeerTeachers={setPeerTeachers} labs={labs} setLabs={setLabs} selectedPT={selectedPT} setSelectedPT={setSelectedPT} />}

                {step === 2 && <>
                    <header className="setup-stage__intro"><span>Class data</span><h1>Load labs</h1><p>Fetch data from Howdy and edit if needed. If you cannot, manually make the request and upload the data.</p></header>
                    <div className="lab-recovery">
                        <form className="lab-request" onSubmit={fetchLabs}>
                            <div className="lab-request__top">
                                <label>Method<select value={requestMethod} onChange={(event) => setRequestMethod(event.target.value)}><option>GET</option><option>POST</option></select></label>
                                <label>Request URL<input required type="url" value={requestUrl} onChange={(event) => setRequestUrl(event.target.value)} /></label>
                            </div>
                            <label>Request body<textarea spellCheck="false" value={requestBody} onChange={(event) => setRequestBody(event.target.value)} /></label>
                            <label className="lab-request__checkbox"><input type="checkbox" checked={excludeGalveston} onChange={(event) => setExcludeGalveston(event.target.checked)} /><span><strong>Exclude Galveston sections</strong><small>Uses the campus listed in the Howdy response.</small></span></label>
                            <div className="lab-request__actions"><span>{requestMethod === 'GET' ? 'GET requests do not send a body.' : 'The body must be valid JSON.'}</span><button type="submit" disabled={labLoad.status === 'loading'}>Fetch course data</button></div>
                        </form>
                        {labLoad.status === 'loading' && <div className="lab-loading" role="status"><i /><strong>{labLoad.source === 'Howdy' ? 'Loading course data from Howdy' : 'Loading course data'}</strong><span>{labLoad.source !== 'Howdy' ? labLoad.source : 'This may take a moment.'}</span></div>}
                        {labLoad.status === 'complete' && <details className="setup-lab-upload setup-file--complete">
                            <summary><div><strong>Course data ready</strong><span>{labLoad.count} labs loaded from {labLoad.source}</span></div><span className="setup-lab-upload__toggle"><CheckRoundedIcon /> View response data</span></summary>
                            <div className="setup-lab-upload__response-heading"><span>Parsed lab data</span><button type="button" onClick={downloadLabResponse}>Download full response</button></div>
                            <pre aria-label="Parsed course response data">{JSON.stringify(labs, null, 2)}</pre>
                        </details>}
                        {labLoad.status === 'error' && <div className="lab-recovery__error" role="alert"><strong>Course data could not be loaded.</strong><span>{labLoad.error}</span></div>}
                        <div className="lab-recovery__divider"><span>or use a saved response</span></div>
                        <button className="setup-dropzone setup-dropzone--compact" type="button" onClick={() => labInput.current?.click()}><CloudUploadRoundedIcon /><strong>Choose response file</strong><span>JSON returned by the course-sections API</span></button>
                        <input ref={labInput} hidden type="file" accept=".json,application/json" onChange={uploadLabs} />
                    </div>
                </>}

                {step === 3 && <>
                    <header className="setup-stage__intro setup-stage__intro--compact"><span>Lab details</span><h1>Configure labs</h1><p>Select a lab to review or correct its imported details.</p></header>
                    <LabEditor labs={labs} setLabs={setLabs} displayLabs={coloredLabs} onRemove={removeLab} />
                    <section className="lab-configuration-view">
                        <header><span>Database grouping</span><h2>Lab configurations</h2><p>Choose exactly which honors sections and course–professor groups should remain separate.</p></header>
                        <div className="lab-configuration-groups">
                            <article className="lab-configuration-group">
                                <header><label className="lab-configuration-master"><input type="checkbox" checked={settings.separateHonors} onChange={(event) => setSettings((current) => ({ ...current, separateHonors: event.target.checked, honorsSections: event.target.checked ? configurationOptions.honors.map(({ key }) => key) : [] }))} /><span><strong>Separate honors from regular</strong><small>Sections numbered 2xx</small></span></label><span>{settings.honorsSections.length} of {configurationOptions.honors.length} selected</span></header>
                                <div className="lab-configuration-list lab-configuration-list--honors">
                                    {configurationOptions.honors.map((option) => <label key={option.key}><input type="checkbox" checked={settings.honorsSections.includes(option.key)} onChange={(event) => toggleConfiguration('honorsSections', option.key, event.target.checked)} /><span><strong>{option.label}</strong><small>{option.professor}</small></span></label>)}
                                    {!configurationOptions.honors.length && <p>No 2xx honors sections found.</p>}
                                </div>
                            </article>
                            <article className="lab-configuration-group">
                                <header><label className="lab-configuration-master"><input type="checkbox" checked={settings.separateProfessors} onChange={(event) => setSettings((current) => ({ ...current, separateProfessors: event.target.checked, professorGroups: event.target.checked ? configurationOptions.professors.map(({ key }) => key) : [] }))} /><span><strong>Separate class by professor</strong><small>Course-specific professor groups</small></span></label><span>{settings.professorGroups.length} of {configurationOptions.professors.length} selected</span></header>
                                <div className="lab-configuration-list lab-configuration-list--professors">
                                    {configurationOptions.professorCourses.map((group) => <section className="lab-professor-course" key={group.course}><h3>CSCE {group.course}</h3><div>{group.options.map((option) => <label key={option.key}><input type="checkbox" checked={settings.professorGroups.includes(option.key)} onChange={(event) => toggleConfiguration('professorGroups', option.key, event.target.checked)} /><span>{option.professor}</span></label>)}</div></section>)}
                                    {!configurationOptions.professors.length && <p>No professors found.</p>}
                                </div>
                            </article>
                        </div>
                    </section>
                </>}

                {step === 4 && <>
                    <header className="setup-stage__intro"><span>Final review</span><h1>Ready to create the database</h1><p>Confirm the imported records and lab grouping preferences. You can go back now; setup closes after creation.</p></header>
                    <div className="setup-preview">
                        <article><span>Peer teachers</span><strong>{peerTeachers.length}</strong><small></small></article>
                        <article><span>Labs</span><strong>{labs.length}</strong><small>{summary.courses} courses · {summary.professors} professors</small></article>
                        <article><span>Lab configurations</span><strong>{settings.honorsSections.length} honors sections</strong><small>{settings.professorGroups.length} course–professor groups separated</small></article>
                    </div>
                </>}
            </section>

            <footer className="setup-wizard__footer">
                <div>{error && <p role="alert">{error}</p>}</div>
                {step > 0 && <button className="setup-button setup-button--back" type="button" onClick={() => goTo(step - 1)}><ArrowBackRoundedIcon /> Back</button>}
                <button className="setup-button setup-button--next" type="button" onClick={next}>{step === STEPS.length - 1 ? 'Create database' : 'Next'} <ArrowForwardRoundedIcon /></button>
            </footer>
        </main>
    );
};

export default CreateDatabaseWizard;
