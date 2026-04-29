import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Icon from './Icon';

const QUICK_LINKS = [
  { title: 'Resume Builder', path: '/dashboard/resume', icon: '📄' },
  { title: 'Mock Interview', path: '/dashboard/interview', icon: '🎤' },
  { title: 'Skill Gap Analyzer', path: '/dashboard/skills', icon: '🔍' },
  { title: 'Roadmap Generator', path: '/dashboard/roadmap', icon: '🗺️' },
  { title: 'Company Research', path: '/dashboard/company', icon: '🏢' },
  { title: 'Cold Outreach', path: '/dashboard/outreach', icon: '💬' },
  { title: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [flatItems, setFlatItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setResults(null);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && activeIndex >= 0 && flatItems[activeIndex]) {
        e.preventDefault();
        router.push(flatItems[activeIndex].path);
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, activeIndex, router, onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      const initialItems = QUICK_LINKS.map(l => ({ ...l, type: 'page' }));
      setFlatItems(initialItems);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
          // Flatten items for keyboard navigation
          const items = [];
          data.results.pages.forEach(p => items.push({ ...p, type: 'page' }));
          data.results.userdata.resumes.forEach(r => items.push({ title: r.title || 'Resume', subtitle: `ATS: ${r.atsScore||0}/100`, path: '/dashboard/resume', icon: '📄', type: 'resume' }));
          data.results.userdata.roadmaps.forEach(r => items.push({ title: r.title, subtitle: r.goal, path: '/dashboard/roadmap', icon: '🗺️', type: 'roadmap' }));
          data.results.userdata.companies.forEach(c => items.push({ title: c.companyName, subtitle: c.savedRole, path: `/dashboard/company?q=${c.companySlug}`, icon: '🏢', type: 'company' }));
          data.results.actions.forEach(a => items.push({ ...a, type: 'action' }));
          setFlatItems(items);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Input Header */}
        <div className="flex items-center px-4 py-3 border-b border-outline-variant/20 gap-3">
          <Icon name="search" className="text-primary text-xl" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search LetsGrowAi..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-on-surface font-medium placeholder:text-outline"
          />
          <button onClick={onClose} className="text-xs font-bold text-outline uppercase tracking-widest px-2 py-1 bg-surface-container-low rounded-md hover:bg-surface-container-high">ESC</button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          
          {isLoading && (
            <div className="p-4 space-y-3 opacity-50">
              <div className="h-10 bg-surface-container-low rounded-xl animate-pulse"></div>
              <div className="h-10 bg-surface-container-low rounded-xl animate-pulse"></div>
              <div className="h-10 bg-surface-container-low rounded-xl animate-pulse"></div>
            </div>
          )}

          {!isLoading && !results && (
            <div className="p-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 px-3">⚡ Jump To</div>
              {QUICK_LINKS.map((link, idx) => (
                <div
                  key={link.title}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => { router.push(link.path); onClose(); }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-semibold text-sm">{link.title}</span>
                </div>
              ))}
            </div>
          )}

          {!isLoading && results && flatItems.length === 0 && (
            <div className="p-8 text-center text-outline">
              <Icon name="search_off" className="text-4xl mb-2 opacity-50" />
              <p className="font-medium text-sm">No results for "{query}"</p>
              <p className="text-xs mt-1">Try searching for a company or skill</p>
            </div>
          )}

          {!isLoading && results && flatItems.length > 0 && (
            <div className="p-2 space-y-4">
              {results.pages.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 px-3">Pages</div>
                  {results.pages.map(p => {
                    const idx = flatItems.findIndex(i => i.title === p.title && i.type === 'page');
                    return (
                      <div key={p.title} onMouseEnter={() => setActiveIndex(idx)} onClick={() => { router.push(p.path); onClose(); }} className={`flex flex-col p-3 rounded-xl cursor-pointer ${activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}>
                        <div className="flex items-center gap-2"><span className="text-sm">{p.icon}</span><span className="font-semibold text-sm">{p.title}</span></div>
                        {p.description && <span className="text-xs opacity-70 ml-6">{p.description}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {flatItems.filter(i => ['resume', 'roadmap', 'company'].includes(i.type)).length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 px-3">Your Data</div>
                  {flatItems.filter(i => ['resume', 'roadmap', 'company'].includes(i.type)).map(i => {
                    const idx = flatItems.findIndex(f => f.title === i.title && f.type === i.type);
                    return (
                      <div key={`${i.type}-${i.title}`} onMouseEnter={() => setActiveIndex(idx)} onClick={() => { router.push(i.path); onClose(); }} className={`flex flex-col p-3 rounded-xl cursor-pointer ${activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}>
                        <div className="flex items-center gap-2"><span className="text-sm">{i.icon}</span><span className="font-semibold text-sm">{i.title}</span></div>
                        {i.subtitle && <span className="text-xs opacity-70 ml-6">{i.subtitle}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {results.actions.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 px-3">Actions</div>
                  {results.actions.map(a => {
                    const idx = flatItems.findIndex(f => f.title === a.title && f.type === 'action');
                    return (
                      <div key={a.title} onMouseEnter={() => setActiveIndex(idx)} onClick={() => { router.push(a.path); onClose(); }} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer ${activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}>
                        <span className="text-sm">{a.icon}</span><span className="font-semibold text-sm">{a.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
