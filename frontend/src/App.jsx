import React, { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { SHARED_CSS } from './constants/animations';
import { colors } from './constants/tokens';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmoothScroller from './components/ui/SmoothScroller';

const Home = lazy(() => import('./pages/Home'));
const CareerCounselling = lazy(() => import('./pages/CareerCounselling'));
const Books = lazy(() => import('./pages/Books'));
const SchoolsWorkshops = lazy(() => import('./pages/SchoolsWorkshops'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const PsychometricTests = lazy(() => import('./pages/PsychometricTests'));
const Test = lazy(() => import('./pages/Test'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminIndex = lazy(() => import('./pages/admin/AdminIndex'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

/* ─── Per-route document head ───────────────────────────────────────────────
   CRA keeps index.html's <title> and meta description for every route, so the
   Books page announced itself as the homepage. This maps the current path to
   its own title/description and writes them into the head on navigation.

   A route is matched by exact path or as the parent of a nested route, so
   /test/:type inherits the Psychometric Tests entry. */
const ROUTE_META = [
  {
    path: '/',
    title: 'Paavan SETU — Bridging Values with Education',
    description:
      'Paavan SETU brings career counselling, value-education books and school workshops to students and families across India — bridging values with education.',
  },
  {
    path: '/career-counselling',
    title: 'Career Counselling & DMIT | Paavan SETU',
    description:
      'Psychometric and DMIT assessments meet one-on-one counselling so the stream, course and college a student picks are grounded in who they really are.',
  },
  {
    path: '/books',
    title: 'Value-Education Books | Paavan SETU',
    description:
      'Thoughtfully authored value-education books for children — used in 50+ schools across Gujarat. Buy online or enquire about bulk school orders.',
  },
  {
    path: '/schools-workshops',
    title: 'Schools & Workshops | Paavan SETU',
    description:
      'Career guidance and value-education programmes delivered on-site to students, teachers and parents across Gujarat — customised for your school.',
  },
  {
    path: '/about',
    title: 'About Paavan SETU',
    description:
      'Meet the founder and the story behind Paavan SETU — counselling, workshops and value education built on 10+ years of work across 200+ schools.',
  },
  {
    path: '/contact',
    title: 'Contact Paavan SETU',
    description:
      'Reach Paavan SETU by WhatsApp, email or phone. Book a career counselling session, a school workshop, or a bulk book order — we reply within hours.',
  },
  {
    path: '/test',
    title: 'Psychometric Tests | Paavan SETU',
    description:
      'Precision psychometric and DMIT assessments that map your innate strengths, learning style and ideal career pathway. Take an assessment online.',
  },
  {
    path: '/login',
    title: 'Log In | Paavan SETU',
    description: 'Log in to access your psychometric tests and results on Paavan SETU.',
  },
  {
    path: '/register',
    title: 'Create an Account | Paavan SETU',
    description: 'Create a free account to take psychometric assessments and discover your ideal career path.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Paavan SETU',
    description: 'How Paavan SETU collects, uses and protects your personal information.',
  },
  {
    path: '/terms',
    title: 'Terms of Service | Paavan SETU',
    description: 'The terms governing your use of the Paavan SETU website and services.',
  },
];

function RouteMeta() {
  const { pathname } = useLocation();
  const [seoConfig, setSeoConfig] = React.useState(null);

  React.useEffect(() => {
    // Fetch dynamic SEO settings once on mount
    import('./lib/api').then(({ getSeoSettings }) => {
      getSeoSettings().then(res => setSeoConfig(res)).catch(() => setSeoConfig([]));
    });
  }, []);

  React.useEffect(() => {
    const fallback = ROUTE_META[0];
    const defaultRoute =
      ROUTE_META.find(
        (r) => r.path === pathname || (r.path !== '/' && pathname.startsWith(r.path + '/'))
      ) || fallback;
      
    let route = { ...defaultRoute };
    
    // Override with dynamic SEO if available
    if (seoConfig && Array.isArray(seoConfig)) {
       // Exact match first, then parent route match
       const dynamicRoute = seoConfig.find(r => r.path === pathname) || 
                            seoConfig.find(r => r.path !== '/' && pathname.startsWith(r.path + '/'));
       if (dynamicRoute) {
         if (dynamicRoute.title) route.title = dynamicRoute.title;
         if (dynamicRoute.description) route.description = dynamicRoute.description;
         if (dynamicRoute.keywords) route.keywords = dynamicRoute.keywords;
         if (dynamicRoute.ogTitle) route.ogTitle = dynamicRoute.ogTitle;
         if (dynamicRoute.ogDescription) route.ogDescription = dynamicRoute.ogDescription;
         if (dynamicRoute.ogImage) route.ogImage = dynamicRoute.ogImage;
       }
    }

    document.title = route.title;

    const setMeta = (attr, key, content) => {
      if (!content) return; // Don't set empty meta tags
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    
    setMeta('name', 'description', route.description);
    if (route.keywords) setMeta('name', 'keywords', route.keywords);
    setMeta('property', 'og:title', route.ogTitle || route.title);
    setMeta('property', 'og:description', route.ogDescription || route.description);
    if (route.ogImage) setMeta('property', 'og:image', route.ogImage);
    setMeta('name', 'twitter:title', route.ogTitle || route.title);
    setMeta('name', 'twitter:description', route.ogDescription || route.description);
    if (route.ogImage) setMeta('name', 'twitter:image', route.ogImage);
  }, [pathname, seoConfig]);

  return null;
}

function RouteLoader() {
  return (
    <div className="min-h-[60vh] px-6" aria-label="Loading" role="status">
      <div className="max-w-7xl mx-auto pt-10">
        <div className="h-10 w-56 rounded-md bg-green-light animate-pulse" />
        <div className="mt-6 h-5 w-full max-w-2xl rounded-md bg-green-light animate-pulse" />
        <div className="mt-3 h-5 w-full max-w-xl rounded-md bg-green-light animate-pulse" />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-green-light animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh text-center px-6 font-['DM_Sans',sans-serif]">
          <h2 className="font-['DM_Serif_Display',Georgia,serif] text-2xl mb-3" style={{ color: colors.ink }}>
            Something went wrong
          </h2>
          <p className="mb-6" style={{ color: colors.ash }}>Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-white border-none rounded-full px-8 py-3 text-base font-semibold cursor-pointer transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.green }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Public site shell — marketing navbar and footer.
 *
 * The admin panel deliberately sits outside this: it brings its own sidebar and
 * top bar, and the floating public navbar used to overlap them while the
 * marketing CTA and footer trailed below the dashboard.
 */
function PublicLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex flex-col min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-green focus:text-white focus:rounded-full focus:px-6 focus:py-3 focus:font-semibold"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none overflow-x-clip">
        <Suspense fallback={<RouteLoader />}>
          <AnimatePresence mode="sync">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}


function AppContent() {
  return (
    <>
      <ScrollToTop />
      <RouteMeta />
      <Routes>
        {/* Admin: its own chrome, no public navbar/footer. */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<RouteLoader />}>
              <AdminIndex />
            </Suspense>
          }
        />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/career-counselling" element={<CareerCounselling />} />
          <Route path="/books" element={<Books />} />
          <Route path="/schools-workshops" element={<SchoolsWorkshops />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/test" element={<PsychometricTests />} />
          <Route path="/test/:type" element={<Test />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>{SHARED_CSS}</style>
      <ErrorBoundary>
        <SmoothScroller>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </BrowserRouter>
        </SmoothScroller>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
