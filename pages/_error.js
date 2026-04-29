import Head from 'next/head';
import { useRouter } from 'next/router';

function Error({ statusCode }) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <Head>
        <title>Error | LetsGrowAi</title>
      </Head>
      
      <div className="text-center space-y-6 max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/20">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2 font-headline">Something went wrong</h1>
          <p className="text-on-surface-variant">Our AI had a moment — please try again. {statusCode ? `(Error ${statusCode})` : ''}</p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button 
            onClick={() => router.reload()} 
            className="w-full bg-primary text-on-primary px-4 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
