import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMap from './components/MainMap';

function App() {
  return (
    <Router>
      <Routes>
        {/* :event_uri 부분이 파라미터가 됩니다 */}
        <Route path="/events/:event_uri/map" element={<MainMap />} />
        
        {/* 기본 경로 설정 (옵션) */}
        <Route path="/" element={<div>이벤트를 선택해주세요.</div>} />
      </Routes>
    </Router>
  );
}

export default App; // 이 줄이 없으면 절대 안 됩니다!