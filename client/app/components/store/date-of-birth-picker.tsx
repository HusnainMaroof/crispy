"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

/** Stored and sent as DD/MM/YYYY, the format the team reads in the email. */
type Day = { year: number; month: number; day: number };

const MIN_AGE = 18;
const OLDEST_YEARS = 100;

function parse(value: string): Day | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]) - 1, year: Number(match[3]) };
}

function format({ day, month, year }: Day): string {
  return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

/** The latest birthday that is still 18 or older today. */
function adultCutoff(): Day {
  const today = new Date();
  return { year: today.getFullYear() - MIN_AGE, month: today.getMonth(), day: today.getDate() };
}

const compare = (a: Day, b: Day) => a.year - b.year || a.month - b.month || a.day - b.day;

export default function DateOfBirthPicker({
  value,
  onChange,
  placeholder,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputClassName: string;
}) {
  const { locale, t } = useLocale();
  const [cutoff] = useState(adultCutoff);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: cutoff.year, month: cutoff.month });
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  // The calendar is drawn in document.body so no form section can paint over it.
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const dialogId = useId();
  const selected = parse(value);
  const intl = locale === "ar" ? "ar" : "en-GB";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapper.current?.contains(target) && !popover.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Close only the calendar, not the whole application form.
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(340, window.innerWidth - 48);
      const height = popover.current?.offsetHeight ?? 380;
      // Open upwards when there is no room below.
      const above = rect.bottom + 8 + height > window.innerHeight && rect.top - 8 - height > 0;
      const rtl = document.documentElement.dir === "rtl";
      const left = Math.min(Math.max(rtl ? rect.right - width : rect.left, 12), window.innerWidth - width - 12);
      setPosition({ top: above ? rect.top - 8 - height : rect.bottom + 8, left, above });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      const start = selected ?? cutoff;
      setView({ year: start.year, month: start.month });
    }
    setOpen((current) => !current);
  }

  const minYear = cutoff.year - (OLDEST_YEARS - MIN_AGE);
  const years = Array.from({ length: cutoff.year - minYear + 1 }, (_, index) => cutoff.year - index);
  const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(intl, { month: "long" }).format(new Date(2000, month, 1)));
  // Monday first: 3 Jan 2000 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(intl, { weekday: "narrow" }).format(new Date(2000, 0, 3 + index)));

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leading = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const atLatest = view.year === cutoff.year && view.month >= cutoff.month;
  const atEarliest = view.year === minYear && view.month === 0;

  function shift(offset: number) {
    setView(({ year, month }) => {
      const next = new Date(year, month + offset, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const display = selected
    ? new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric" }).format(new Date(selected.year, selected.month, selected.day))
    : "";

  const selectClass = "h-10 cursor-pointer rounded-lg border border-[#E2E2E2] bg-white px-2 text-sm font-semibold text-black outline-none transition-colors hover:border-[#BDBDBD] focus:border-[#FF0931]";
  const arrowClass = "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-black transition-colors hover:bg-[#F1F1F1] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className={`${inputClassName} flex items-center justify-between gap-3 text-start ${open ? "border-[#FF0931]!" : ""}`}
      >
        <span className={display ? "text-black" : "text-[#9A9A9A]"}>{display || placeholder}</span>
        <CalendarDays aria-hidden className={`size-5 shrink-0 ${open ? "text-[#FF0931]" : "text-[#7A7A7A]"}`} />
      </button>
      {/* Keeps the form's required check working on the visible button. */}
      <input tabIndex={-1} aria-hidden required value={value} onChange={() => undefined} className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0" />

      {open && createPortal(
        <div
          ref={popover}
          id={dialogId}
          role="dialog"
          aria-label={t("franchise.app.dobPick")}
          data-lenis-prevent
          dir={locale === "ar" ? "rtl" : "ltr"}
          style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, transformOrigin: position?.above ? "bottom left" : "top left" }}
          className="dob-pop fixed z-[1001] w-[min(340px,calc(100vw-48px))] rounded-2xl border border-[#E6E6E6] bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center gap-1.5" dir="ltr">
            <button type="button" onClick={() => shift(-1)} disabled={atEarliest} aria-label={t("franchise.app.dobPrev")} className={arrowClass}>
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <select aria-label={t("franchise.app.dobMonth")} value={view.month} onChange={(event) => setView((current) => ({ ...current, month: Number(event.target.value) }))} className={`${selectClass} min-w-0 flex-1`}>
              {monthNames.map((name, month) => (
                <option key={name} value={month} disabled={view.year === cutoff.year && month > cutoff.month}>{name}</option>
              ))}
            </select>
            <select
              aria-label={t("franchise.app.dobYear")}
              value={view.year}
              onChange={(event) => {
                const year = Number(event.target.value);
                setView((current) => ({ year, month: year === cutoff.year ? Math.min(current.month, cutoff.month) : current.month }));
              }}
              className={selectClass}
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <button type="button" onClick={() => shift(1)} disabled={atLatest} aria-label={t("franchise.app.dobNext")} className={arrowClass}>
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center" dir={locale === "ar" ? "rtl" : "ltr"}>
            {weekdays.map((name, index) => (
              <span key={`${name}-${index}`} className="py-1 text-[11px] font-semibold uppercase text-[#9A9A9A]">{name}</span>
            ))}
            {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day: Day = { year: view.year, month: view.month, day: index + 1 };
              const isSelected = selected !== null && compare(day, selected) === 0;
              const tooYoung = compare(day, cutoff) > 0;
              return (
                <button
                  key={day.day}
                  type="button"
                  disabled={tooYoung}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(format(day));
                    setOpen(false);
                  }}
                  className={`aspect-square cursor-pointer rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:text-[#D0D0D0] disabled:hover:bg-transparent ${isSelected ? "bg-[#FF0931] font-semibold text-white shadow-[0_6px_16px_rgba(255,9,49,0.35)]" : "text-black hover:bg-[#FFE8EC] hover:text-[#FF0931]"}`}
                >
                  {day.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EFEFEF] pt-3">
            <p className="text-[12px] leading-snug text-[#7A7A7A]">{t("franchise.app.dobAge")}</p>
            {value && (
              <button type="button" onClick={() => onChange("")} className="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#FF0931] transition-colors hover:bg-[#FFE8EC]">
                {t("franchise.app.dobClear")}
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
