import Head from "next/head";
import { useRouter } from "next/router";
import CompanyLayout from "@/components/CompanyLayout";
import Icon from "@/components/Icon";
import { useState, useEffect } from "react";

export default function CompanyResearchHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Fetch recent searches
    fetch('/api/company/recent')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.companies) {
          setRecentSearches(d.companies);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 2) {
      setError("Please enter a valid company name (min 2 chars)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/company/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: searchQuery, role: roleQuery || 'Software Engineer' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to analyze company");
      }

      router.push(`/dashboard/company/${data.companySlug}`);
    } catch (err) {
      setError(err.message);
      setIsLoading(false); // only reset loading if error. If success, let it spin until route transition
    }
  };

  return (
    <>
      <Head>
        <title>Company Research | LetsGrowAi</title>
      </Head>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full min-h-[calc(100vh-140px)] relative">
        
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none -z-10 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none -z-10 mix-blend-multiply"></div>

        {/* Hero Section */}
        <div className="text-center mb-10 w-full max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 bg-tertiary-container px-4 py-1.5 rounded-full mb-6 border border-tertiary-container/20 shadow-sm relative overflow-hidden group cursor-default">
             <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
            <Icon name="auto_awesome" className="text-on-tertiary-container text-sm" filled />
            <span className="text-[10px] font-extrabold text-on-tertiary-container font-headline tracking-widest uppercase">AI Powered Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight mb-4 font-headline leading-tight">
            Research a Company
          </h1>
          <p className="text-on-surface-variant font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Gain deep insights into performance, culture, and market position with our visionary intelligence suite.
          </p>
        </div>

        {/* Primary Search Card Container */}
        <div className="w-full max-w-3xl space-y-8 z-10 px-4">
            
          {/* Awesome AI Glow Input */}
          <form onSubmit={handleSearch} className="relative group w-full">
            <div className="absolute inset-0 bg-primary opacity-5 blur-2xl group-focus-within:opacity-15 transition-opacity duration-500 rounded-[2rem]"></div>
            
            <div className="relative flex flex-col md:flex-row items-center bg-surface-container-lowest rounded-3xl p-3 shadow-[0_20px_40px_rgba(0,55,176,0.06)] border border-outline-variant/10 focus-within:border-primary/30 transition-colors">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center w-full px-2 md:px-4 gap-2">
                <div className="flex-1 flex items-center bg-surface-container-low/50 rounded-xl px-4 py-1">
                  <Icon name="business" className="text-primary text-[24px] mr-3 drop-shadow-sm" />
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg font-medium text-on-surface placeholder:text-outline-variant font-body h-12 outline-none" 
                    placeholder="Company (e.g. Google, TCS)" 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex-1 flex items-center bg-surface-container-low/50 rounded-xl px-4 py-1">
                  <Icon name="work" className="text-secondary text-[24px] mr-3 drop-shadow-sm" />
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg font-medium text-on-surface placeholder:text-outline-variant font-body h-12 outline-none" 
                    placeholder="Role (e.g. SDE II)" 
                    type="text"
                    value={roleQuery}
                    onChange={e => setRoleQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="flex items-center mt-4 md:mt-0 md:ml-4 md:border-l border-outline-variant/20 md:pl-6 w-full md:w-auto shrink-0 justify-end px-2 md:px-0">
                <button 
                   type="submit"
                   disabled={isLoading || !searchQuery}
                   className="w-full md:w-auto bg-primary text-white px-8 py-3.5 rounded-2xl font-extrabold font-headline transition-all hover:shadow-[0_8px_20px_rgba(0,55,176,0.25)] hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                   {isLoading ? (
                     <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analyzing...
                     </>
                   ) : (
                     <>
                        Analyze <Icon name="arrow_forward" className="text-[18px]" />
                     </>
                   )}
                </button>
              </div>
            </div>
            {error && (
              <p className="absolute -bottom-6 left-6 text-error text-xs font-bold">{error}</p>
            )}
          </form>

          {/* Inline Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-2">
            <button 
               onClick={() => router.push('/dashboard/company/compare')}
               className="group flex items-center gap-2.5 text-sm font-extrabold text-primary font-headline"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Icon name="compare_arrows" className="text-[18px]" />
              </div>
              <span className="relative">
                 Compare Two Companies
                 <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/30 group-hover:w-full transition-all duration-300"></span>
              </span>
            </button>
            <button 
               onClick={() => alert("Market Trends dashboard is currently under development. Stay tuned!")}
               className="group flex items-center gap-2.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                 <Icon name="trending_up" className="text-[18px]" />
              </div>
              Market Trends
            </button>
          </div>

          {/* Recent Searches Row */}
          {recentSearches.length > 0 && (
            <div className="pt-10 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 mb-5 px-2">
                <span className="text-[10px] font-extrabold text-primary font-headline uppercase tracking-widest border-b-2 border-primary/50 pb-1">Your Recent Searches</span>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {recentSearches.map((search, idx) => {
                  const colors = ['blue', 'emerald', 'orange', 'purple', 'rose'];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <button 
                      key={idx}
                      onClick={() => router.push(`/dashboard/company/${search.companySlug}`)}
                      className="flex items-center gap-3 bg-surface-container-lowest px-5 py-3.5 rounded-2xl border border-outline-variant/10 shadow-[0_4px_10px_rgba(15,23,42,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all group min-w-[140px]"
                    >
                      <div className={`w-8 h-8 bg-${color}-50 rounded-xl flex items-center justify-center shadow-inner border border-${color}-100`}>
                        <span className={`text-[14px] font-extrabold font-headline text-${color}-600 uppercase`}>
                          {search.companyName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left flex flex-col">
                        <span className="font-bold text-sm text-on-surface font-headline leading-tight">{search.companyName}</span>
                        {search.role && <span className="text-[10px] text-on-surface-variant">{search.role}</span>}
                      </div>
                      <Icon name="arrow_outward" className="text-[16px] text-slate-300 ml-auto opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bento Content Ideas */}
        <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
           {/* Curated Box */}
          <div className="col-span-1 md:col-span-2 bg-[#e2e7ff] p-8 md:p-10 rounded-3xl relative overflow-hidden group border border-[#c6d1ff] shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
            <div className="relative z-10">
              <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-widest mb-6 inline-block font-headline shadow-sm border border-primary-container">CURATED DB</span>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-3 font-headline text-[#0f172a] tracking-tight">Unicorns of 2026</h3>
              <p className="text-[#334155] mb-8 max-w-sm font-medium leading-relaxed">
                Detailed financial health and scaling strategy reports for the top 50 emerging giants.
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); alert("Curated DB Collections are coming in the next update!"); }}
                className="flex items-center gap-2 font-extrabold text-primary hover:gap-4 transition-all font-headline bg-white/50 px-5 py-2.5 rounded-xl border border-white backdrop-blur-sm"
              >
                 View Collection <Icon name="east" />
              </button>
            </div>
            
            <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none"></div>
            <img 
               alt="Charts bg" 
               className="absolute -bottom-12 -right-8 w-72 h-72 object-contain opacity-40 group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-700 pointer-events-none" 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_kt4RVOKgZFmQuK2DHOYIxJHLXn48wdXmnVOgOuZgwOZgPFXxfSx7U8i8jbGcFE8RHmDKWr4sdvalsTtPFWS1jWo1ZCwWsdJOdh_SiT83IuXbO-i7lhYljCp4AtGF7KKkDq7YZ8-bq-q3Sb1TT80ARSqSbdRVq5QxRZQ2fL7TMOYwT5zIYKvKvGTw4jougU8le0vd4DrR0OjYRyG9XB8wPZrjYwxi7zhJow_hjSyJcibD6IUaIzqT2_3Wgtr5dB2nySAI3pP37jQ" 
            />
          </div>
          
          {/* Pro Tip Box */}
          <div className="bg-inverse-surface p-8 md:p-10 rounded-3xl flex flex-col justify-between shadow-xl border border-[#3b4b6b] relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 blur-3xl group-hover:bg-secondary/40 transition-colors"></div>
            <div className="relative z-10">
              <span className="bg-[#a1cde3] text-[#001f2a] text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-widest mb-6 inline-block font-headline shadow-sm border border-white/20">PRO TIP</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-white mb-3 font-headline tracking-tight">Semantic Search</h3>
              <p className="text-white/60 text-sm font-body leading-relaxed">
                You can search by industry keywords like <span className="text-primary-fixed italic font-bold">"EdTech"</span> or <span className="text-secondary-fixed italic font-bold">"Green Energy"</span> to discover highly specialized companies.
              </p>
            </div>
            
            <div className="mt-10 flex items-center justify-between text-white relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-inner">
                 <Icon name="lightbulb" className="text-[24px] text-yellow-100" filled />
              </div>
              <Icon name="arrow_forward" className="group-hover:translate-x-2 transition-transform opacity-70" />
            </div>
          </div>
        </div>

      </main>
    </>
  );
}

// Bind to exactly the new CompanyLayout
CompanyResearchHub.getLayout = function getLayout(page) {
  return <CompanyLayout>{page}</CompanyLayout>;
};
