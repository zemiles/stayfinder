import { BedDouble, Building2, CalendarCheck, Search, ShieldCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Panel } from "../components/Form";

const workflows = [
  { to: "/search", label: "숙소 검색", icon: Search, meta: "일반 사용자" },
  { to: "/signup", label: "회원가입", icon: UserPlus, meta: "인증/약관" },
  { to: "/reservation", label: "예약 요청", icon: CalendarCheck, meta: "결제 대기" },
  { to: "/corp/request", label: "사업자 승인", icon: Building2, meta: "파일 첨부" },
  { to: "/corp/rooms", label: "객실 관리", icon: BedDouble, meta: "사업자" },
  { to: "/admin", label: "관리자 처리", icon: ShieldCheck, meta: "승인/약관" }
];

export function DashboardPage() {
  return (
    <div className="page-grid">
      <Panel title="업무 바로가기">
        <div className="workflow-grid">
          {workflows.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="workflow-card" key={item.to} to={item.to}>
                <Icon size={22} />
                <strong>{item.label}</strong>
                <span>{item.meta}</span>
              </Link>
            );
          })}
        </div>
      </Panel>

      <Panel title="서비스 포트">
        <div className="port-list">
          <div>
            <strong>API</strong>
            <span>localhost:8081</span>
          </div>
          <div>
            <strong>Corp</strong>
            <span>localhost:8082</span>
          </div>
          <div>
            <strong>Batch</strong>
            <span>localhost:8083</span>
          </div>
          <div>
            <strong>Frontend</strong>
            <span>localhost:5173</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
