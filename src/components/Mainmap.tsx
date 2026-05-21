import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { HighchartsReact } from 'highcharts-react-official';
import Highcharts from 'highcharts/highmaps';
import mapDataWorld from '@highcharts/map-collection/custom/world.topo.json';
import { COUNTRY_NAME_MAP } from '../constants';

const MainMap = () => {
    // 🎯 환경 변수 설정
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    
    console.log("MainMap Rendered!")
    const { event_uri } = useParams<{ event_uri: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // 날짜 상태 관리 (서버 응답값 기준)
    const [targetDate, setTargetDate] = useState<string | null>(null);
    const [eventData, setEventData] = useState<any>(null);
    const [top3Events, setTop3Events] = useState<any[]>([]);
    
    const [selectedCountryData, setSelectedCountryData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const isTopPage = !event_uri || event_uri === "top";

    // 🎯 통합 데이터 페칭 로직
    useEffect(() => {
        const query = searchParams.toString();
        const queryString = query ? `?${query}` : "";

        if (isTopPage) {
            fetch(`${API_BASE}/events/top${queryString}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setTop3Events(data.slice(0, 3));
                        setTargetDate(data[0].date); // 👈 서버 데이터 기준으로만 변경
                    }
                })
                .catch(err => console.error("Top Events Fetch Error:", err));
        } else {
            fetch(`${API_BASE}/events/${event_uri}/map-data`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === "SUCCESS") {
                        setEventData(data);
                        setTargetDate(data.date); // 👈 서버 데이터 기준으로만 변경
                    }
                })
                .catch(err => console.error("Network Error:", err));
        }
    }, [isTopPage, event_uri, searchParams, API_BASE]);

    // 2. 개별 이벤트 데이터 로드 시에도 targetDate 동기화
    useEffect(() => {
        if (!event_uri || event_uri === "top") return;
        fetch(`http://127.0.0.1:8000/events/${event_uri}/map-data`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "SUCCESS") {
                    setEventData(data);
                }
            });
    }, [event_uri]);

    // 1. 컴포넌트 내부에서 날짜 포맷팅 함수 정의
    const getKstDate = (utcDateString: string) => {
        // UTC 날짜를 Date 객체로 생성
        const date = new Date(utcDateString + 'T00:00:00Z');
        // 한국 시간(KST)으로 변환 후 포맷팅
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
    };

    // 2. 변수 선언
    const formattedKstDate = eventData?.date ? getKstDate(eventData.date) : "Loading...";

    useEffect(() => {
        if (!isTopPage) return;
        fetch(`http://127.0.0.1:8000/events/top`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTop3Events(data.slice(0, 3));
                }
            })
            .catch(err => console.error("Top Events Fetch Error:", err));
    }, [isTopPage]);

    useEffect(() => {
        if (!event_uri || event_uri === "top") return;
        
        fetch(`http://127.0.0.1:8000/events/${event_uri}/map-data`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "SUCCESS") {
                    setEventData(data);
                } else {
                    console.error("Analysis not ready:", data.message);
                }
            })
            .catch(err => console.error("Network Error:", err));
    }, [event_uri]);

    if (!isTopPage && !eventData) {
        return <div style={{ padding: '20px', color: 'black' }}>데이터를 불러오는 중입니다...</div>;
    }

    const chartData = isTopPage || !eventData
        ? [] 
        : eventData.map_data.map((item: any) => [item.country_code, item.sentiment]);

    // 🎯 [신규] 국가 클릭 시 아까 뚫어놓은 백엔드 상세 API를 호출하는 핸들러
    const handleCountryClick = (countryCode: string) => {
        if (!event_uri) return;
        
        fetch(`${API_BASE}/events/${event_uri}/countries/${countryCode.toLowerCase()}`)
            .then(res => {
                if (!res.ok) throw new Error("No data");
                return res.json();
            })
            .then(data => {
                setSelectedCountryData(data);
                setIsModalOpen(true);
            })
            .catch(err => console.error(err));
    };

    const options: Highcharts.Options = {
        title: { text: isTopPage ? "" : (eventData.title_kr || eventData.title_main) },
        colorAxis: {
            min: -1,
            max: 1,
            stops: [
                [0, '#0000FF'],   // 파랑
                [0.5, '#F0F0F0'], // 회색
                [1, '#FF0000']    // 빨강
            ]
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        // 🎯 [신규] Highcharts Map의 국가 클릭 리스너 연결
                        click: function () {
                            const countryCode = this['hc-key']; // 'fr', 'tr', 'gb' 등 추출
                            if (countryCode) {
                                handleCountryClick(countryCode);
                            }
                        }
                    }
                }
            }
        },
        series: [{
            type: 'map',
            mapData: mapDataWorld,
            data: chartData,
            joinBy: 'hc-key',
            name: 'Sentiment Index',
            allAreas: true,
            tooltip: { valueDecimals: 2 }
        }]
    };

    return (
        <div className="p-4" style={{ position: 'relative', width: '100%', height: '100vh' }}>
            {/* 🎯 글로벌 상단 내비게이션 바 */}
            <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            {/* 왼쪽: 브랜드 */}
            <div 
                onClick={() => navigate('/events')} 
                className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer select-none hover:opacity-80 transition"
            >
                Global News Sentimental Pause
            </div>

            {/* 중앙: 데이터 컨텍스트 (브랜드와 버튼 사이에서 닻 역할을 합니다) */}
            <span 
                className="hidden md:flex text-[10px] text-slate-500 uppercase tracking-widest items-center gap-1 cursor-default transition group relative"
            >
                {/* 텍스트 */}
                As of {targetDate ? targetDate : "Loading..."} (UTC)
                
                {/* ⓘ 아이콘을 직접 배치하고 hover 시에만 툴팁이 나타나도록 설계 */}
                <span className="relative flex items-center justify-center w-3 h-3 border border-slate-600 rounded-full text-[8px] text-slate-400 cursor-help">
                    i
                </span>

                {/* 🎯 커스텀 툴팁 (물음표 툴팁 대신 깔끔한 박스 표시) */}
                <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    한국 시간(KST) 기준: {targetDate ? getKstDate(targetDate) : "Loading..."}
                </div>
            </span>

            {/* 오른쪽: 내비게이션 */}
            <button 
                onClick={() => navigate('/events')}
                className="text-xs font-medium px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
                Top3 Events
            </button>
            </header>

            {/* 이벤트 타이틀 텍스트 배정 */}
            <div className="text-center my-6">
              <h2 className="text-xl font-bold text-white max-w-3xl mx-auto leading-snug">
                Video showing far-right Israeli minister taunting Gaza flotilla activists sparks global outcry
              </h2>
            </div>

            {/* 💡 [Overlay] /events로 들어왔을 때만 지도 위에 뜨는 Top 3 블록 */}
            {isTopPage && top3Events.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: '40px',
                    zIndex: 10,
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {top3Events.map((event, idx) => {
                        const isNegative = event.avg_sentiment < 0;
                        return (
                            <div 
                                key={event.uri}
                                onClick={() => navigate(`/events/${event.uri}/map`)}
                                style={{
                                    padding: '16px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                    color: 'white'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
                                    <span style={{ color: '#888' }}>Rank {idx + 1}</span>
                                    <span style={{ 
                                        fontWeight: 'bold', 
                                        color: isNegative ? '#ff4d4f' : '#52c41a' 
                                    }}>
                                        {Math.abs(Math.round(event.avg_sentiment * 100))}% {isNegative ? 'Negative' : 'Positive'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '14px', margin: 0, lineHeight: '1.4', fontWeight: 600 }}>
                                    {event.title_main}
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span>Articles: {event.size}</span>
                                    <span>Score: {event.avg_sentiment.toFixed(3)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 메인 지도 */}
            <HighchartsReact
                highcharts={Highcharts}
                constructorType={'mapChart'}
                options={options}
            />

            {/* 🎯 [신규] 국가 상세 정보 모달 레이어 (클릭 시에만 팝업) */}
            {isModalOpen && selectedCountryData && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }} onClick={() => setIsModalOpen(false)}>
                    
                    {/* 모달 바디 (바깥 클릭 시 닫히되 내부 클릭 시 안 닫히게 방어) */}
                    <div style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '16px',
                        width: '420px', maxWith: '90%', color: 'black', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* 닫기 버튼 */}
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}
                        >✕</button>

                        {/* 내용물 바인딩 */}
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                            {COUNTRY_NAME_MAP[selectedCountryData.country_code.toLowerCase()] || selectedCountryData.country_code} Response Analysis
                        </h2>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>해당 일자: {selectedCountryData.date}</span>

                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />

                        {/* 메인 리포트 요약 (국문) */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>AI 정세 보고서</h4>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#333', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                {selectedCountryData.analysis_summary_kr}
                            </p>
                        </div>

                        {/* 2. [신규 추가] National Interest 섹션 */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>National Interest</h4>
                            <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4', color: '#444', fontStyle: 'italic', padding: '8px 12px', borderLeft: '3px solid #4f46e5', backgroundColor: '#f0f5ff' }}>
                                {selectedCountryData.national_interest}
                            </p>
                        </div>

                        {/* 5대 지수 간이 스코어 보드 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>Media Metrics</h4>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>감정 (Sentiment):</span>
                                <strong style={{ color: selectedCountryData.score_sentiment < 0 ? '#ff4d4f' : '#52c41a' }}>{selectedCountryData.score_sentiment.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>객관성 (Objectivity):</span>
                                <strong>{selectedCountryData.score_objectivity.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>신뢰도 (Credibility):</span>
                                <strong>{selectedCountryData.score_credibility.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>선정성 (Sensationalism):</span>
                                <strong style={{ color: selectedCountryData.score_sensationalism > 0.6 ? '#faad14' : '#595959' }}>{selectedCountryData.score_sensationalism.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>긴급성 (Urgency):</span>
                                <strong>{selectedCountryData.score_urgency.toFixed(2)}</strong>
                            </div>
                            
                            {/* 전략적 프레임은 아래에 별도로 강조 */}
                            <div style={{ marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                <div style={{ fontSize: '11px', color: '#888' }}>Strategic Frame:</div>
                                <div style={{ color: '#2f54eb', fontWeight: 600, fontSize: '12px' }}>{selectedCountryData.strategic_frame}</div>
                            </div>
                        </div>
                        {/* 🎯 "Show articles" 버튼 컴포넌트 구역 교정 */}
                        <button
                          onClick={() => {
                            // 1. selectedCountryData가 존재하고 내부 프로퍼티가 정상 확보되었는지 체크
                            if (selectedCountryData && selectedCountryData.country_code) {
                              
                              // 2. [해결 핵심] code 변수를 명확하게 상수로 선언 및 소문자 처리
                              const code = selectedCountryData.country_code.toLowerCase();
                              
                              // 3. 템플릿 리터럴로 완성된 라우팅 패스로 푸시
                              navigate(`/events/${event_uri}/countries/${code}/articles`);
                            } else {
                              console.warn("⚠️ selectedCountryData 혹은 country_code 데이터가 소실되었습니다.", selectedCountryData);
                            }
                          }}
                          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition"
                        >
                          Show articles
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default MainMap;