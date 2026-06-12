import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getState, setState } from './store/store';
import { Sales } from './views/Sales';
import { Gate } from './views/Gate';
import { AppShell } from './views/AppShell';
import './styles/tokens.css';

type Route = 'sales' | 'app';

function readRoute(): Route {
  const hash = location.hash;
  if (hash.startsWith('#/')) return hash.slice(2).startsWith('app') ? 'app' : 'sales';
  return location.pathname.replace(/\/+$/, '').endsWith('/app') ? 'app' : 'sales';
}

function navigate(to: Route) {
  if (location.protocol === 'file:') {
    location.hash = to === 'app' ? '#/app' : '#/';
  } else {
    history.pushState(null, '', to === 'app' ? '/app' : '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function hasAccess(): boolean {
  const params = new URLSearchParams(location.search);
  if (params.get('access') === 'granted') {
    if (!getState().access) setState({ access: true });
    return true;
  }
  if (getState().access) return true;
  const h = location.hostname;
  return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1';
}

function Root() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  if (route === 'sales') return <Sales onOpen={() => navigate('app')} />;
  return hasAccess() ? <AppShell /> : <Gate />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // offline support is a courtesy, never a blocker
    });
  });
}
