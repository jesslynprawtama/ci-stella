import { FileText } from 'lucide-react';
import { MonthlyReport } from './components/MonthlyReport';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="size-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Vendor Database Management
              </h1>
            </div>
            <h2 className="text-2xl text-gray-700 mb-2">Monthly Progress Report</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive monthly progress tracking for vendor database cleanup, standardization, and synchronization activities
            </p>
          </div>
          
          {/* Main Report Component */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <MonthlyReport />
          </div>

          {/* Project Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3">📊 Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="mb-2"><strong>Total Vendors:</strong> 10,308 records</p>
                <p className="mb-2"><strong>Database History:</strong> Established since 2017</p>
                <p><strong>Current Phase:</strong> Standardization and cleanup</p>
              </div>
              <div>
                <p className="mb-2"><strong>Key Milestone:</strong> Rules created between end of 2025 until now, still in progress</p>
                <p className="mb-2"><strong>Databases:</strong> MJS and WSI synchronization</p>
                <p><strong>Focus:</strong> Data quality, compliance, and system optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}