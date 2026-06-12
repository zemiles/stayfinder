import { CalendarCheck, CreditCard } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, SelectInput, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function ReservationPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    roomId: "",
    roomUnitId: "",
    checkIn: today,
    checkOut: today,
    amount: "",
    payMethod: "CARD"
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
      await stayfinderApi.reserve({
        roomId: Number(form.roomId),
        roomUnitId: form.roomUnitId ? Number(form.roomUnitId) : undefined,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        amount: Number(form.amount),
        payMethod: form.payMethod as "ACCOUNT" | "CARD" | "BANK_PAYMENT"
      });
      setStatus("success");
      setMessage("예약 요청이 생성되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "예약에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid page-grid-narrow">
      <Panel title="예약 요청">
        <form className="form-stack" onSubmit={submit}>
          <div className="two-col">
            <Field label="객실 ID">
              <TextInput value={form.roomId} onChange={(event) => update("roomId", event.target.value)} required />
            </Field>
            <Field label="객실 유닛 ID">
              <TextInput value={form.roomUnitId} onChange={(event) => update("roomUnitId", event.target.value)} />
            </Field>
          </div>
          <div className="two-col">
            <Field label="체크인">
              <TextInput type="date" value={form.checkIn} onChange={(event) => update("checkIn", event.target.value)} />
            </Field>
            <Field label="체크아웃">
              <TextInput type="date" value={form.checkOut} onChange={(event) => update("checkOut", event.target.value)} />
            </Field>
          </div>
          <div className="two-col">
            <Field label="금액">
              <TextInput value={form.amount} onChange={(event) => update("amount", event.target.value)} required />
            </Field>
            <Field label="결제수단">
              <SelectInput value={form.payMethod} onChange={(event) => update("payMethod", event.target.value)}>
                <option value="CARD">카드</option>
                <option value="ACCOUNT">계좌</option>
                <option value="BANK_PAYMENT">무통장</option>
              </SelectInput>
            </Field>
          </div>
          <StatusBanner status={status} message={message} />
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {form.payMethod === "CARD" ? <CreditCard size={16} /> : <CalendarCheck size={16} />}
            예약
          </button>
        </form>
      </Panel>
    </div>
  );
}
