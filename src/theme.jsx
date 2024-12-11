import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#FFFFF0',
        },
    },
    components: {
        MuiPickersDay: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: '#FFFFF0',
                        '&:hover': {
                            backgroundColor: '#FFFFF0',
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                textPrimary: {
                    color: '#FFFFF0',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    color: '#FFFFF0',
                    '&.Mui-selected': {
                        color: '#FFFFF0', // Selected Tab color
                        backgroundColor: '#800000', // Maroon background for selected Tab
                    },
                    '&:hover': {
                        backgroundColor: '#660000', // Maroon background on hover
                    },
                }
            }
        },
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    backgroundColor: '#800000', // Set the DataGrid background to maroon
                    color: '#FFFFF0', // Set the text color of the DataGrid to light off-white
                },
                columnHeaders: {
                    backgroundColor: '#800000', // Maroon background for column headers
                    color: '#FFFFF0', // Light off-white text for column headers
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold', // Optional: bold column header text
                    },
                },
                row: {
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#5b0000', // Darker maroon for odd rows
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#660000', // Slightly lighter maroon for even rows
                    },
                    '&:hover': {
                        backgroundColor: '#800000', // Maroon background on row hover
                    },
                },
                cell: {
                    color: '#FFFFF0', // Light off-white text color for all cells
                    '&.Mui-selected': {
                        backgroundColor: '#8b0000', // Darker maroon for selected cells
                        color: '#FFFFF0', // Keep light off-white text for selected cells
                    },
                },
                selectedRow: {
                    backgroundColor: '#8b0000', // Darker maroon for selected row
                },
                footer: {
                    backgroundColor: '#800000', // Maroon background for footer
                    color: '#FFFFF0', // Light off-white text for footer
                    '& .MuiDataGrid-footerContainer': {
                        backgroundColor: '#800000', // Maroon background for the footer container
                    },
                    '& .MuiPaginationItem-root': {
                        color: '#FFFFF0', // Light off-white color for pagination items in footer
                        '&.Mui-selected': {
                            backgroundColor: '#8b0000', // Darker maroon for selected pagination items
                        },
                        '&:hover': {
                            backgroundColor: '#5b0000', // Darker maroon for pagination item hover state
                        },
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    '& .MuiTypography-root': {
                        color: '#000000', // Set text color inside Card to black
                    },
                    backgroundColor: '#FFFFF0'
                }
            }
        }
        // Add overrides for other components as needed
    },
    mixins: {
        MuiDataGrid: {
            // Pinned columns sections
            pinnedBackground: '#800000',
            // Headers, and top & bottom fixed rows
            containerBackground: '#800000',
        },
    },
    typography: {
        allVariants: {
            color: '#FFFFF0', // Change the color of all text elements
        },
    },
});

export default theme;