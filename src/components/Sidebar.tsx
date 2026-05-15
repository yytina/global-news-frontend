import React from 'react';

// 부모(App.tsx)로부터 전달받을 데이터의 타입 정의
interface SidebarProps {
  countryData: {
    name: string;
    code: string;
    value?: number;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ countryData }) => {
  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-extrabold text-gray-800">Analysis Panel</h2>
        <p className="text-xs text-gray-500 mt-1">Real-time AI Sentiment Index</p>
      </div>

      {!countryData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌍</span>
          </div>
          <p className="text-gray-400 italic text-sm">
            지도의 국가를 선택하여<br />현지 여론 지형도를 확인하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* 국가 헤더 */}
          <div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Selected Country</span>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{countryData.name}</h3>
          </div>

          {/* 감성 지수 카드 */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Sentiment Score</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    (countryData.value || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.abs((countryData.value || 0) * 100)}%` }}
                ></div>
              </div>
              <span className="font-mono font-bold text-lg">
                {countryData.value?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* AI 요약 섹션 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="text-indigo-500">✦</span> AI Insight Summary
            </h4>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-sm text-indigo-900 leading-relaxed">
              <strong>{countryData.name}</strong>의 최근 주요 뉴스는 안보와 경제 협력에 집중되어 있습니다. 
              AI 분석 결과, 해당 사안에 대해 긍정적인 기대감이 60% 이상으로 나타나며, 
              이는 향후 시장 변동성에 영향을 줄 것으로 보입니다.
            </div>
          </div>

          {/* 하단 버튼 */}
          <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">
            상세 뉴스 리스트 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;