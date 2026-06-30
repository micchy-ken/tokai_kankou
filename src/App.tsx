import { useState, useMemo, useEffect } from 'react';
import { rawEvents } from './data';
import { resolveEventDates, getWeekendRanges, formatDateJP } from './utils/dateUtils';
import { EventItem, Prefecture, Category, PeriodFilter } from './types';
import MapComponent from './components/MapComponent';
import DeveloperConsole from './components/DeveloperConsole';
import {
  MapPin,
  Calendar,
  Filter,
  Search,
  Star,
  Compass,
  SlidersHorizontal,
  Utensils,
  Trees,
  Beer,
  Sparkles,
  RefreshCw,
  Map,
  ListFilter,
  Clock,
  Phone,
  Check,
  ChevronDown
} from 'lucide-react';

const PREFECTURES: Prefecture[] = ['愛知県', '岐阜県', '静岡県', '長野県'];
const CATEGORIES: Category[] = ['食事', '観光', '酒', 'イベント'];

const CATEGORY_ICONS: Record<Category, any> = {
  食事: Utensils,
  観光: Trees,
  酒: Beer,
  イベント: Sparkles,
};

const CATEGORY_COLOR_CLASSES: Record<Category, { bg: string; text: string; border: string; accent: string }> = {
  食事: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
    text: 'text-rose-600',
    border: 'border-rose-400',
    accent: 'bg-rose-500',
  },
  観光: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    text: 'text-emerald-600',
    border: 'border-emerald-400',
    accent: 'bg-emerald-500',
  },
  酒: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
    text: 'text-amber-600',
    border: 'border-amber-400',
    accent: 'bg-amber-500',
  },
  イベント: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
    text: 'text-blue-600',
    border: 'border-blue-400',
    accent: 'bg-blue-500',
  },
};

