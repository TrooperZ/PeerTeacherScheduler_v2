import { Box } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import { Delete as DeleteIcon } from '@mui/icons-material';

const CustomToolbar = () => {
    return (
        <GridToolbarContainer>
            <GridToolbarExport />
        </GridToolbarContainer>
    );
}

const LabsTab = ({ peerTeachers, setPeerTeachers, labs, setLabs }) => {

    const deleteLab = (id) => () => {
        // console.log(row);
        // peerTeachers = peerTeachers.filter(pt => pt.uin !== uin);
        // setPeerTeachers([...peerTeachers])
        // setLabs(labs.map((lab) => lab.pt === uin ? { ...lab, assigned: false, pt: undefined } : lab));
        let temp = labs.filter(lab => lab.id === id);
        if (temp.pt !== undefined) {
            let updatedPT = peerTeachers.find((pt) => pt.uin === temp.pt);
            updatedPT.hours -= temp.hours;
            setPeerTeachers(peerTeachers.map((pt) => pt.uin === updatedPT.uin? updatedPT : pt));
        }
        labs = labs.filter(lab => lab.id !== id);
        setLabs([...labs]);

    }

    const processRowUpdate = (updatedRow) => {
        setPeerTeachers(peerTeachers.map((pt) => pt.uin === updatedRow.uin ? updatedRow : pt))
        return updatedRow;
    }

    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            minWidth: 50,
            maxWidth: 50,
            editable: false,
            disableExport: true
        },
        {
            field: 'lab',
            headerName: 'Lab',
            headerClassName: 'super-app-theme--header',
            flex: 1,
            // minWidth: 50,
            maxWidth: 110,
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
        },
        {
            field: 'pt',
            headerName: 'Assigned PT',
            type: 'string',
            headerClassName: 'super-app-theme--header',
            flex: 2,
            width: 220,
            valueGetter: (value) => {
                if (!value) {
                    return 'UNASSIGNED';
                }
                const temp = peerTeachers.find((pt) => pt.uin === value);
                if (!temp) {
                    return 'UNASSIGNED';
                }
                return `${temp.firstname} ${temp.lastname}`;
            }
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
                return [
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label={'Delete'}
                        onClick={deleteLab(id)}
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