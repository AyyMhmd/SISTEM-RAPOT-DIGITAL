import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Sistem Rapor Digital</h1>
            <p>Setup Project Tahap 1 Selesai.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
