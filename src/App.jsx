import './App.css'
import Scheduler from './components/Scheduler'

import {Routes, Route} from 'react-router-dom';

// https://v2.vitejs.dev/guide/static-deploy.html#github-pages
// https://medium.com/@aishwaryaparab1/deploying-vite-deploying-vite-app-to-github-pages-166fff40ffd3

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Scheduler />} />
      </Routes>
    </div>
  );
}

export default App
