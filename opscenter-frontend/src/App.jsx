import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Supervisor from "@/pages/Supervisor";
import Cockpit from "@/pages/Cockpit";
import Navigator from "@/pages/Navigator";
import MapView from "@/pages/Map";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute>
              <Supervisor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cockpit"
          element={
            <ProtectedRoute>
              <Cockpit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/navigator"
          element={
            <ProtectedRoute>
              <Navigator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
