
"use client";
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Globe, Map as MapIcon, Info, ChevronDown, ChevronUp, Loader2, CheckSquare, Square, RefreshCw, Clock, Languages, Share2, Filter, ExternalLink, Search } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AFRICA_CODES, TRANSLATIONS } from '../src/constants';
import { useStarlinkData } from '../src/hooks/useStarlinkData';
import { getCountryName } from '../src/utils/processor';

function TableContent({ initialData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [lang, setLang] = useState(searchParams.get('lang') || 'en');
  const [targetCurrency, setTargetCurrency] = useState(searchParams.get('cur') || 'XAF');
  const [filterMode, setFilterMode] = useState(searchParams.get('zone') || 'AFRICA');
  const [activeCols, setActiveCols] = useState(searchParams.get('cols')?.split(',') || ['standard', 'roamReg']);
  const [showKit, setShowKit] = useState(searchParams.get('kit') === 'true');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState({ key: 'roamReg', dir: 'asc' });
  const [shareFeedback, setShareFeedback] = useState(false);

  // Set default language on mount if not specified in URL
  useEffect(() => {
    if (!searchParams.get('lang') && typeof navigator !== 'undefined') {
      const navLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
      if (navLang !== lang) setLang(navLang);
    }
  }, [searchParams, lang]);

  const { data, rates, loading, dataSource, detectedLoc, refresh } = useStarlinkData(initialData);

  useEffect(() => {
    const p = new URLSearchParams();
    if (lang !== 'en') p.set('lang', lang);
    if (targetCurrency !== 'XAF') p.set('cur', targetCurrency);
    if (filterMode !== 'AFRICA') p.set('zone', filterMode);
    if (activeCols.join(',') !== 'standard,roamReg') p.set('cols', activeCols.join(','));
    if (showKit) p.set('kit', 'true');
    if (searchQuery) p.set('q', searchQuery);
    
    const queryStr = p.toString();
    router.replace(pathname + (queryStr ? `?${queryStr}` : ''), { scroll: false });
  }, [lang, targetCurrency, filterMode, activeCols, showKit, searchQuery, router, pathname]);

  const t = (k, p = {}) => {
    let text = TRANSLATIONS[lang][k] || k;
    Object.keys(p).forEach(key => text = text.replace(`{${key}}`, p[key]));
    return text;
  };

  const convert = (val, from) => (val && rates[from]) ? (val / rates[from]) * (rates[targetCurrency] || 1) : 0;

  const processedData = useMemo(() => {
    let list = data.map(item => ({
      ...item,
      countryName: getCountryName(item.region, lang),
      isAfrica: AFRICA_CODES.includes(item.region.toUpperCase()),
      standardConv: convert(item.standard, item.currency),
      roamRegConv: convert(item.roamReg, item.currency),
      roamGlobalConv: convert(item.roamGlobal, item.currency),
      roamCappedConv: convert(item.roamCapped, item.currency),
      kitConv: convert(item.kitPrice, item.currency)
    }));

    if (filterMode === 'AFRICA') list = list.filter(i => i.isAfrica);
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.countryName.toLowerCase().includes(q) || 
        i.region.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const isAValValid = sort.key === 'countryName' ? true : (a[sort.key + 'Conv'] > 0);
      const isBValValid = sort.key === 'countryName' ? true : (b[sort.key + 'Conv'] > 0);

      // Rule: Always push invalid/N/A to the bottom
      if (isAValValid && !isBValValid) return -1;
      if (!isAValValid && isBValValid) return 1;
      if (!isAValValid && !isBValValid) return 0;

      const aVal = sort.key === 'countryName' ? a.countryName : (a[sort.key + 'Conv'] || 0);
      const bVal = sort.key === 'countryName' ? b.countryName : (b[sort.key + 'Conv'] || 0);
      
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, rates, targetCurrency, filterMode, sort, lang]);

  const formatMoney = (v, isMain = false) => {
    if (!v || v === 0) return (
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
        {isMain ? t('notOffered') : t('unavailable')}
      </span>
    );
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { 
      style: 'currency', currency: targetCurrency, maximumFractionDigits: targetCurrency === 'XAF' ? 0 : 2 
    }).format(v);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200"><Globe className="text-white" size={24} /></div>
              <h1 className="text-2xl font-black tracking-tight">{t('title')}</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1 font-medium">{t('subtitle')}</p>
            {detectedLoc && <p className="text-[10px] text-blue-600 font-bold mt-2 px-2 py-0.5 bg-blue-50 rounded-full w-fit">{t('detectedLoc', {loc: detectedLoc})}</p>}
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShareFeedback(true); setTimeout(() => setShareFeedback(false), 2000); }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition transform active:scale-95 shadow-md">
              {shareFeedback ? t('copied') : <><Share2 size={16} /> {t('share')}</>}
            </button>
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-black uppercase transition border border-slate-200">{lang}</button>
            <button onClick={refresh} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition border border-slate-200"><RefreshCw size={20} /></button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest pb-3 border-b border-slate-100">
              <Filter size={16} className="text-blue-600"/> {t('preferences')}
            </div>
            <div className="flex flex-wrap gap-3">
              {['standard', 'roamReg', 'roamGlobal', 'roamCapped'].map(c => (
                <button key={c} onClick={() => setActiveCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${activeCols.includes(c) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {activeCols.includes(c) ? <CheckSquare size={14}/> : <Square size={14}/>} {t(c)}
                </button>
              ))}
              <button onClick={() => setShowKit(!showKit)} className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${showKit ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {showKit ? <CheckSquare size={14}/> : <Square size={14}/>} {t('showKit')}
              </button>
            </div>
            
            <div className="relative pt-2 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 mt-1 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-[10px] font-black placeholder-slate-400 text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('currency')}</label>
              <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200/50">
                {['XAF', 'USD', 'EUR'].map(c => (
                  <button key={c} onClick={() => setTargetCurrency(c)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${targetCurrency === c ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('zone')}</label>
              <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200/50">
                <button onClick={() => setFilterMode('AFRICA')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${filterMode === 'AFRICA' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('africa')}</button>
                <button onClick={() => setFilterMode('ALL')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${filterMode === 'ALL' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>{t('world')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6 cursor-pointer hover:text-blue-600 transition group" onClick={() => setSort({key: 'countryName', dir: sort.key === 'countryName' && sort.dir === 'asc' ? 'desc' : 'asc'})}>
                    <div className="flex items-center gap-2">{t('country')} {sort.key === 'countryName' && (sort.dir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                  </th>
                  {showKit && <th className="p-6 text-right cursor-pointer" onClick={() => setSort({key: 'kit', dir: sort.key === 'kit' && sort.dir === 'asc' ? 'desc' : 'asc'})}>
                    <div className="flex items-center justify-end gap-2">{t('kit')} {sort.key === 'kit' && (sort.dir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                  </th>}
                  {['standard', 'roamReg', 'roamGlobal', 'roamCapped'].filter(c => activeCols.includes(c)).map(c => (
                    <th key={c} className={`p-6 text-right cursor-pointer hover:text-blue-600 transition ${c === 'roamReg' ? 'text-blue-600 bg-blue-50/20' : ''}`} onClick={() => setSort({key: c, dir: sort.key === c && sort.dir === 'asc' ? 'desc' : 'asc'})}>
                      <div className="flex items-center justify-end gap-2">{t(c)} {sort.key === c && (sort.dir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedData.map((row) => (
                  <tr key={row.region} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <a href={row.starlinkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group/link">
                        <span className="text-4xl shadow-sm rounded-lg flex-shrink-0">{String.fromCodePoint(...[...row.region.toUpperCase()].map(c => c.charCodeAt(0) + 127397))}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors">{row.countryName}</p>
                            <ExternalLink size={12} className="text-slate-300 group-hover/link:text-blue-400 transition-colors" />
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono font-bold mt-1 tracking-wider opacity-60 uppercase">{row.region} • {row.currency}</p>
                        </div>
                      </a>
                    </td>
                    {showKit && <td className="p-6 text-right font-bold text-slate-500 text-sm">{formatMoney(row.kitConv)}</td>}
                    {activeCols.includes('standard') && <td className="p-6 text-right font-bold text-slate-500 text-sm">{formatMoney(row.standardConv)}</td>}
                    {activeCols.includes('roamReg') && <td className="p-6 text-right font-black text-blue-600 text-base bg-blue-50/10">{formatMoney(row.roamRegConv, true)}</td>}
                    {activeCols.includes('roamGlobal') && <td className="p-6 text-right font-bold text-slate-500 text-sm">{formatMoney(row.roamGlobalConv, true)}</td>}
                    {activeCols.includes('roamCapped') && <td className="p-6 text-right font-bold text-slate-500 text-sm">{formatMoney(row.roamCappedConv, true)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock size={12}/> {dataSource.type}: {t('today')}</span>
            <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-600">v2.1 Precision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dataSource.type === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
            {dataSource.type === 'LIVE' ? t('liveData') : t('archiveData')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StarlinkTable({ initialData }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Loading interface...</p>
        </div>
      </div>
    }>
      <TableContent initialData={initialData} />
    </Suspense>
  );
}
