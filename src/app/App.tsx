import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { AssessmentPage } from '../features/assessment/AssessmentPage';
import { HomePage } from '../features/home/HomePage';
import { ScenesPage } from '../features/scenes/ScenesPage';
import { SceneDetailPage } from '../features/scenes/SceneDetailPage';
import { ChunksPage } from '../features/chunks/ChunksPage';
import { ChunkDetailPage } from '../features/chunks/ChunkDetailPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SessionPage } from '../features/session/SessionPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/scenes" element={<ScenesPage />} />
        <Route path="/scenes/:sceneId" element={<SceneDetailPage />} />
        <Route path="/chunks" element={<ChunksPage />} />
        <Route path="/chunks/:chunkId" element={<ChunkDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/session/:sceneId" element={<SessionPage />} />
      <Route
        path="*"
        element={
          <div className="welcome" style={{ justifyContent: 'center' }}>
            <div className="stack" style={{ textAlign: 'center' }}>
              <p className="eyebrow">404</p>
              <h1 className="display">这一页不存在</h1>
              <p className="lede">可能是链接写错了。回到今天，接着练。</p>
              <Link className="button button--primary" to="/home">
                回到今天
              </Link>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
