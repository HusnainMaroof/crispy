"use client";

import type { CSSProperties } from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

const calendarStyle = {
  "--rdp-accent-color": "#ff0931",
  "--rdp-accent-background-color": "rgba(255, 9, 49, 0.18)",
  "--rdp-day-height": "44px",
  "--rdp-day-width": "44px",
  "--rdp-day_button-height": "44px",
  "--rdp-day_button-width": "44px",
  "--rdp-nav_button-height": "44px",
  "--rdp-nav_button-width": "44px",
  color: "#fff",
} as CSSProperties;

export function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      {...props}
      style={{ ...calendarStyle, ...props.style }}
    />
  );
}
