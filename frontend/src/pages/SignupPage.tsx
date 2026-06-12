import { Check, RefreshCw, Send, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, SelectInput, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";
import type { TermsMain } from "../types";

export function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordCheck: "",
    nickName: "",
    phoneNumber: "",
    birthday: "",
    gender: "M"
  });
  const [certifyNumber, setCertifyNumber] = useState("");
  const [terms, setTerms] = useState<TermsMain[]>([]);
  const [agreements, setAgreements] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    stayfinderApi
      .getTermsMain()
      .then((data) => {
        setTerms(data);
        setAgreements(Object.fromEntries(data.map((item) => [item.termsId, item.isTermsRequired])));
      })
      .catch(() => {
        setTerms([]);
      });
  }, []);

  function update(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function sendCertify() {
    try {
      await stayfinderApi.sendCertify({ phoneNumber: form.phoneNumber });
      setStatus("success");
      setMessage("인증번호를 요청했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "인증 요청에 실패했습니다.");
    }
  }

  async function proveCertify() {
    try {
      await stayfinderApi.proveCertify({
        phoneNumber: form.phoneNumber,
        reqCertifyNumber: Number(certifyNumber),
        termsDtoList: terms.map((item) => ({
          termsMainId: item.termsId,
          isAgreement: Boolean(agreements[item.termsId])
        }))
      });
      setStatus("success");
      setMessage("휴대폰 인증이 완료되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "인증 확인에 실패했습니다.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      await stayfinderApi.createUser(form);
      setStatus("success");
      setMessage("회원가입이 완료되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid">
      <Panel title="회원 정보">
        <form className="form-stack" onSubmit={submit}>
          <div className="two-col">
            <Field label="이메일">
              <TextInput type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </Field>
            <Field label="닉네임">
              <TextInput value={form.nickName} onChange={(event) => update("nickName", event.target.value)} />
            </Field>
          </div>
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
                value={form.passwordCheck}
                onChange={(event) => update("passwordCheck", event.target.value)}
              />
            </Field>
          </div>
          <div className="two-col">
            <Field label="생년월일">
              <TextInput type="date" value={form.birthday} onChange={(event) => update("birthday", event.target.value)} />
            </Field>
            <Field label="성별">
              <SelectInput value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </SelectInput>
            </Field>
          </div>

          <StatusBanner status={status} message={message} />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <UserPlus size={16} />
            가입
          </button>
        </form>
      </Panel>

      <Panel title="휴대폰 인증">
        <div className="form-stack">
          <Field label="휴대폰 번호">
            <TextInput value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} />
          </Field>
          <div className="inline-actions">
            <button className="button button-secondary" type="button" onClick={sendCertify}>
              <Send size={16} />
              요청
            </button>
            <button className="button button-secondary" type="button" onClick={proveCertify}>
              <Check size={16} />
              확인
            </button>
          </div>
          <Field label="인증번호">
            <TextInput value={certifyNumber} onChange={(event) => setCertifyNumber(event.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="약관">
        <div className="terms-list">
          {terms.length === 0 ? (
            <button className="button button-secondary" type="button" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              새로고침
            </button>
          ) : (
            terms.map((item) => (
              <label className="check-row" key={item.termsId}>
                <input
                  type="checkbox"
                  checked={Boolean(agreements[item.termsId])}
                  onChange={(event) =>
                    setAgreements((prev) => ({ ...prev, [item.termsId]: event.target.checked }))
                  }
                />
                <span>{item.termsMainTitle}</span>
                {item.isTermsRequired && <em>필수</em>}
              </label>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
