import { Building2, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function CorpRequestPage() {
  const [form, setForm] = useState({
    businessName: "",
    businessLicense: "",
    businessAddress: "",
    businessTitle: "",
    businessCategory: ""
  });
  const [files, setFiles] = useState<File[]>([]);
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
      await stayfinderApi.requestCorpApproval(form, files);
      setStatus("success");
      setMessage("승인 요청이 접수되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "승인 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid page-grid-narrow">
      <Panel title="사업자 승인 요청">
        <form className="form-stack" onSubmit={submit}>
          <div className="two-col">
            <Field label="사업자명">
              <TextInput value={form.businessName} onChange={(event) => update("businessName", event.target.value)} />
            </Field>
            <Field label="사업자번호">
              <TextInput
                value={form.businessLicense}
                onChange={(event) => update("businessLicense", event.target.value)}
              />
            </Field>
          </div>
          <Field label="주소">
            <TextInput value={form.businessAddress} onChange={(event) => update("businessAddress", event.target.value)} />
          </Field>
          <div className="two-col">
            <Field label="숙소명">
              <TextInput value={form.businessTitle} onChange={(event) => update("businessTitle", event.target.value)} />
            </Field>
            <Field label="카테고리">
              <TextInput
                value={form.businessCategory}
                onChange={(event) => update("businessCategory", event.target.value)}
              />
            </Field>
          </div>
          <Field label="사업자등록증">
            <TextInput
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </Field>
          <StatusBanner status={status} message={message} />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {files.length > 0 ? <Upload size={16} /> : <Building2 size={16} />}
            요청
          </button>
        </form>
      </Panel>
    </div>
  );
}
