import { createTheme } from '@mui/material/styles';

const colors = {
    background: '#17191d',
    surface: '#202329',
    surfaceRaised: '#292d34',
    border: '#353a43',
    text: '#f5f2f3',
    muted: '#a9adb5',
    maroon: '#7b2338',
    maroonHover: '#932d48',
};

const theme = createTheme({
    typography: {
        fontFamily: 'Lato, sans-serif',
    },
    palette: {
        mode: 'dark',
        primary: {
            main: colors.maroon,
            contrastText: colors.text,
        },
        background: {
            default: colors.background,
            paper: colors.surface,
        },
        text: {
            primary: colors.text,
            secondary: colors.muted,
        },
        divider: colors.border,
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 650,
                },
                containedPrimary: {
                    '&:hover': { backgroundColor: colors.maroonHover },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    color: colors.muted,
                    '&.Mui-selected': {
                        color: colors.text,
                        backgroundColor: colors.maroon,
                    },
                    '&:hover': {
                        color: colors.text,
                        backgroundColor: colors.surfaceRaised,
                    },
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                },
                columnHeaders: {
                    color: colors.text,
                    backgroundColor: colors.surfaceRaised,
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
                },
                row: {
                    '&:nth-of-type(odd)': { backgroundColor: colors.surface },
                    '&:nth-of-type(even)': { backgroundColor: '#24272d' },
                    '&:hover': { backgroundColor: '#30232a' },
                },
                cell: {
                    color: colors.text,
                    borderColor: colors.border,
                    '&.Mui-selected': { backgroundColor: colors.maroon },
                },
                footerContainer: {
                    color: colors.text,
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                },
                toolbarContainer: {
                    backgroundColor: colors.surfaceRaised,
                    '& .MuiButton-root, & .MuiSvgIcon-root': { color: colors.text },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    color: colors.text,
                    backgroundColor: colors.surfaceRaised,
                    '& .MuiTypography-root': { color: colors.text },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: { backgroundColor: colors.surface },
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: { color: 'currentColor' },
            },
        },
    },
    mixins: {
        MuiDataGrid: {
            pinnedBackground: colors.surfaceRaised,
            containerBackground: colors.surfaceRaised,
        },
    },
});

export default theme;
