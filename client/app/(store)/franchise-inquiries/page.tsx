import type { Metadata } from "next";
import ContactPage from "@/app/components/store/contact-page";

export const metadata: Metadata = {
  title: "Franchise Inquiries — Crispies",
  description:
    "Get in touch with Crispies — call, email or send us a message and we'll get back to you within 24 hours.",
};

export default function ContactRoute() {
  return <ContactPage />;
}
