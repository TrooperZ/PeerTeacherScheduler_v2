import Box from '@mui/material/Box';

// Grid that has 3 tabs
// 1. PTs
// 2. Labs that PT can be assigned to
// 3. Assigned Labs for PT
import Grid from '@mui/material/Grid2';

// PT List of PT Cards?
// Lab List of Lab Cards?
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

// PT Cards? - show name, assigned labs, Info will show busy times, notes
// Lab Cards? - show lab, hours, time, Info will show location, professor; Will have two states depending on if assigned or not (+, -)
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';  // wrap everything in Card with this to simulate button
import InfoIcon from '@mui/icons-material/Info';

// PT Info? - busy times, notes
// Lab Info? - location, professor
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import PTCard from './assign-tab-components/PTCard';

const AssignTab = ({peerTeacher}) => {
    return (
        <PTCard peerTeacher={peerTeacher}/>
    )
}

export default AssignTab;