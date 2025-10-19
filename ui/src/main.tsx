import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from "./pages/Login/Login.tsx";
import { BrowserRouter, Routes, Route } from "react-router";
import PrivateRoute from './components/PrivateRoute/PrivateRoute.tsx';
import AuthHandler from './components/AuthHandler/AuthHandler.tsx';
import Dashboard from './pages/Dashboard/Dashboard.tsx';
import MeetingDetails from './pages/MeetingDetails/MeetingDetails.tsx';
import RecordMeeting from './pages/RecordMeeting/RecordMeeting.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthHandler />} />
  
        <Route element={<PrivateRoute />}>
          {/* Private Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/meetings/:uuid" element={<MeetingDetails />} />
          <Route path="record" element={<RecordMeeting />} />
        </Route>

      </Routes>
    </BrowserRouter> 
  </StrictMode>
)
