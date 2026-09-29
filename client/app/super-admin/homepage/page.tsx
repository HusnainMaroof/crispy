import { redirect } from "next/navigation";

export default function HomepageRedirectPage() {
  redirect("/super-admin/cms/home");
}
