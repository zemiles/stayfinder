import { KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function CorpRegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    corpPhoneNumber: "",
    businessLicense: ""
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      await stayfinderApi.createCorpUser(form);
      setStatus("success");
      setMessage("사업자 계정이 생성되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "계정 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid page-grid-narrow">
      <Panel title="사업자 계정 생성">
        <form className="form-stack" onSubmit={submit}>
          <Field label="이메일">
            <TextInput type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          </Field>
          <div className="two-col">
            <Field label="비밀번호">
              <TextInput
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
              />
            </Field>
            <Field label="비밀번호 확인">
              <TextInput
                type="password"
                value={form.passwordConfirm}
                onChange={(event) => update("passwordConfirm", event.target.value)}
              />
            </Field>
          </div>
          <div className="two-col">
            <Field label="전화번호">
              <TextInput
                value={form.corpPhoneNumber}
                onChange={(event) => update("corpPhoneNumber", event.target.value)}
              />
            </Field>
            <Field label="사업자번호">
              <TextInput
                value={form.businessLicense}
                onChange={(event) => update("businessLicense", event.target.value)}
              />
            </Field>
          </div>
          <StatusBanner status={status} message={message} />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <KeyRound size={16} />
            생성
          </button>
        </form>
      </Panel>
    </div>
  );
}
