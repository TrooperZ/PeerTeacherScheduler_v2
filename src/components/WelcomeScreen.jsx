import { useState } from 'react';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';

const sortLabs = (labs) => labs.sort((a, b) =>
    a.course.localeCompare(b.course) || a.section.localeCompare(b.section)
);

const sortPeerTeachers = (peerTeachers) => peerTeachers.sort((a, b) =>
    a.lastname.localeCompare(b.lastname) || a.firstname.localeCompare(b.firstname)
);

const WelcomeScreen = ({ onDatabaseLoaded, onStartNew }) => {
    const [error, setError] = useState('');

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const database = JSON.parse(await file.text());
            if (!Array.isArray(database.labs) || !Array.isArray(database.peerTeachers)) {
                throw new Error('Invalid database');
            }

            onDatabaseLoaded({
                labs: sortLabs(database.labs),
                peerTeachers: sortPeerTeachers(database.peerTeachers),
                settings: database.settings,
            });
        } catch {
            setError('That file is not a valid Peer Teacher Schedule database.');
            event.target.value = '';
        }
    };

    return (
        <main className="welcome-screen">
            <section className="database-loader" aria-labelledby="database-loader-title">
                <label className="database-upload">
                    <CloudUploadRoundedIcon className="database-upload__icon" />
                    <span id="database-loader-title" className="database-upload__title">
                        Open an existing schedule database
                    </span>
                    <input type="file" accept=".json,application/json" onChange={handleUpload} />
                </label>

                <span className="database-loader__or">or</span>

                <button className="database-loader__button" type="button" onClick={onStartNew}>
                    Create a new database
                </button>

                {error && <p className="database-loader__error" role="alert">{error}</p>}
            </section>
        </main>
    );
};

export default WelcomeScreen;
