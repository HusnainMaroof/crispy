import type { Metadata } from "next";
import ContactPage from "@/app/components/store/contact-page";
import { pageMetadata } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/app/components/store/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Halal Burger Franchise Opportunities",
  description:
    "Open a Crispies halal burger and chicken franchise. Call, email or send us a message and we will get back to you within 24 hours.",
  path: "/franchise-inquiries",
});

export default function ContactRoute() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Franchise", path: "/franchise-inquiries" }]} />
      <ContactPage />
    </>
  );
}
