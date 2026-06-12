import { FileText, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, SelectInput, TextAreaInput, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function AdminPage() {
  const [approval, setApproval] = useState({ corpUserId: "", requestStatus: "APPROVED" });
  const [terms, setTerms] = useState({
    mainTitle: "",
    subTitle: "",
    detailContent: "",
    isCompulsion: "true",
    sortSeq: "1"
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function approve(event: FormEvent) {
    event.preventDefault();
    setStatus("idle");

    try {
      await stayfinderApi.approveCorpRequest({
        corpUserId: Number(approval.corpUserId),
        requestStatus: approval.requestStatus as "APPROVED" | "REJECTED"
      });
      setStatus("success");
      setMessage("사업자 요청 상태가 변경되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "승인 처리에 실패했습니다.");
    }
  }

  async function registerTerms(event: FormEvent) {
    event.preventDefault();
    setStatus("idle");

    try {
      await stayfinderApi.registerTerms({
        mainTitle: terms.mainTitle,
        subTitle: terms.subTitle,
        detailContent: terms.detailContent,
        isCompulsion: terms.isCompulsion === "true",
        sortSeq: Number(terms.sortSeq)
      });
      setStatus("success");
      setMessage("약관이 등록되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "약관 등록에 실패했습니다.");
    }
  }

  return (
    <div className="page-grid">
      <Panel title="사업자 승인">
        <form className="form-stack" onSubmit={approve}>
          <Field label="요청 ID">
            <TextInput
              value={approval.corpUserId}
              onChange={(event) => setApproval((prev) => ({ ...prev, corpUserId: event.target.value }))}
            />
          </Field>
          <Field label="상태">
            <SelectInput
              value={approval.requestStatus}
              onChange={(event) => setApproval((prev) => ({ ...prev, requestStatus: event.target.value }))}
            >
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
            </SelectInput>
          </Field>
          <button className="button button-primary" type="submit">
            <ShieldCheck size={16} />
            처리
          </button>
        </form>
      </Panel>

      <Panel title="약관 등록">
        <form className="form-stack" onSubmit={registerTerms}>
          <div className="two-col">
            <Field label="약관명">
              <TextInput
                value={terms.mainTitle}
                onChange={(event) => setTerms((prev) => ({ ...prev, mainTitle: event.target.value }))}
              />
            </Field>
            <Field label="정렬">
              <TextInput
                value={terms.sortSeq}
                onChange={(event) => setTerms((prev) => ({ ...prev, sortSeq: event.target.value }))}
              />
            </Field>
          </div>
          <div className="two-col">
            <Field label="상세 제목">
              <TextInput
                value={terms.subTitle}
                onChange={(event) => setTerms((prev) => ({ ...prev, subTitle: event.target.value }))}
              />
            </Field>
            <Field label="필수 여부">
              <SelectInput
                value={terms.isCompulsion}
                onChange={(event) => setTerms((prev) => ({ ...prev, isCompulsion: event.target.value }))}
              >
                <option value="true">필수</option>
                <option value="false">선택</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="내용">
            <TextAreaInput
              value={terms.detailContent}
              onChange={(event) => setTerms((prev) => ({ ...prev, detailContent: event.target.value }))}
            />
          </Field>
          <button className="button button-primary" type="submit">
            <FileText size={16} />
            등록
          </button>
        </form>
      </Panel>

      <StatusBanner status={status} message={message} />
    </div>
  );
}
