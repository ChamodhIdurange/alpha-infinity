import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';

// The sign-in page and the dashboard each ship their own global stylesheet (carried over
// from the original pages). Loading them as separate chunks keeps the two from mixing;
// moving between them always does a full page load.
const LoginPage = lazy(() => import('./LoginPage'));
const Dashboard = lazy(() => import('./Dashboard'));

async function signedIn(): Promise<boolean> {
  try {
    const resp = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' });
    return resp.ok && (await resp.json()).authenticated === true;
  } catch {
    return false;
  }
}

const Page = (await signedIn()) ? Dashboard : LoginPage;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
);
