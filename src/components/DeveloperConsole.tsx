import { useState, useEffect } from 'react';
import { EventItem, Prefecture, Category } from '../types';
import { Terminal, Shield, Cpu, RefreshCw, Layers } from 'lucide-react';

interface DeveloperConsoleProps {
  eventsCount: number;
  filteredCount: number;
  selectedPrefectures: Prefecture[];
  selectedCategories: Category[];
  selectedPeriod: string;
  weekendRanges: any;
  selectedEvent: EventItem | null;
}

interface LogEntry {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'MAP';
  message: string;
}

export default function DeveloperConsole({
  eventsCount,
  filteredCount,
  selectedPrefectures,
  selectedCategories,
  selectedPeriod,
  weekendRanges,
  selectedEvent,
}: DeveloperConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'dates' | 'json'>('logs');

  // Push system state changes to console logs
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      timestamp,
      type: 'INFO',
      message: `フィルタ適用: 県[${selectedPrefectures.join(',') || '未選択'}] カテゴリ[${selectedCategories.join(',') || '未選択'}] 期間[${selectedPeriod}]`,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 30));
  }, [selectedPrefectures, selectedCategories, selectedPeriod]);

  useEffect(() => {
    if (selectedEvent) {
      const timestamp = new Date().toLocaleTimeString();
      const newLog: LogEntry = {
        timestamp,
        type: 'MAP',
        message: `地図連動: 「${selectedEvent.title}」をフォーカス（緯度: ${selectedEvent.lat}, 経度: ${selectedEvent.lng}）`,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 30));
    }
  }, [selectedEvent]);

  // Initial log on mount
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs([
      { timestamp, type: 'SUCCESS', message: '東海週末イベント探索エンジン 起動完了 (Client-side Only)' },
      { timestamp, type: 'INFO', message: `システムクロック同期: ${new Date().toISOString()}` },
      { timestamp, type: 'INFO', message: `データベースロード完了: 総件数 ${eventsCount}件` },
    ]);
  }, [eventsCount]);

  const clearLogs = () => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs([{ timestamp, type: 'INFO', message: 'コンソールログをクリアしました。' }]);
  };

  return (
    <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs flex flex-col h-[320px] transition-all hover:border-slate-700" id="developer-terminal">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-100 tracking-wider">DEV CONSOLE v2.6.30</span>
          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">LOCAL_DB</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/60 px-4 flex border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'logs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          システムログ
        </button>
        <button
          onClick={() => setActiveTab('dates')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'dates'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          週末演算パラメータ
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'json'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          オブジェクトデータ
        </button>
      </div>

      {/* Console Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1.5 custom-scrollbar bg-slate-950/95">
        {activeTab === 'logs' && (
          <>
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2 items-start leading-relaxed hover:bg-slate-900/50 p-0.5 rounded">
                <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 select-none ${
                    log.type === 'SUCCESS'
                      ? 'text-emerald-400'
                      : log.type === 'WARN'
                      ? 'text-amber-400'
                      : log.type === 'MAP'
                      ? 'text-blue-400'
                      : 'text-sky-400'
                  }`}
                >
                  [{log.type}]
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))}
          </>
        )}

        {activeTab === 'dates' && (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-1.5 text-emerald-400 border-b border-slate-900 pb-1 font-bold">
              <Cpu className="w-3.5 h-3.5" /> <span>週次カレンダー演算結果</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">This Weekend (今週末)</div>
                <div className="text-slate-100 font-bold mt-1 text-[13px]">{weekendRanges?.thisWeekend?.label.split(' ')[1] || '演算中...'}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Start: {weekendRanges?.thisWeekend?.start?.toISOString().split('T')[0]}<br/>
                  End: {weekendRanges?.thisWeekend?.end?.toISOString().split('T')[0]}
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Next Weekend (来週末)</div>
                <div className="text-slate-100 font-bold mt-1 text-[13px]">{weekendRanges?.nextWeekend?.label.split(' ')[1] || '演算中...'}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Start: {weekendRanges?.nextWeekend?.start?.toISOString().split('T')[0]}<br/>
                  End: {weekendRanges?.nextWeekend?.end?.toISOString().split('T')[0]}
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">After Next (再来週末)</div>
                <div className="text-slate-100 font-bold mt-1 text-[13px]">{weekendRanges?.afterWeekend?.label.split(' ')[1] || '演算中...'}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  Start: {weekendRanges?.afterWeekend?.start?.toISOString().split('T')[0]}<br/>
                  End: {weekendRanges?.afterWeekend?.end?.toISOString().split('T')[0]}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>STATE_DUMP (アクティブ)</span>
              </div>
            </div>
            <pre className="text-[11px] text-slate-300 bg-slate-900/80 p-3 rounded-lg overflow-x-auto select-all leading-normal max-h-[180px]">
              {JSON.stringify(
                {
                  metrics: {
                    total_records: eventsCount,
                    filtered_records: filteredCount,
                    render_limit: 10,
                  },
                  active_filters: {
                    prefectures: selectedPrefectures,
                    categories: selectedCategories,
                    period: selectedPeriod,
                  },
                  focused_event: selectedEvent
                    ? {
                        id: selectedEvent.id,
                        title: selectedEvent.title,
                        category: selectedEvent.category,
                        prefecture: selectedEvent.prefecture,
                        coordinates: [selectedEvent.lat, selectedEvent.lng],
                      }
                    : null,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Terminal Footer Actions */}
      <div className="bg-slate-900/80 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>ESTABLISHED ENGINES: OK • NO_EXTERNAL_DEP</span>
        </div>
        <button
          onClick={clearLogs}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors py-0.5 px-2 rounded hover:bg-slate-800"
        >
          <RefreshCw className="w-3 h-3" />
          <span>ログクリア</span>
        </button>
      </div>
    </div>
  );
}
