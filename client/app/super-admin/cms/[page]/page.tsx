import { redirect } from "next/navigation";
import CmsEditor from "../cms-editor";

const LEGACY_TABS = ["homepage", "flavours", "partner"];

export default async function CmsPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (LEGACY_TABS.includes(page)) redirect("/super-admin/cms/home");
  return <CmsEditor key={page} pageId={page} />;
}
