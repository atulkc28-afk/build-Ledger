import React, { useEffect, useState } from 'react';
import { Plus, Save, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { ProjectMember, ProjectStatus } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';

export const SettingsPage: React.FC = () => {
  const {
    currentRole,
    currentUser,
    activeProject,
    updateProjectSettings,
    inviteProjectMember,
    resetDemoData,
  } = useApp();

  const [name, setName] = useState(activeProject.name);
  const [location, setLocation] = useState(activeProject.location);
  const [description, setDescription] = useState(activeProject.description);
  const [totalBudget, setTotalBudget] = useState(String(activeProject.totalBudget));
  const [startDate, setStartDate] = useState(activeProject.startDate);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    activeProject.expectedCompletionDate,
  );
  const [status, setStatus] = useState<ProjectStatus>(activeProject.status);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<ProjectMember['role']>('Architect');
  const [memberPerms, setMemberPerms] = useState<ProjectMember['permissions']>('View Only');

  useEffect(() => {
    setName(activeProject.name);
    setLocation(activeProject.location);
    setDescription(activeProject.description);
    setTotalBudget(String(activeProject.totalBudget));
    setStartDate(activeProject.startDate);
    setExpectedCompletionDate(activeProject.expectedCompletionDate);
    setStatus(activeProject.status);
  }, [activeProject]);

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectSettings(activeProject.id, {
      name: name.trim() || activeProject.name,
      location: location.trim() || activeProject.location,
      description: description.trim(),
      totalBudget:
        currentRole === 'homeowner' && Number(totalBudget) > 0
          ? Math.round(Number(totalBudget))
          : activeProject.totalBudget,
      startDate,
      expectedCompletionDate,
      status,
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    inviteProjectMember(activeProject.id, {
      name: memberName.trim(),
      email: memberEmail.trim(),
      role: memberRole,
      permissions: memberPerms,
    });
    setMemberName('');
    setMemberEmail('');
    setInviteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            {currentRole === 'homeowner' ? 'Project Settings' : 'Profile & Project Settings'}
          </h1>
          <p className="mt-1 text-sm text-[#707987]">
            Configuration, approved budget, and access permissions for {activeProject.name}
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemoData}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#20252D] hover:bg-[#F0F2F5] cursor-pointer"
        >
          Reset Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Details Form */}
        <form
          onSubmit={handleSaveProject}
          className="lg:col-span-7 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-[#172B4D]">Project Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                disabled={currentRole !== 'homeowner'}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] disabled:bg-[#F7F8FA] disabled:text-[#707987] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Location</label>
              <input
                type="text"
                value={location}
                disabled={currentRole !== 'homeowner'}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] disabled:bg-[#F7F8FA] disabled:text-[#707987] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Project Scope & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Total Approved Budget (₹)
              </label>
              <input
                type="number"
                value={totalBudget}
                disabled={currentRole !== 'homeowner'}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] disabled:bg-[#F7F8FA] disabled:text-[#707987] focus:outline-none focus:border-[#172B4D]"
              />
              <span className="text-[11px] font-mono text-[#707987]">
                {formatINR(Number(totalBudget) || activeProject.totalBudget)}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Expected Completion
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Homeowner & Contractor Profile Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E6E9EF] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#172B4D]">Your Account Profile</h2>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#707987]">Name</span>
                <span className="font-semibold text-[#172B4D]">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707987]">Email</span>
                <span className="font-mono text-[#20252D]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707987]">Role</span>
                <span className="capitalize font-medium text-[#172B4D]">{currentUser.role}</span>
              </div>
              {currentUser.companyName && (
                <div className="flex justify-between">
                  <span className="text-[#707987]">Firm</span>
                  <span className="font-medium text-[#172B4D]">{currentUser.companyName}</span>
                </div>
              )}
              {currentUser.gstNumber && (
                <div className="flex justify-between">
                  <span className="text-[#707987]">GSTIN</span>
                  <span className="font-mono text-[#20252D]">{currentUser.gstNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E6E9EF] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#172B4D]">Project Stakeholders</h2>
            <div className="text-xs space-y-3">
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
                <div className="text-[11px] text-[#707987]">Homeowner</div>
                <div className="font-semibold text-[#172B4D]">{activeProject.homeownerName}</div>
                <div className="text-[#707987]">
                  {activeProject.homeownerEmail} · {activeProject.homeownerPhone}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
                <div className="text-[11px] text-[#707987]">Assigned Contractor</div>
                <div className="font-semibold text-[#172B4D]">
                  {activeProject.contractorName} — {activeProject.contractorCompany}
                </div>
                <div className="text-[#707987]">
                  {activeProject.contractorEmail} · {activeProject.contractorPhone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Members & Permissions */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Project Members & Permissions
            </h2>
            <p className="text-xs text-[#707987]">
              Invite architects, co-owners, or site supervisors with scoped visibility
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E6E9EF] text-[#707987]">
                <th className="py-2.5 px-3 font-medium">Name</th>
                <th className="py-2.5 px-3 font-medium">Email</th>
                <th className="py-2.5 px-3 font-medium">Role</th>
                <th className="py-2.5 px-3 font-medium">Permissions</th>
                <th className="py-2.5 px-3 font-medium text-right">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {activeProject.members.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 px-3 font-semibold text-[#172B4D]">{m.name}</td>
                  <td className="py-3 px-3 font-mono text-[#707987]">{m.email}</td>
                  <td className="py-3 px-3 capitalize text-[#20252D]">{m.role}</td>
                  <td className="py-3 px-3 text-[#707987]">{m.permissions}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#707987]">
                    {formatDate(m.addedDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Project Member">
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="e.g., Arjun Menon"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Email *</label>
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="arjun@studio.in"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Role</label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as ProjectMember['role'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white"
              >
                <option value="Architect">Architect</option>
                <option value="Site Supervisor">Site Supervisor</option>
                <option value="homeowner">Co-Homeowner</option>
                <option value="contractor">Sub-Contractor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Permissions</label>
              <select
                value={memberPerms}
                onChange={(e) => setMemberPerms(e.target.value as ProjectMember['permissions'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white"
              >
                <option value="View Only">View Only</option>
                <option value="Record & Manage Site Operations">
                  Record & Manage Site Operations
                </option>
                <option value="Full Review & Acknowledge">Full Review & Acknowledge</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
