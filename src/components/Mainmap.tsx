import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate 추가
import { HighchartsReact } from 'highcharts-react-official';
import Highcharts from 'highcharts/highmaps';
import mapDataWorld from '@highcharts/map-collection/custom/world.topo.json';

const MainMap = () => {
    // 1. URL에서 :event_uri 값을 추출합니다.
    console.log("MainMap Rendered!")
    const { event_uri } = useParams<{ event_uri: string }>();
    const navigate = useNavigate(); // 카드 클릭 시 이동용
    
    const [eventData, setEventData] = useState<any>(null);
    const [top3Events, setTop3Events] = useState<any[]>([]); // Top 3 저장용

    // 💡 /events (또는 event_uri가 없을 때) 판별
    const isTopPage = !event_uri || event_uri === "top";

    // [추가] /events 접속 시 Top 3 데이터를 가져오는 이펙트
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
        // 2. event_uri가 바뀔 때마다 백엔드에 해당 이벤트를 요청합니다.
        console.log(event_uri);
        if (!event_uri || event_uri === "top") return; // "top"일 때는 상세 호출 패스

        console.log(`Fetching data for event: ${event_uri}`);
        
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
    }, [event_uri]); // 👈 event_uri가 변할 때마다 이펙트 실행

    // 💡 [수정] 기존 로딩 방어 조건을 '상세 페이지인데 데이터가 없을 때만'으로 변경
    if (!isTopPage && !eventData) {
        return <div style={{ padding: '20px', color: 'black' }}>데이터를 불러오는 중입니다...</div>;
    }

    // 3. 차트 데이터 구성 (Top 페이지일 때는 빈 배열로 설정하여 기존 스타일 지도 유지)
    const chartData = isTopPage || !eventData
        ? [] 
        : eventData.map_data.map((item: any) => [item.country_code, item.sentiment]);

    // 💡 기존 혜진 님의 스타일 설정을 그대로 유지 (수정 없음)
    const options: Highcharts.Options = {
        title: { text: isTopPage ? "Global News Sentiment Pulse" : (eventData.title_kr || eventData.title_main) },
        colorAxis: {
            min: -1,
            max: 1,
            stops: [
                [0, '#0000FF'],   // 파랑 (낮음)
                [0.5, '#F0F0F0'], // 회색 (중립)
                [1, '#FF0000']    // 빨강 (높음)
            ]
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
        </div>
    );
};

export default MainMap;