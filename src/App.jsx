import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AssistiveTouch from './components/AssistiveTouch'
import Home from './pages/Home'
import Browse from './pages/Browse'
import AnimeDetail from './pages/AnimeDetail'
import CharacterDetail from './pages/CharacterDetail'
import MyList from './pages/MyList'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import AdminDashboard from './pages/AdminDashboard'
import Overview from './pages/admin/Overview'
import GrantAccess from './pages/admin/GrantAccess'
import UserReport from './pages/admin/UserReport'
import Private from './pages/admin/Private'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/anime/:id" element={<AnimeDetail />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="grant-access" element={<GrantAccess />} />
            <Route path="user-report" element={<UserReport />} />
            <Route path="private" element={<Private />} />
          </Route>
        </Routes>
      </div>
      <Footer />
      <AssistiveTouch />
      <Analytics />
    </div>
  )
}

export default App
