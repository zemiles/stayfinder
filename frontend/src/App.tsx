import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { Shell } from "./components/Shell";
import { AdminPage } from "./pages/AdminPage";
import { CorpRegisterPage } from "./pages/CorpRegisterPage";
import { CorpRequestPage } from "./pages/CorpRequestPage";
import { CorpRoomsPage } from "./pages/CorpRoomsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ReservationPage } from "./pages/ReservationPage";
import { SearchPage } from "./pages/SearchPage";
import { SignupPage } from "./pages/SignupPage";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="login" element={<LoginPage mode="user" />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route element={<RequireAuth roles={["USER"]} />}>
          <Route path="reservation" element={<ReservationPage />} />
        </Route>

        <Route path="corp/login" element={<LoginPage mode="corp" />} />
        <Route path="corp/request" element={<CorpRequestPage />} />
        <Route path="corp/register" element={<CorpRegisterPage />} />
        <Route element={<RequireAuth roles={["CORP_USER"]} />}>
          <Route path="corp/rooms" element={<CorpRoomsPage />} />
        </Route>

        <Route element={<RequireAuth roles={["ADMIN"]} />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
