import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

const UnassignedLabCard = ({lab, selectedLab, setSelectedLab}) => {

    // console.log('hi');

    const isSelectedLab = () => {
        return (selectedLab && lab.course === selectedLab.course && lab.section === selectedLab.section)
    }

    const handleCardClick = () => {
        if (isSelectedLab()) {
            setSelectedLab(null);
        }
        else {
            setSelectedLab(lab);
        }
    }
    
    return (
        <Card 
            sx={{
                backgroundColor: isSelectedLab() ? '#30000B' : '#660000',
                '& .MuiTypography-root': {
                    color: '#FFFFF0', // Set text color inside Card to black
                },
                width: '90px',
                display: 'flex'
            }}
        >
            <CardActionArea
                sx={{
                    alignItems: 'center',
                    outline: 'none',
                    '&:focus': {
                        outline: 'none', // Remove focus outline
                    },
                }}
                onClick={handleCardClick}
            >
                <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                    {`CSCE ${lab.course} - ${lab.section}`}
                </Typography>
            </CardActionArea>
        </Card>
    )
}

export default UnassignedLabCard;