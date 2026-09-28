import { Box, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import PeerTeacherDetail from './PeerTeacherDetail';

const formatLabs = (labs = []) => labs
    .map(({ course, section }) => `${course}-${section}`)
    .join(', ');

const PeerTeachersTab = ({ peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT, setup = false }) => {
    const processRowUpdate = (updatedRow, originalRow) => {
        const previous = originalRow;
        const cleanRow = {
            ...updatedRow,
            firstname: updatedRow.firstname.trim(),
            lastname: updatedRow.lastname.trim(),
            uin: String(updatedRow.uin).trim(),
        };
        if (!cleanRow.firstname || !cleanRow.lastname || !cleanRow.uin) throw new Error('First name, last name, and UIN are required.');
        if (peerTeachers.some((peerTeacher) => peerTeacher !== previous && peerTeacher.uin === cleanRow.uin)) throw new Error('UINs must be unique.');
        setPeerTeachers((current) => current.map((peerTeacher) =>
            (peerTeacher._setupFileId || peerTeacher.uin) === (cleanRow._setupFileId || previous?.uin) ? cleanRow : peerTeacher
        ));
        if (previous?.uin && previous.uin !== cleanRow.uin) {
            setLabs?.((current) => current.map((lab) => ({
                ...lab,
                pt: lab.pt?.map((uin) => uin === previous.uin ? cleanRow.uin : uin),
                lockedPTs: lab.lockedPTs?.map((uin) => uin === previous.uin ? cleanRow.uin : uin),
            })));
        }
        return cleanRow;
    };

    const columns = [
        { field: 'uin', headerName: 'UIN', width: 126, editable: true },
        { field: 'firstname', headerName: 'First Name', minWidth: 150, flex: 0.8, editable: true },
        { field: 'lastname', headerName: 'Last Name', minWidth: 150, flex: 0.8, editable: true },
        {
            field: 'hours',
            headerName: 'Assigned Hours',
            type: 'number',
            width: 145,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'labs',
            headerName: 'Labs',
            minWidth: 260,
            flex: 1.5,
            sortable: false,
            valueGetter: (value) => formatLabs(value),
            renderCell: ({ value }) => (
                <span className={value ? 'labs-cell' : 'labs-cell labs-cell--empty'}>
                    {value || 'No labs assigned'}
                </span>
            ),
        },
        {
            field: 'notes',
            headerName: 'Notes',
            minWidth: 180,
            flex: 1,
            editable: true,
            renderCell: ({ value }) => (
                <span className={value ? '' : 'notes-cell--empty'}>{value || 'Add a note'}</span>
            ),
        },
    ];

    if (selectedPT) {
        const currentPeerTeacher = peerTeachers.find(({ uin }) => uin === selectedPT.uin);
        if (currentPeerTeacher) return <PeerTeacherDetail peerTeacher={currentPeerTeacher} labs={labs} onBack={() => setSelectedPT(null)} />;
    }

    return (
        <section className="peer-teachers-view peer-teachers-table-view">
            <header className="view-header">
                <div>
                    <Typography component="h1" className="view-title">{setup ? 'Configure peer teachers' : 'Peer Teachers'}</Typography>
                    <Typography className="view-subtitle">
                        {setup ? 'Double-click a name or UIN to correct it.' : `${peerTeachers.length} ${peerTeachers.length === 1 ? 'Peer Teacher' : 'Peer Teachers'}`}
                    </Typography>
                </div>
            </header>

            <Box className="data-table-shell">
                <DataGrid
                    rows={peerTeachers}
                    columns={columns}
                    getRowId={(row) => row._setupFileId || row.uin}
                    getRowHeight={() => 'auto'}
                    initialState={{
                        sorting: { sortModel: [{ field: 'lastname', sort: 'asc' }] },
                        pagination: { paginationModel: { pageSize: 100 } },
                    }}
                    disableColumnMenu
                    processRowUpdate={processRowUpdate}
                    onCellClick={({ field, row }) => {
                        if (field !== 'notes') setSelectedPT(row);
                    }}
                    onProcessRowUpdateError={(error) => console.error(error)}
                    hideFooterSelectedRowCount
                    pageSizeOptions={[100]}
                    showToolbar
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            csvOptions: {
                                fileName: 'peer-teachers',
                                fields: ['uin', 'firstname', 'lastname', 'hours', 'notes'],
                            },
                        },
                    }}
                    sx={{ border: 0 }}
                />
            </Box>
        </section>
    );
};

export default PeerTeachersTab;
