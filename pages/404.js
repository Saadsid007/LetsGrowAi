import Link from 'next/link';
import Head from 'next/head';
import Icon from '../components/Icon';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Custom404() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes('auth_token'));
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Head>
        <title>Page Not Found | LetsGrowAi</title>
      </Head>
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="z-10 max-w-2xl w-full text-center space-y-8">
        <h1 className="text-[120px] md:text-[150px] font-black font-headline text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-400 leading-none drop-shadow-sm flex justify-center">
          <span className="animate-[bounce_2s_ease-in-out_infinite]">4</span>
          <span className="animate-[bounce_2s_ease-in-out_0.2s_infinite]">0</span>
          <span className="animate-[bounce_2s_ease-in-out_0.4s_infinite]">4</span>
        </h1>
        
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-3 font-headline">Looks like this page took a career break 😅</h2>
          <p className="text-on-surface-variant text-lg">The page you're looking for doesn't exist or was moved.</p>
        </div>

        <div>
          <button 
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all text-lg"
          >
            <Icon name="arrow_back" /> Back to {isLoggedIn ? 'Dashboard' : 'Home'}
          </button>
        </div>

        <div className="pt-8 mt-8 border-t border-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-outline mb-6">── OR JUMP TO ──</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { path: '/dashboard/resume', icon: '📄', label: 'Resume' },
              { path: '/dashboard/interview', icon: '🎤', label: 'Interview' },
              { path: '/dashboard/skills', icon: '🔍', label: 'Skills' },
              { path: '/dashboard/roadmap', icon: '🗺️', label: 'Roadmap' },
              { path: '/dashboard/company', icon: '🏢', label: 'Companies' },
              { path: '/dashboard/outreach', icon: '💬', label: 'Outreach' },
            ].map(link => (
              <Link 
                key={link.path} 
                href={link.path}
                className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{link.icon}</span>
                <span className="text-sm font-bold text-on-surface">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
