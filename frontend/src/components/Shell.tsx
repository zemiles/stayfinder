import {
  BedDouble,
  Building2,
  CalendarCheck,
  DoorOpen,
  FileText,
  Home,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import mark from "../assets/stayfinder-mark.svg";

const mainLinks = [
  { to: "/", label: "홈", icon: Home },
  { to: "/search", label: "숙소 검색", icon: Search },
  { to: "/reservation", label: "예약", icon: CalendarCheck },
  { to: "/signup", label: "회원가입", icon: UserPlus }
];

const corpLinks = [
  { to: "/corp/request", label: "사업자 승인", icon: Building2 },
  { to: "/corp/register", label: "사업자 계정", icon: LogIn },
  { to: "/corp/rooms", label: "객실 관리", icon: BedDouble }
];

const adminLinks = [{ to: "/admin", label: "관리자", icon: ShieldCheck }];

export function Shell() {
  const auth = useAuth();
  const navigate = useNavigate();

  function logout() {
    auth.signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={mark} alt="" />
          <div>
            <strong>Stayfinder</strong>
            <span>Console</span>
          </div>
        </div>

        <nav className="nav-group" aria-label="주요 메뉴">
          {mainLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <nav className="nav-group" aria-label="사업자 메뉴">
          <div className="nav-label">Corp</div>
          {corpLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <nav className="nav-group" aria-label="관리자 메뉴">
          <div className="nav-label">Admin</div>
          {adminLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Stayfinder MSA Frontend</span>
            <h1>예약 운영 콘솔</h1>
          </div>
          <div className="session">
            {auth.isAuthenticated ? (
              <>
                <span>{auth.email}</span>
                <span className="role-chip">{auth.role}</span>
                <button className="icon-button" type="button" onClick={logout} title="로그아웃">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <NavLink className="button button-secondary" to="/login">
                <LogIn size={16} />
                로그인
              </NavLink>
            )}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon
}: {
  to: string;
  label: string;
  icon: typeof DoorOpen;
}) {
  return (
    <NavLink className="nav-item" to={to} end={to === "/"}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}
