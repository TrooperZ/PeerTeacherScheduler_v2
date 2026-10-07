import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import LabsCalendar from './LabsCalendar';
import LabEditor from '../LabEditor';
import { downloadLabsWorkbook } from '../../utils/labsWorkbook';

const LabsTab = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {
    const courses = useMemo(() => [...new Set(labs.map(({ course }) => course))].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true })
    ), [labs]);
    const [view, setView] = useState('table');
    const [course, setCourse] = useState(courses[0] || '');
    const selectedCourse = courses.includes(course) ? course : courses[0] || '';

    const deleteLab = (deletedLab) => {
        setPeerTeachers((current) => current.map((pt) => deletedLab.pt?.includes(pt.uin) ? {
            ...pt,
            hours: pt.hours - deletedLab.hours,
            labs: pt.labs.filter((lab) => lab.course !== deletedLab.course || lab.section !== deletedLab.section),
        } : pt));
        setLabs((current) => current.filter((lab) => lab.course !== deletedLab.course || lab.section !== deletedLab.section));
    };

    const processRowUpdate = (updatedRow) => {
        setLabs((current) => current.map((lab) =>
            lab.course === updatedRow.course && lab.section === updatedRow.section ? updatedRow : lab
        ));
        return updatedRow;
    };

    const updateLab = (previousLab, updatedLab) => {
        setLabs((current) => current.map((lab) => lab === previousLab ? updatedLab : lab));
        if (!previousLab.pt?.length) return;
        setPeerTeachers((current) => current.map((pt) => previousLab.pt.includes(pt.uin) ? {
            ...pt,
            hours: Number(pt.hours || 0) + Number(updatedLab.hours || 0) - Number(previousLab.hours || 0),
            labs: (pt.labs || []).map((lab) => lab.course === previousLab.course && lab.section === previousLab.section
                ? { course: updatedLab.course, section: updatedLab.section }
                : lab),
        } : pt));
    };

    const assignedNames = (uins = []) => peerTeachers
        .filter((pt) => uins.includes(pt.uin))
        .map((pt) => `${pt.firstname} ${pt.lastname}`);

    const columns = [
        { field: 'course', headerName: 'Course', width: 100 },
        { field: 'section', headerName: 'Section', width: 100 },
        { field: 'time', headerName: 'Time', minWidth: 210, flex: 1 },
        { field: 'location', headerName: 'Location', width: 120 },
        { field: 'professor', headerName: 'Professor', minWidth: 190, flex: 1 },
        {
            field: 'pt',
            headerName: 'Assigned PT(s)',
            minWidth: 190,
            flex: 1,
            sortable: false,
            valueGetter: (value) => assignedNames(value).join('\n') || 'UNASSIGNED',
            renderCell: ({ value }) => <span className={value === 'UNASSIGNED' ? 'labs-cell--empty' : ''}>{value === 'UNASSIGNED' ? value : value.replace(/\n/g, ', ')}</span>,
        },
        { field: 'maxPTs', headerName: 'Max PTs', type: 'number', width: 100, editable: true, disableExport: true },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Delete',
            width: 82,
            getActions: ({ row }) => [
                <GridActionsCellItem key="delete" icon={<DeleteOutlineRoundedIcon />} label={`Delete CSCE ${row.course} - ${row.section}`} onClick={() => deleteLab(row)} />,
            ],
        },
    ];

    return (
        <section className="peer-teachers-view labs-view">
            <header className="view-header labs-view__header">
                <div>
                    <Typography component="h1" className="view-title">Labs</Typography>
                    <Typography className="view-subtitle">{labs.length} sections across {courses.length} courses</Typography>
                </div>
                <div className="labs-view__actions">
                    <button className="labs-export" type="button" onClick={() => downloadLabsWorkbook(labs, peerTeachers)} disabled={!labs.length}><DownloadRoundedIcon /> Export Excel</button>
                    <div className="view-switch" role="tablist" aria-label="Labs view">
                        {['table', 'calendar', 'edit'].map((option) => (
                            <button type="button" role="tab" aria-selected={view === option} className={view === option ? 'is-active' : ''} onClick={() => setView(option)} key={option}>
                                {option[0].toUpperCase() + option.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {view === 'table' ? (
                <Box className="data-table-shell">
                    <DataGrid
                        rows={labs}
                        columns={columns}
                        getRowId={(row) => `${row.course}-${row.section}`}
                        getRowHeight={() => 'auto'}
                        initialState={{
                            sorting: { sortModel: [{ field: 'course', sort: 'asc' }] },
                            pagination: { paginationModel: { pageSize: 100 } },
                        }}
                        disableColumnMenu
                        processRowUpdate={processRowUpdate}
                        onProcessRowUpdateError={(error) => console.error(error)}
                        hideFooterSelectedRowCount
                        pageSizeOptions={[100]}
                        showToolbar
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{ toolbar: { csvOptions: {
                            fileName: 'labs',
                            fields: ['course', 'section', 'time', 'location', 'professor', 'pt'],
                        } } }}
                        sx={{ border: 0 }}
                    />
                </Box>
            ) : view === 'calendar' ? (
                <section className="labs-calendar-view" aria-labelledby="labs-calendar-title">
                    <div className="labs-calendar-controls">
                        <div>
                            <h2 id="labs-calendar-title">Course Calendar</h2>
                            <p>{labs.filter((lab) => lab.course === selectedCourse).length} scheduled lab sections</p>
                        </div>
                        <label>Course
                            <select value={selectedCourse} onChange={(event) => setCourse(event.target.value)}>
                                {courses.map((value) => <option value={value} key={value}>CSCE {value}</option>)}
                            </select>
                        </label>
                    </div>
                    {selectedCourse ? <LabsCalendar labs={labs} peerTeachers={peerTeachers} course={selectedCourse} /> : <p className="pt-detail__empty">Upload labs to view the calendar.</p>}
                </section>
            ) : <div className="labs-edit-view"><LabEditor labs={labs} setLabs={setLabs} onUpdate={updateLab} onRemove={deleteLab} /></div>}
        </section>
    );
};

export default LabsTab;
