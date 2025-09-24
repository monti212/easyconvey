import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  User,
  Building,
  RefreshCw
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  activeMatters: number;
  completedThisMonth: number;
  averageTime: string;
}

interface OngoingMattersProps {
  totalMatters: number;
  completedMatters: number;
  teamMembers: TeamMember[];
}

const OngoingMattersSection: React.FC<OngoingMattersProps> = ({
  totalMatters,
  completedMatters,
  teamMembers
}) => {
  const [viewMode, setViewMode] = useState<'progress' | 'team' | 'performance'>('progress');

  // Mock progress data by transaction type
  const progressByType = [
    {
      type: 'Transfers',
      total: 24,
      completed: 8,
      inProgress: 12,
      pending: 4,
      averageDays: 21,
      color: 'blue'
    },
    {
      type: 'Bonds',
      total: 18,
      completed: 12,
      inProgress: 5,
      pending: 1,
      averageDays: 14,
      color: 'green'
    },
    {
      type: 'Subdivisions',
      total: 8,
      completed: 2,
      inProgress: 4,
      pending: 2,
      averageDays: 45,
      color: 'purple'
    },
    {
      type: 'Servitudes',
      total: 5,
      completed: 3,
      inProgress: 2,
      pending: 0,
      averageDays: 30,
      color: 'amber'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
  };

  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const renderProgressView = () => (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matters</p>
              <p className="text-2xl font-bold text-gray-900">{totalMatters}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedMatters}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalMatters - completedMatters}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateProgress(completedMatters, totalMatters)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress by Transaction Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress by Transaction Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressByType.map((item) => (
            <div key={item.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">{item.type}</h4>
                <span className="text-sm text-gray-500">
                  {item.completed}/{item.total} completed
                </span>
              </div>
              
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{calculateProgress(item.completed, item.total)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getColorClasses(item.color)}`}
                      style={{ width: `${calculateProgress(item.completed, item.total)}%` }}
                    />
                  </div>
                </div>
                
                {/* Status Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-green-600">{item.completed}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-blue-600">{item.inProgress}</p>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-600">{item.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Average completion time: <span className="font-medium">{item.averageDays} days</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeamView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Team Member</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Active Matters</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Completed</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Workload</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">{member.activeMatters}</td>
                <td className="py-3 px-4 text-sm text-green-600 font-medium">{member.completedThisMonth}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{member.averageTime}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          member.activeMatters > 10 ? 'bg-red-500' : 
                          member.activeMatters > 5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (member.activeMatters / 15) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs ${
                      member.activeMatters > 10 ? 'text-red-600' : 
                      member.activeMatters > 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {member.activeMatters > 10 ? 'High' : 
                       member.activeMatters > 5 ? 'Medium' : 'Light'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPerformanceView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Week's Due Dates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-red-600 mr-2" />
            Due This Week
          </h3>
          
          <div className="space-y-3">
            {[
              { matter: 'TXN-001', client: 'John Smith', dueDate: 'Tomorrow', priority: 'high' },
              { matter: 'TXN-004', client: 'Jane Doe', dueDate: 'Friday', priority: 'medium' },
              { matter: 'BOND-001', client: 'ABC Bank', dueDate: 'This Week', priority: 'low' }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.matter}</p>
                  <p className="text-sm text-gray-600">{item.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.dueDate}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            Potential Bottlenecks
          </h3>
          
          <div className="space-y-3">
            {[
              { 
                issue: 'Documents Pending Review', 
                count: 8, 
                action: 'Assign reviewer',
                severity: 'medium'
              },
              { 
                issue: 'Awaiting Client Response', 
                count: 5, 
                action: 'Send reminder',
                severity: 'low'
              },
              { 
                issue: 'Deeds Office Delays', 
                count: 3, 
                action: 'Follow up',
                severity: 'high'
              }
            ].map((bottleneck, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{bottleneck.issue}</p>
                  <p className="text-sm text-gray-600">{bottleneck.count} matters affected</p>
                </div>
                <div className="text-right">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                    {bottleneck.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Performance Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        {/* Simple chart representation */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const height = Math.random() * 80 + 20; // Mock data
            return (
              <div key={day} className="text-center">
                <div className="bg-gray-100 rounded-lg h-24 flex items-end justify-center mb-2">
                  <div 
                    className="bg-blue-500 rounded w-full"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{day}</span>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">47</p>
            <p className="text-sm text-gray-600">Matters Processed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">18.5</p>
            <p className="text-sm text-gray-600">Avg Days to Complete</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">94%</p>
            <p className="text-sm text-gray-600">Client Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode('progress')}
            className={`flex items-center px-4 py-2 rounded-xl font-medium ${
              viewMode === 'progress' 
                ? 'bg-primary text-white shadow-soft' 
                : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Progress
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center px-4 py-2 rounded-xl font-medium ${
              viewMode === 'team' 
                ? 'bg-primary text-white shadow-soft' 
                : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Team
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`flex items-center px-4 py-2 rounded-xl font-medium ${
              viewMode === 'performance' 
                ? 'bg-primary text-white shadow-soft' 
                : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Reports
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'progress' && renderProgressView()}
      {viewMode === 'team' && renderTeamView()}
      {viewMode === 'performance' && renderPerformanceView()}
    </div>
  );
};

export default OngoingMattersSection;