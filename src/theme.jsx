import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2E4647',
        },
    },
    components: {
        MuiPickersDay: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: '#2E4647',
                        '&:hover': {
                            backgroundColor: '#2E4647',
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                textPrimary: {
                    color: '#2E4647',
                },
            },
        },
        // Add overrides for other components as needed
    },
    mixins: {
        MuiDataGrid: {
            // Pinned columns sections
            pinnedBackground: '#2E4647',
            // Headers, and top & bottom fixed rows
            containerBackground: '#2E4647',
        },
    },
});

export default theme;