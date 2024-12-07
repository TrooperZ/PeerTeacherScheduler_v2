import { Box } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarExport, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from '@mui/x-data-grid';
import { Delete as DeleteIcon } from '@mui/icons-material';

const CustomToolbar = () => {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport 
                csvOptions={{
                    fileName: 'labs',
                }}
            />
        </GridToolbarContainer>
    );
}

const LabsTab = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {

    const getRowId = (row) => {
        return `${row.course} - ${row.section}`;
    }

    const deleteLab = (course, section) => () => {
        // console.log(row);
        // peerTeachers = peerTeachers.filter(pt => pt.uin !== uin);
        // setPeerTeachers([...peerTeachers])
        // setLabs(labs.map((lab) => lab.pt === uin ? { ...lab, assigned: false, pt: undefined } : lab));
        let temp = labs.filter(lab => lab.course === course && lab.section === section);
        const lab = temp[0];
        if (lab.pt !== undefined) {
            for (const pt of peerTeachers) {
                if (lab.pt.includes(pt.uin)) {
                    let updatedPT = pt;
                    updatedPT.hours -= lab.hours;
                    // console.log(updatedPT);
                    setPeerTeachers((prevPeerTeachers) =>
                        prevPeerTeachers.map((pt) => pt.uin === updatedPT.uin ? updatedPT : pt)
                    );
                }
            }
        }
        labs = labs.filter(lab => !(lab.course === course && lab.section === section));
        setLabs([...labs]);
    }

    const processRowUpdate = (updatedRow) => {
        setLabs(labs.map((lab) => (lab.course === updatedRow.course && lab.section === updatedRow.section) ? updatedRow : lab))
        return updatedRow;
    }

    const columns = [
        {
            field: 'course',
            headerName: 'Course',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            minWidth: 80,
            maxWidth: 80,
            editable: false,
            // disableExport: true
        },
        {
            field: 'section',
            headerName: 'Section',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            minWidth: 80,
            maxWidth: 80,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            editable: false,
        },
        {
            field: 'time',
            headerName: 'Time',
            headerClassName: 'super-app-theme--header',
            flex: 2,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            minWidth: 200,
            maxWidth: 450,
            editable: false,
        },
        {
            field: 'location',
            headerName: 'Location',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            // minWidth: 50,
            // maxWidth: 150,
            width: 110,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            editable: false,
        },
        {
            field: 'professor',
            headerName: 'Professor',
            type: 'string',
            headerClassName: 'super-app-theme--header',
            flex: 2,
            width: 220,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'pt',
            headerName: 'Assigned PT(s)',
            type: 'string',
            headerClassName: 'super-app-theme--header',
            flex: 2,
            width: 220,
            align: 'left',
            headerAlign: 'left',
            valueGetter: (value) => {
                // console.log(value);
                if (value.length === 0) {
                    return 'UNASSIGNED';
                }
                let assignedPTs = "";
                // const temp = peerTeachers.find((pt) => pt.uin === value);
                for (const pt of peerTeachers) {
                    // console.log(pt);
                    if (value.includes(pt.uin)) {
                        // console.log(pt);
                        assignedPTs = assignedPTs.concat(`${pt.firstname} ${pt.lastname}\n`);
                    }
                }
                // console.log(assignedPTs);
                if (assignedPTs.length === 0) {
                    return 'UNASSIGNED';
                }
                return assignedPTs.slice(0, assignedPTs.length-1);
            }
        },
        {
            field: 'maxPTs',
            headerName: 'Max PTs',
            type: 'number',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            width: 110,
            align: 'left',
            headerAlign: 'left',
            editable: true,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Delete',
            headerClassName: 'super-app-theme--header',
            flex: 2,
            maxWidth: 75,
            cellClassName: 'actions',
            getActions: ({ id, row }) => {
                // console.log(row);
                return [
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label={'Delete'}
                        onClick={deleteLab(row.course, row.section)}
                    />
                ]
            }
        }
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <strong style={{ fontSize: 24, marginBottom: 16 }}>Labs</strong>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    width: '100%',
                    '& .super-app-theme--header': {
                        backgroundColor: '#2E4647', color: 'white', fontWeight: 'bold'
                    },
                    padding: 0,
                    margin: 0,
                    overflow: 'auto',

                }}
            >
                <div style={{ width: '100%', flex: 1 }}>
                    <DataGrid
                        experimentalFeatures={{ ariaV7: true }}
                        // rows={labs.map((lab, i) => ({...lab, id: i+1}))}
                        rows={labs}
                        columns={columns}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'id', sort: 'asc' }]
                            },
                            pagination: {
                                paginationModel: { pageSize: 100 }
                            }
                        }}
                        getRowId={getRowId}
                        getRowHeight={() => 'auto'} // Dynamic Row Height
                        disableColumnMenu
                        disableExtendRowFullWidth
                        sx={{
                            width: '100%', // Ensures DataGrid takes full width
                            '& .MuiDataGrid-root': {
                                overflowX: 'hidden' // Ensures no horizontal scrollbar is visible
                            },
                            // fix cell spacing
                            '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px', display: 'flex', alignItems: 'center' },
                            '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px', display: 'flex', alignItems: 'center' },
                            '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px', display: 'flex', alignItems: 'center' },
                        }}
                        disableColumnResize
                        editMode='cell'
                        // onCellEditStop={onCellEditStop}
                        processRowUpdate={processRowUpdate}
                        onProcessRowUpdateError={(error) => console.log(error)}
                        hideFooterSelectedRowCount
                        pageSizeOptions={[100]}
                        slots={{
                            toolbar: CustomToolbar
                        }}
                    />
                </div>
            </Box>
        </div>
    )
}

export default LabsTab;