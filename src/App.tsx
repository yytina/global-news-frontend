import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainMap from './components/MainMap.tsx';
import ArticleDashboard from './components/ArticleDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<MainMap />} />
        <Route path="/events/:event_uri/map" element={<MainMap />} />
        <Route path="/events/:event_uri/countries/:country_code/articles" element={<ArticleDashboard />} />
      </Routes>
    </Router>
  );
}

export default App; // 이 줄이 없으면 절대 안 됩니다!