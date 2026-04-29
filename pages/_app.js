import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Splash screen for first load
    const timer = setTimeout(() => setIsFirstLoad(false), 1500);

    const handleStart = (url) => {
      if (url !== window.location.pathname) {
        setIsRouteChanging(true);
      }
    };
    const handleComplete = () => setIsRouteChanging(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      clearTimeout(timer);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  const showLoader = isRouteChanging || isFirstLoad;

  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      {showLoader && (
        <PageLoader 
          message={isFirstLoad ? "Initializing LetsGrowAi..." : "Moving to destination..."} 
        />
      )}
      {getLayout(<Component {...pageProps} />)}
    </AuthProvider>
  );
}
