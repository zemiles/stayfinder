import { BedDouble, DoorOpen } from "lucide-react";
import { FormEvent, useState } from "react";
import { stayfinderApi } from "../api/stayfinderApi";
import { Field, Panel, TextInput } from "../components/Form";
import { StatusBanner } from "../components/StatusBanner";

export function CorpRoomsPage() {
  const [room, setRoom] = useState({ roomType: "", price: "", capacity: "" });
  const [unit, setUnit] = useState({ roomType: "", roomName: "", price: "", capacity: "" });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function createRoom(event: FormEvent) {
    event.preventDefault();
    setStatus("idle");

    try {
      await stayfinderApi.createRoom({
        roomType: room.roomType,
        price: Number(room.price),
        capacity: Number(room.capacity)
      });
      setStatus("success");
      setMessage("객실 타입이 저장되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "객실 저장에 실패했습니다.");
    }
  }

  async function createRoomUnit(event: FormEvent) {
    event.preventDefault();
    setStatus("idle");

    try {
      await stayfinderApi.createRoomUnit({
        roomType: unit.roomType,
        roomName: unit.roomName,
        price: Number(unit.price || 0),
        capacity: Number(unit.capacity || 0)
      });
      setStatus("success");
      setMessage("객실 유닛이 저장되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "객실 유닛 저장에 실패했습니다.");
    }
  }

  return (
    <div className="page-grid">
      <Panel title="객실 타입">
        <form className="form-stack" onSubmit={createRoom}>
          <Field label="객실 타입">
            <TextInput
              value={room.roomType}
              onChange={(event) => setRoom((prev) => ({ ...prev, roomType: event.target.value }))}
            />
          </Field>
          <div className="two-col">
            <Field label="가격">
              <TextInput
                value={room.price}
                onChange={(event) => setRoom((prev) => ({ ...prev, price: event.target.value }))}
              />
            </Field>
            <Field label="정원">
              <TextInput
                value={room.capacity}
                onChange={(event) => setRoom((prev) => ({ ...prev, capacity: event.target.value }))}
              />
            </Field>
          </div>
          <button className="button button-primary" type="submit">
            <BedDouble size={16} />
            저장
          </button>
        </form>
      </Panel>

      <Panel title="객실 유닛">
        <form className="form-stack" onSubmit={createRoomUnit}>
          <div className="two-col">
            <Field label="객실 타입">
              <TextInput
                value={unit.roomType}
                onChange={(event) => setUnit((prev) => ({ ...prev, roomType: event.target.value }))}
              />
            </Field>
            <Field label="객실명">
              <TextInput
                value={unit.roomName}
                onChange={(event) => setUnit((prev) => ({ ...prev, roomName: event.target.value }))}
              />
            </Field>
          </div>
          <div className="two-col">
            <Field label="가격">
              <TextInput
                value={unit.price}
                onChange={(event) => setUnit((prev) => ({ ...prev, price: event.target.value }))}
              />
            </Field>
            <Field label="정원">
              <TextInput
                value={unit.capacity}
                onChange={(event) => setUnit((prev) => ({ ...prev, capacity: event.target.value }))}
              />
            </Field>
          </div>
          <button className="button button-primary" type="submit">
            <DoorOpen size={16} />
            저장
          </button>
        </form>
      </Panel>

      <StatusBanner status={status} message={message} />
    </div>
  );
}
