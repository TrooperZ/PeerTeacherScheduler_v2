import { Box, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import { Delete as DeleteIcon } from '@mui/icons-material';

const PeerTeachersTab = ({peerTeachers, setPeerTeachers, labs, setLabs, selectedPT, setSelectedPT}) => {

    const getRowId = (row) => {
        return row.uin;
    }

    const numberFormatter = (num) => {
        return num.toLocaleString('en-US', {
            useGrouping: false
        })
    }

    const deletePT = (uin) => () => {
        peerTeachers = peerTeachers.filter(pt => pt.uin !== uin);
        setPeerTeachers([ ...peerTeachers ])
        setLabs(labs.map((lab) => {
            if (lab.pt.includes(uin)) {
                let a = lab.pt.filter((b) => b !== uin);
                return {...lab, pt: a};
            }
            return lab;
        }));
        if (selectedPT && uin === selectedPT.uin) {
            setSelectedPT(null);
        }
    }

    const processRowUpdate = (updatedRow) => {
        setPeerTeachers(peerTeachers.map((pt) => pt.uin === updatedRow.uin ? updatedRow : pt))
        return updatedRow;
    }

    const columns = [
        {
            field: 'uin',
            headerName: 'UIN',
            headerClassName: 'super-app-theme--header',
            // flex: 1,
            // minWidth: 50,
            // maxWidth: 110,
            width: 130,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            editable: false,
            // valueFormatter: numberFormatter,
        },
        {
            field: 'firstname',
            headerName: 'First Name',
            headerClassName: 'super-app-theme--header',
            // flex: 2,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            // minWidth: 200,
            // maxWidth: 200,
            width: 200,
            editable: false,
        },
        {
            field: 'lastname',
            headerName: 'Last Name',
            headerClassName: 'super-app-theme--header',
            // flex: 2,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            // minWidth: 220,
            // maxWidth: 220,
            width: 220,
            editable: false,
        },
        {
            field: 'hours',
            headerName: 'Assigned Hours',
            headerClassName: 'super-app-theme--header',
            // flex: 1,
            // minWidth: 150,
            // maxWidth: 150,
            width: 150,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            editable: false,
            valueFormatter: numberFormatter
        },
        {
            field: 'notes',
            headerName: 'Notes',
            headerClassName: 'super-app-theme--header',
            // flex: 1,
            // minWidth: 50,
            // maxWidth: 150,
            width: 195,
            type: 'string',
            align: 'left',
            headerAlign: 'left',
            editable: true,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Delete',
            headerClassName: 'super-app-theme--header',
            // flex: 2,
            width: 75,
            cellClassName: 'actions',
            getActions: ({id, row}) => {
                return [
                    <GridActionsCellItem 
                        icon={<DeleteIcon />}
                        label={'Delete'}
                        onClick={deletePT(id)}
                    />
                ]
            }
        }
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            {/* <strong style={{ fontSize: 24, marginBottom: 16}}>
                Peer Teachers
            </strong> */}
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                Peer Teachers
            </Typography>
            <Box
                sx={{
                    // display: 'flex',
                    // flexDirection: 'column',
                    // flex: 1,
                    // width: '100%', 
                    height: 600,
                    width: '1000px',
                    '& .super-app-theme--header': {
                        backgroundColor: '#800000', color: '#FFFFF0', fontWeight: 'bold'
                    },
                    // '& .MuiDataGrid-cell--editing': {
                    //     backgroundColor: '#800000', color: '#FFFFF0'
                    // },
                    // '& .MuiDataGrid-cellInput': {
                    //     backgroundColor: '#800000', color: '#FFFFF0', fontWeight: 'bold'
                    // },
                    padding: 0,
                    margin: 0,
                    overflow: 'auto',
                }}
            >
                {/* <div style={{ width: '100%', flex: 1 }}> */}
                    <DataGrid 
                        experimentalFeatures={{ariaV7: true}}
                        rows={peerTeachers}
                        columns={columns}
                        initialState={{
                            sorting: {
                                sortModel: [{field: 'lastname', sort: 'asc'}]
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
                            // '& .MuiDataGrid-root': {
                            //     overflowX: 'hidden' // Ensures no horizontal scrollbar is visible
                            // },
                            // fix cell spacing
                            '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px', display: 'flex', alignItems: 'center' },
                            '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px', display: 'flex', alignItems: 'center' },
                            '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px', display: 'flex', alignItems: 'center' },
                            // idk why this is the one for editing, but okay
                            // took way too long to find this :|
                            '.MuiDataGrid-cell.MuiDataGrid-cell--editing': {
                                backgroundColor: '#800000', color: '#FFFFF0'
                            },
                            '.MuiDataGrid-cell .MuiDataGrid-cell--editing': {
                                backgroundColor: '#800000', color: '#FFFFF0'
                            },
                        }}
                        disableColumnResize
                        editMode='cell'
                        // onCellEditStop={onCellEditStop}
                        processRowUpdate={processRowUpdate}
                        onProcessRowUpdateError={(error) => console.log(error)}
                        hideFooterSelectedRowCount
                        pageSizeOptions={[100]}
                        slots={{
                            toolbar: GridToolbar,
                        }}
                    />
                {/* </div> */}
            </Box>
        </div>
    )
}

export default PeerTeachersTab;