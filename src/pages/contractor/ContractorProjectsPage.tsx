import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  calculateOverallReportedProgress,
  calculateProjectFinancials,
} from '../../utils/calculations';
import { formatINR } from '../../utils/formatters';

export const ContractorProjectsPage: React.FC = () => {
  const { projects, expenses, payments, stages, activeProject, setActiveProjectId } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#172B4D]">My Projects</h1>
        <p className="mt-1 text-sm text-[#707987]">
          Switch between assigned residential construction workspaces
        </p>
      </div>

      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Homeowner</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Budget</th>
                <th className="py-3 px-4 text-right">Recorded Expenses</th>
                <th className="py-3 px-4 text-right">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF] text-xs">
              {projects.map((prj) => {
                const fin = calculateProjectFinancials(prj, expenses, payments);
                const prog = calculateOverallReportedProgress(stages, prj.id);
                const isActive = prj.id === activeProject.id;

                return (
                  <tr
                    key={prj.id}
                    onClick={() => {
                      setActiveProjectId(prj.id);
                      navigate('/contractor/expenses');
                    }}
                    className={`hover:bg-[#F7F8FA] transition-colors cursor-pointer ${
                      isActive ? 'bg-[#F7F8FA]/80' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172B4D]">{prj.name}</div>
                      <div className="text-[11px] text-[#707987] font-mono">{prj.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#20252D]">{prj.homeownerName}</td>
                    <td className="py-3.5 px-4 text-[#707987]">{prj.location}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#172B4D]">
                      {formatINR(prj.totalBudget)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                      {formatINR(fin.totalRecordedExpenses)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#2563EB]">
                      {prog}%
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge label={prj.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProjectId(prj.id);
                          navigate('/contractor/expenses');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#172B4D] text-white text-xs font-semibold hover:bg-[#172B4D]/90 cursor-pointer"
                      >
                        {isActive ? 'Active Workspace' : 'Open'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
