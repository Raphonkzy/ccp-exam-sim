import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { RequireAuth, RequireAdmin } from './components/RequireAuth'
import Dashboard from './pages/Dashboard'
import PracticeSetup from './pages/PracticeSetup'
import PracticeSession from './pages/PracticeSession'
import ExamIntro from './pages/ExamIntro'
import ExamRun from './pages/ExamRun'
import Results from './pages/Results'
import History from './pages/History'
import MistakeBank from './pages/MistakeBank'
import Browse from './pages/Browse'
import Settings from './pages/Settings'
import DevReview from './pages/DevReview'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route element={<Layout />}>
              {/* ── Public routes (guests welcome) ─────────── */}
              <Route index element={<Dashboard />} />
              <Route path="practice" element={<PracticeSetup />} />
              <Route path="practice/run" element={<PracticeSession />} />
              <Route path="exam" element={<ExamIntro />} />
              <Route path="exam/run" element={<ExamRun />} />
              <Route path="results/:id" element={<Results />} />

              {/* ── Auth-required routes ─────────────────── */}
              <Route path="history" element={<RequireAuth><History /></RequireAuth>} />
              <Route path="mistakes" element={<RequireAuth><MistakeBank /></RequireAuth>} />
              <Route path="browse" element={<RequireAuth><Browse /></RequireAuth>} />
              <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />

              {/* ── Admin-only route ─────────────────────── */}
              <Route path="dev/review" element={<RequireAdmin><DevReview /></RequireAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  )
}
