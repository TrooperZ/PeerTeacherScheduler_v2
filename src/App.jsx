import './App.css'
import Scheduler from './components/Scheduler'
import PtDataGenerator from './components/PtDataGenerator'

import { Routes, Route } from 'react-router-dom';

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Scheduler />} />
        <Route path="/pt-data-generator" element={<PtDataGenerator />} />
      </Routes>
    </div>
  );
}

export default App
