"use client";
import Dropdown from "./dropdown";
import MultiSelect from "./multi-select";
import { adminInput } from "./list-toolbar";
import { ROLE_ACCESS, STAFF_POSITIONS, type AdminRole } from "@/lib/admin/roles";
import { TAB_PICKER_LABELS, type AdminTabId } from "@/lib/admin/tabs";

export default function TeamAccessFields({ role, position, onPositionChange, tabs, onTabsChange, branchIds, onBranchesChange, branches, actorRole, actorTabs }: {
  role: AdminRole; position: string; onPositionChange: (value: string) => void;
  tabs: string[]; onTabsChange: (value: string[]) => void; branchIds: string[]; onBranchesChange: (value: string[]) => void;
  branches: { id: string; name: string }[]; actorRole: AdminRole; actorTabs: string[];
}) {
  const custom = position !== "" && !STAFF_POSITIONS.includes(position);
  const choices = ROLE_ACCESS[role].filter((id) => actorRole === "superadmin" || actorTabs.includes(id));
  return <div className="space-y-5">
    {role === "staff" && <div className="space-y-2">
      <label htmlFor="staff-position" className="block text-sm text-white/70">Job position</label>
      <Dropdown id="staff-position" value={custom ? "custom" : position} placeholder="Choose their job" options={[...STAFF_POSITIONS.map((value) => ({ value, label: value })), { value: "custom", label: "Custom position" }]} onChange={(value) => onPositionChange(value === "custom" ? " " : value)} />
      {custom && <input required maxLength={100} aria-label="Custom job position" placeholder="e.g. Kitchen supervisor" value={position} onChange={(event) => onPositionChange(event.target.value || " ")} className={adminInput} />}
      <p className="text-xs leading-relaxed text-white/50">Their job title. Access is set separately below.</p>
    </div>}
    {(role === "staff" || role === "branch_manager") && <MultiSelect label="Assigned branches" placeholder="Choose branches" options={branches.map((branch) => ({ value: branch.id, label: branch.name }))} value={branchIds} onChange={onBranchesChange} />}
    {role === "superadmin" ? <p className="text-sm text-white/60">Super admins have access to every area.</p> : <MultiSelect label="Panel access" placeholder="Choose areas" options={choices.map((id) => ({ value: id, label: TAB_PICKER_LABELS[id as AdminTabId] }))} value={tabs} onChange={onTabsChange} />}
    <p className="border-l-2 border-brand-red pl-3 text-xs leading-relaxed text-white/60">{role === "branch_manager" ? "Can manage orders, branch menus, and team members in assigned branches. Cannot change the shared catalogue, website, or business settings." : role === "staff" ? "Can use the selected areas in assigned branches. Cannot add people, change access, or edit the shared catalogue." : "Access applies across all branches."}</p>
  </div>;
}
