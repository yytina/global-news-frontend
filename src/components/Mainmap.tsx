import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // URL 파라미터를 읽기 위한 훅
import { HighchartsReact } from 'highcharts-react-official';
import Highcharts from 'highcharts/highmaps';
import mapDataWorld from '@highcharts/map-collection/custom/world.topo.json';

const MainMap = () => {
    // 1. URL에서 :event_uri 값을 추출합니다.
    console.log("MainMap Rendered!")
    const { event_uri } = useParams<{ event_uri: string }>();
    const [eventData, setEventData] = useState<any>(null);
    console.log(event_uri);
    useEffect(() => {
        // 2. event_uri가 바뀔 때마다 백엔드에 해당 이벤트를 요청합니다.
        console.log(event_uri);
        if (!event_uri) return;

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

    if (!eventData) {
        return <div style={{ padding: '20px', color: 'black' }}>데이터를 불러오는 중입니다...</div>;
    }

    // 3. 차트 데이터 구성
    const chartData = eventData.map_data.map((item: any) => [
        item.country_code,
        item.sentiment
    ]);

    const options: Highcharts.Options = {
        title: { text: eventData.title_kr || eventData.title_main },
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
        <div className="p-4">
            <HighchartsReact
                highcharts={Highcharts}
                constructorType={'mapChart'}
                options={options}
            />
        </div>
    );
};

export default MainMap;