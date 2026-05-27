import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Newspaper, Globe, ArrowLeft, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { COUNTRY_NAME_MAP } from '../constants';
import { getArticleList } from '../api/endpoints';

// 백엔드 데이터 타입 정의
interface Article {
  uri: string;
  date: string;
  url: string;
  title: string;
  lang_code: string;
  analysis_status: string;
  score_sentiment: number;
  score_objectivity: number;
  score_urgency: number;
  score_credibility: number;
  score_sensationalism: number;
  analysis_summary_en: string;
  analysis_summary_kr: string;
}

interface ApiResponse {
  event_title: string;
  event_uri: string;
  country_code: string;
  total_count: number;
  articles: Article[];
}

export default function ArticleDashboard() {
  const { event_uri, country_code } = useParams<{ event_uri: string; country_code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // 1. URL 파라미터를 즉시 사용 (data가 없어도 바로 국가명 표시 가능)
  const countryName = COUNTRY_NAME_MAP[country_code?.toLowerCase() ?? ''] || "Global";

  useEffect(() => {
    if (!event_uri || !country_code) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: resData } = await getArticleList(event_uri, country_code);
        setData(resData);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [event_uri, country_code]);

  // 2. 가드 절 (로딩 및 데이터 없음 처리)
  if (loading) return <div className="p-8 text-center text-slate-400">Loading analysis insights...</div>;
  if (!data || data.articles.length === 0) return <div className="p-8 text-center text-slate-400">No articles analyzed for this country.</div>;

  // ... 이후 렌더링 로직 (여기서부터는 data가 null이 아님이 보장됨)
  // 전체 기사 평균 지표 계산 (상단 요약 뷰 레이어용)
  const avgMetric = (key: keyof Article) => 
    (data.articles.reduce((acc, art) => acc + (art[key] as number), 0) / data.total_count).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
    
    {/* 🎯 [통합] 지도 페이지와 100% 동기화된 글로벌 공통 헤더 바 */}
    <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
      <div 
        onClick={() => navigate('/events')} 
        className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer select-none hover:opacity-80 transition"
      >
        Global News Sentiment Pulse
      </div>
      <button 
        onClick={() => navigate('/events')}
        className="text-xs font-medium px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
      >
        Top3 Events
      </button>
    </header>

    {/* 🎯 대시보드 전용 서브 헤더 (뒤로가기 버튼 + 현재 분석 중인 국가 컨텍스트 배치) */}
    <div className="flex items-center gap-4 mt-4 mb-6">
      <button 
        onClick={() => navigate(-1)} 
        className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center shrink-0"
        title="이전 페이지(지도)로 돌아가기"
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <div className="flex items-center gap-2 text-sm text-indigo-400">
      <Globe size={14} /> 
      <span className="font-medium text-white">{countryName} Perspective</span> 
      <span className="text-slate-500">on</span>
      {/* 백엔드에서 넘겨준 event_title을 사용 */}
      <span className="font-semibold text-white">{data.event_title}</span>
    </div>
      </div>
    </div>

      {/* 2. 요약 미디어 메트릭 카드 블록 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Total Volume</div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Newspaper className="text-indigo-400" size={20} /> {data.total_count} articles
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Avg Sentiment</div>
          <div className={`text-2xl font-bold mt-1 ${Number(avgMetric('score_sentiment')) < 0 ? 'text-sentiment-negative' : 'text-sentiment-positive'}`}>
            {avgMetric('score_sentiment')}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Avg Objectivity</div>
          <div className="text-2xl font-bold text-white mt-1">{avgMetric('score_objectivity')}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Avg Credibility</div>
          <div className="text-2xl font-bold text-white mt-1">{avgMetric('score_credibility')}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Avg Sensationalism</div>
          <div className="text-2xl font-bold text-sentiment-negative mt-1">{avgMetric('score_sensationalism')}</div>
        </div>
      </div>

      {/* 3. 메인 기사 목록 테이블 / 아코디언 컴포넌트 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
          <BarChart3 size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-200">Analyzed Sources List</h2>
        </div>
        
        <div className="divide-y divide-slate-800">
          {data.articles.map((article) => {
            const isExpanded = expandedArticle === article.uri;
            return (
              <div key={article.uri} className="transition hover:bg-slate-900/60">
                {/* 기사 요약 헤더 행 */}
                {/* 리스트 로우 헤더 (클릭 시 아코디언 토글) */}
                <div 
                onClick={() => setExpandedArticle(isExpanded ? null : article.uri)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400">{article.date}</span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-indigo-950/50 border border-indigo-900 text-indigo-300 rounded uppercase">{article.lang_code}</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 hover:text-indigo-400 transition text-[15px] block whitespace-normal break-words">
                    {article.title}
                    </h3>
                </div>
                
                {/* 🎯 [수정] 5대 지표 스코어 보드 가로 배치 (반응형 대응 hidden sm:flex) */}
                <div className="flex items-center gap-4 shrink-0 hidden sm:flex text-center font-mono">
                    
                    {/* 1. Sentiment */}
                    <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans mb-0.5">Sentiment</div>
                    <span className={`text-sm font-bold ${article.score_sentiment < 0 ? 'text-sentiment-negative' : 'text-sentiment-positive'}`}>
                        {article.score_sentiment > 0 ? `+${article.score_sentiment.toFixed(1)}` : article.score_sentiment.toFixed(1)}
                    </span>
                    </div>

                    {/* 2. Objectivity */}
                    <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans mb-0.5">Objectivity</div>
                    <span className="text-sm font-semibold text-slate-300">{article.score_objectivity.toFixed(1)}</span>
                    </div>

                    {/* 3. Urgency */}
                    <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans mb-0.5">Urgency</div>
                    <span className="text-sm font-semibold text-amber-400">{article.score_urgency.toFixed(1)}</span>
                    </div>

                    {/* 4. Credibility */}
                    <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans mb-0.5">Credibility</div>
                    <span className="text-sm font-semibold text-slate-300">{article.score_credibility.toFixed(1)}</span>
                    </div>

                    {/* 5. Sensationalism */}
                    <div className="w-20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans mb-0.5">Sensation</div>
                    <span className="text-sm font-semibold text-purple-400">{article.score_sensationalism.toFixed(1)}</span>
                    </div>

                    {/* 아코디언 체브론 아이콘 간격 제어 */}
                    <div className="text-slate-500 pl-4 shrink-0 flex items-center">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
                </div>

                {/* 클릭 시 확장되는 상세 분석 모달 보드 */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-1 bg-slate-950/40 border-t border-slate-800/50 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 데이터 요약 레포트 섹션 */}
                    <div className="lg:col-span-2 space-y-4 pt-3">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">AI 국문 분석 요약</h4>
                        <p className="text-sm leading-relaxed text-slate-300">{article.analysis_summary_kr}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">English Framework Summary</h4>
                        <p className="text-sm leading-relaxed text-slate-400 font-serif italic">{article.analysis_summary_en}</p>
                      </div>
                      <div className="pt-2">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 hover:bg-indigo-950/60 border border-indigo-900/60 px-3 py-1.5 rounded-lg transition"
                        >
                          Open Original Source <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {/* 5대 지표 레이더 데이터 점수 디스플레이 */}
                    <div className="bg-slate-900/80 border border-slate-800/60 p-4 rounded-xl space-y-3 self-start mt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-2">Quantified Metrics</h4>
                      {[
                        { label: '감정 지수 (Sentiment)', val: article.score_sentiment, range: '-1.0 ~ 1.0', c: article.score_sentiment < 0 ? 'bg-rose-500' : 'bg-emerald-500', min: -1 },
                        { label: '객관성 지수 (Objectivity)', val: article.score_objectivity, range: '0.0 ~ 1.0', c: 'bg-indigo-500', min: 0 },
                        { label: '긴급성 지수 (Urgency)', val: article.score_urgency, range: '0.0 ~ 1.0', c: 'bg-amber-500', min: 0 },
                        { label: '신뢰성 지수 (Credibility)', val: article.score_credibility, range: '0.0 ~ 1.0', c: 'bg-cyan-500', min: 0 },
                        { label: '선정성 지수 (Sensationalism)', val: article.score_sensationalism, range: '0.0 ~ 1.0', c: 'bg-purple-500', min: 0 },
                      ].map((m) => {
                        // 프로그레스 바 퍼센트 계산 프로토콜 (-1~1 범위를 0~100%로 보정하는 식 포함)
                        const pct = m.min === -1 ? ((m.val + 1) / 2) * 100 : m.val * 100;
                        return (
                          <div key={m.label} className="text-xs">
                            <div className="flex justify-between text-slate-400 font-medium mb-1">
                              <span>{m.label}</span>
                              <span className="font-mono text-slate-200 font-bold">{m.val.toFixed(2)}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${m.c}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}