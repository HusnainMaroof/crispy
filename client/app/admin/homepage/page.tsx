import { redirect } from "next/navigation";

export default function HomepageRedirectPage() {
  redirect("/admin/cms/home");
}
