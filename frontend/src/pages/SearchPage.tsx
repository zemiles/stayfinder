import { CalendarDays, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";
import type { SearchResult } from "../types";

export function SearchPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [location, setLocation] = useState("서울");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [capacity, setCapacity] = useState(2);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const data = await stayfinderApi.search({ location, startDate, endDate, capacity });
      setResults(data);
      setStatus("success");
      setMessage(`${data.length}건을 조회했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "검색에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-grid">
      <Panel title="숙소 검색">
        <form className="search-form" onSubmit={submit}>
          <Field label="지역">
            <TextInput value={location} onChange={(event) => setLocation(event.target.value)} required />
          </Field>
          <Field label="체크인">
            <TextInput type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </Field>
          <Field label="체크아웃">
            <TextInput type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
          </Field>
          <Field label="인원">
            <TextInput
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              required
            />
          </Field>
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <Search size={16} />
            검색
          </button>
        </form>
        <StatusBanner status={status} message={message} />
      </Panel>

      <Panel title="검색 결과" actions={<CalendarDays size={18} />}>
        <div className="result-list">
          {results.length === 0 ? (
            <div className="empty-state">조회 결과가 없습니다.</div>
          ) : (
            results.map((result, index) => (
              <article className="result-card" key={`${result.businessTitle}-${index}`}>
                <div>
                  <strong>{result.businessTitle || "숙소명 없음"}</strong>
                  <span>{result.businessCategory || "카테고리 없음"}</span>
                </div>
                <p>{result.businessAddress || "주소 없음"}</p>
                <div className="result-meta">
                  <span>{result.roomName || result.roomType || "객실"}</span>
                  <span>{result.availableDate || startDate}</span>
                  <span>{result.price ? `${result.price.toLocaleString()}원` : "가격 미정"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
