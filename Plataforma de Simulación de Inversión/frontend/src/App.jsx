import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MarketPage from "./pages/MarketPage";
import PortfoliosPage from "./pages/PortfoliosPage";
import PortfolioDetailPage from "./pages/PortfolioDetailPage";
import TradingPage from "./pages/TradingPage";
import SavingsPage from "./pages/SavingsPage";
import ScenariosPage from "./pages/ScenariosPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EducationPage from "./pages/EducationPage";
import ProfilePage from "./pages/ProfilePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminMarketPage from "./pages/AdminMarketPage";
import AdminEducationPage from "./pages/AdminEducationPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mercado" element={<MarketPage />} />
          <Route path="/portafolios" element={<PortfoliosPage />} />
          <Route path="/portafolios/:id" element={<PortfolioDetailPage />} />
          <Route path="/operar" element={<TradingPage />} />
          <Route path="/ahorros" element={<SavingsPage />} />
          <Route path="/escenarios" element={<ScenariosPage />} />
          <Route path="/analisis" element={<AnalyticsPage />} />
          <Route path="/aprendizaje" element={<EducationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<Layout />}>
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/mercado" element={<AdminMarketPage />} />
          <Route path="/admin/educacion" element={<AdminEducationPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
