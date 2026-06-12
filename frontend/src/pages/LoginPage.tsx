import { KeyRound, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { stayfinderApi } from "../api/stayfinderApi";
import { useAuth } from "../auth/AuthProvider";
import { Field, Panel, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function LoginPage({ mode }: { mode: "user" | "corp" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const tokens =
        mode === "corp"
          ? await stayfinderApi.loginCorp({ email, password })
          : await stayfinderApi.loginUser({ email, password });
      auth.signIn(tokens, mode === "corp" ? "CORP_USER" : "USER", email);
      setStatus("success");
      setMessage("로그인되었습니다.");
      const fallback = mode === "corp" ? "/corp/rooms" : "/search";
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? fallback, { replace: true });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid page-grid-narrow">
      <Panel title={mode === "corp" ? "사업자 로그인" : "사용자 로그인"}>
        <form className="form-stack" onSubmit={submit}>
          <Field label="이메일">
            <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="비밀번호">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <StatusBanner status={status} message={message} />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {mode === "corp" ? <KeyRound size={16} /> : <LogIn size={16} />}
            {isSubmitting ? "처리 중" : "로그인"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