export default function App() {
  // 1. Calculate dynamic date parameters relative to current system date
  const baseDate = useMemo(() => new Date(), []);
  const weekendRanges = useMemo(() => getWeekendRanges(baseDate), [baseDate]);
  
  // Resolve event date ranges at runtime so they always match active weekends
  const resolvedEvents = useMemo(() => resolveEventDates(rawEvents, baseDate), [baseDate]);

  // 2. Filter states
  const [selectedPrefectures, setSelectedPrefectures] = useState<Prefecture[]>(PREFECTURES);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(CATEGORIES);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Pagination & Interaction states
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'list' | 'map'>('list');

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedPrefectures, selectedCategories, selectedPeriod, searchQuery]);

  // Toggle prefectures
  const togglePrefecture = (pref: Prefecture) => {
    setSelectedPrefectures((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  // Toggle categories
  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Reset all filters to original state
  const resetFilters = () => {
    setSelectedPrefectures(PREFECTURES);
    setSelectedCategories(CATEGORIES);
    setSelectedPeriod('all');
    setSearchQuery('');
    setSelectedEventId(null);
  };

  // Filter computation
  const filteredEvents = useMemo(() => {
    return resolvedEvents.filter((event) => {
      // Prefecture Filter
      if (selectedPrefectures.length > 0 && !selectedPrefectures.includes(event.prefecture)) {
        return false;
      }

      // Category Filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.category)) {
        return false;
      }

      // Keyword Search (Title, Description, Location, Access)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        const matchesLoc = event.location.toLowerCase().includes(query);
        const matchesAccess = event.access.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesAccess) {
          return false;
        }
      }

      // Period Selection
      if (selectedPeriod !== 'all') {
        const targetRange =
          selectedPeriod === 'this_weekend'
            ? weekendRanges.thisWeekend
            : selectedPeriod === 'next_weekend'
            ? weekendRanges.nextWeekend
            : weekendRanges.afterWeekend;

        if (targetRange && event.resolvedStartDate && event.resolvedEndDate) {
          const eventStart = new Date(event.resolvedStartDate);
          const eventEnd = new Date(event.resolvedEndDate);
          const rangeStart = targetRange.start;
          const rangeEnd = targetRange.end;

          // Check for overlapping date ranges
          const overlaps = eventStart <= rangeEnd && eventEnd >= rangeStart;
          if (!overlaps) return false;
        }
      }

      return true;
    });
  }, [resolvedEvents, selectedPrefectures, selectedCategories, selectedPeriod, searchQuery, weekendRanges]);

  // Paginated/displayed subset
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const hasMore = filteredEvents.length > visibleCount;

  // Active highlighted event detail object
  const activeSelectedEvent = useMemo(() => {
    return resolvedEvents.find((e) => e.id === selectedEventId) || null;
  }, [resolvedEvents, selectedEventId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col" id="app-root-container">
      {/* 1. Sleek Modern Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 shadow-sm" id="main-app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10">
              <Compass className="w-6 h-6 text-emerald-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900" id="app-title-h1">
                  東海週末イベント検索
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                  東海4県
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                愛知・岐阜・静岡・長野の観光、グルメ、地酒、イベントを瞬時にスマート検索
              </p>
            </div>
          </div>

          {/* Quick Stats Block - Developer Theme Inline Accent */}
          <div className="flex items-center gap-4 bg-slate-950 text-slate-100 py-1.5 px-3.5 rounded-xl border border-slate-800/60 shadow-inner font-mono text-[11px] max-sm:w-full max-sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">STATUS:</span>
              <span className="font-bold text-slate-200">DB ONLINE</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400">FOUND:</span>{' '}
              <span className="font-bold text-emerald-400">{filteredEvents.length}</span>
              <span className="text-slate-500">/{resolvedEvents.length} 件</span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Responsive Mobile Tab Bar */}
      <div className="md:hidden sticky top-[73px] z-40 bg-white border-b border-slate-200 flex" id="mobile-navigation-tabs">
        <button
          onClick={() => setActiveMobileView('list')}
          className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeMobileView === 'list'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500'
          }`}
          id="mobile-tab-list"
        >
          <ListFilter className="w-4 h-4" />
          <span>イベント一覧 ({filteredEvents.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileView('map')}
          className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeMobileView === 'map'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500'
          }`}
          id="mobile-tab-map"
        >
          <Map className="w-4 h-4" />
          <span>地図で探す</span>
        </button>
      </div>

      {/* 3. Main Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 min-h-[calc(100vh-160px)]" id="main-content-layout">
        
        {/* LEFT COLUMN: FILTERS AND LISTING (7 cols) */}
        <section
          className={`col-span-1 md:col-span-7 flex flex-col gap-6 ${
            activeMobileView === 'list' ? 'block' : 'max-md:hidden'
          }`}
          id="left-listings-section"
        >
          {/* A. Search and Filter Panel (White, Clean, Pristine) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5" id="filter-panel-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">検索フィルター</h2>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                id="reset-filters-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>条件をクリア</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">
                キーワードで検索
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="例：城、ひつまぶし、日本酒、温泉..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  id="search-input"
                />
              </div>
            </div>

            {/* Grid for Prefectures & Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Prefecture Selector Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                  県を選択
                </label>
                <div className="grid grid-cols-2 gap-2" id="prefecture-checkbox-group">
                  {PREFECTURES.map((pref) => {
                    const isSelected = selectedPrefectures.includes(pref);
                    return (
                      <button
                        key={pref}
                        onClick={() => togglePrefecture(pref)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all select-none hover:bg-slate-50 active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                        id={`pref-checkbox-${pref}`}
                      >
                        <span>{pref}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selector Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                  カテゴリ
                </label>
                <div className="grid grid-cols-2 gap-2" id="category-checkbox-group">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    const colors = CATEGORY_COLOR_CLASSES[cat];
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 transition-all select-none hover:bg-slate-50 active:scale-95 ${
                          isSelected
                            ? `${colors.accent} text-white border-transparent shadow-sm`
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                        id={`cat-checkbox-${cat}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : colors.text}`} />
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Dynamic Period Dropdown Selector */}
            <div className="border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>期間を選択（日付自動演算）</span>
              </label>
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as PeriodFilter)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                  id="period-select-dropdown"
                >
                  <option value="all">📅 全期間（すべての週末とシーズンイベント）</option>
                  <option value="this_weekend">🗓️ {weekendRanges.thisWeekend.label}</option>
                  <option value="next_weekend">🗓️ {weekendRanges.nextWeekend.label}</option>
                  <option value="after_weekend">🗓️ {weekendRanges.afterWeekend.label}</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>

          {/* B. Filtered Event Listing */}
          <div className="flex flex-col gap-4" id="event-listing-container">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                検索結果: {filteredEvents.length}件中 {Math.min(filteredEvents.length, visibleCount)}件を表示
              </div>
              {selectedEventId && (
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="text-xs text-slate-600 hover:text-slate-950 underline underline-offset-2"
                >
                  フォーカスをクリア
                </button>
              )}
            </div>

            {/* Event List */}
            {displayedEvents.length > 0 ? (
              <div className="space-y-4" id="events-grid-stack">
                {displayedEvents.map((event) => {
                  const isSelected = event.id === selectedEventId;
                  const catColors = CATEGORY_COLOR_CLASSES[event.category];
                  const CatIcon = CATEGORY_ICONS[event.category];

                  return (
                    <article
                      key={event.id}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        // On mobile, if card is clicked, we might want to also toggle map or let user know
                      }}
                      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col sm:flex-row gap-4 p-4 ${
                        isSelected
                          ? 'border-slate-900 ring-2 ring-slate-900/5 shadow-md bg-slate-50/50'
                          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                      }`}
                      id={`event-card-${event.id}`}
                    >
                      {/* Event Image */}
                      <div className="w-full sm:w-44 h-40 shrink-0 rounded-xl overflow-hidden relative bg-slate-100">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 shadow-sm ${catColors.bg}`}>
                            <CatIcon className="w-3 h-3 shrink-0" />
                            <span>{event.category}</span>
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 text-[9px] font-mono rounded font-bold">
                            {event.prefecture}
                          </span>
                        </div>
                      </div>

                      {/* Event Text Metadata */}
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          {/* Title & Rating */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-950 transition-colors">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 py-0.5 px-1.5 rounded-md text-[10px] font-bold shrink-0 select-none border border-amber-200/50">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{event.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                            {event.description}
                          </p>
                        </div>

                        {/* Detailed Table Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {event.resolvedStartDate && event.resolvedEndDate
                                ? `${formatDateJP(new Date(event.resolvedStartDate))} 〜 ${formatDateJP(new Date(event.resolvedEndDate))}`
                                : '日時不定期'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-700 font-medium">
                              {event.location}
                            </span>
                          </div>
                          {event.price && (
                            <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 min-w-0">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold shrink-0 font-mono">料金</span>
                              <span className="truncate text-slate-600 font-medium">{event.price}</span>
                            </div>
                          )}
                          {isSelected && event.access && (
                            <div className="flex items-start gap-1.5 col-span-1 sm:col-span-2 min-w-0 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                              <span className="text-[10px] bg-slate-900 text-slate-100 px-1.5 py-0.2 rounded font-bold shrink-0 font-mono mt-0.5">交通</span>
                              <span className="text-slate-600 leading-normal">{event.access}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-4" id="empty-state-placeholder">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 animate-bounce">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">該当するイベントが見つかりません</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    選択した検索条件（県、カテゴリ、期間）またはキーワードに合致するデータがありません。条件を広げてお試しください。
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="bg-slate-950 text-white font-semibold text-xs py-2.5 px-6 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  すべての条件をリセット
                </button>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="bg-white hover:bg-slate-50 text-slate-950 border border-slate-300 font-bold text-xs py-3 px-8 rounded-xl flex items-center gap-2 shadow-sm transition-colors active:scale-95"
                  id="load-more-btn"
                >
                  <span>イベントをさらに読み込む</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE MAP & DEV CONSOLE (5 cols) */}
        <section
          className={`col-span-1 md:col-span-5 flex flex-col gap-6 md:sticky md:top-[98px] h-[calc(100vh-140px)] min-h-[500px] ${
            activeMobileView === 'map' ? 'block' : 'max-md:hidden'
          }`}
          id="right-mapping-section"
        >
          {/* Map Container */}
          <div className="flex-1 min-h-[300px] h-full" id="map-container-wrapper">
            <MapComponent
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={(id) => {
                setSelectedEventId(id);
                // Also scroll card into view or keep selection aligned
              }}
            />
          </div>

          {/* Cool Developer Terminal Console */}
          <div className="shrink-0" id="dev-console-wrapper">
            <DeveloperConsole
              eventsCount={resolvedEvents.length}
              filteredCount={filteredEvents.length}
              selectedPrefectures={selectedPrefectures}
              selectedCategories={selectedCategories}
              selectedPeriod={selectedPeriod}
              weekendRanges={weekendRanges}
              selectedEvent={activeSelectedEvent}
            />
          </div>
        </section>

      </main>

      {/* 4. Elegant Minimalist Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs font-mono select-none" id="main-app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 東海週末イベント案内 観光推進部 • Created with Vite & React</p>
          <div className="flex gap-4 text-[11px]">
            <span className="text-emerald-400">● STATIC_CLIENT_MODE</span>
            <span>LEAFLET_v1.9.4</span>
            <span>GITHUB_PAGES_BASE: /tokai_kankou/</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
