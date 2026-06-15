import React, { useState } from 'react';
import { FileEdit, GitBranch, Clock, ArrowRight } from 'lucide-react';

const AppCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  accentColor = '#ff8300',
}) => (
  <div
    onClick={onClick}
    className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
  >
    {/* Fluent 2 inspired hover accent bar */}
    <div
      className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ backgroundColor: accentColor }}
    />

    <div className="flex items-center gap-4 mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, #d83b01)`,
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">
        {title}
      </h3>
    </div>

    <p className="text-gray-500 text-sm flex-1 leading-relaxed">
      {description}
    </p>

    <div
      className="mt-6 flex items-center text-sm font-semibold transition-colors duration-200"
      style={{ color: accentColor }}
    >
      Launch Tool{' '}
      <ArrowRight className="ml-1 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
    </div>
  </div>
);

export default function App() {
  // Mocking react-router's useNavigate for the preview environment
  const [currentRoute, setCurrentRoute] = useState('/');

  const navigate = (path) => {
    setCurrentRoute(path);
  };

  // Mock routed page view
  if (currentRoute !== '/') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 text-orange-600">
            <GitBranch size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Navigated to {currentRoute}
          </h2>
          <p className="text-gray-500 mb-6">
            This is a mock page transition to demonstrate routing.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#ff8300] hover:bg-[#d83b01] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Fluent Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm"
            style={{ background: 'linear-gradient(135deg, #ff8300, #ff4700)' }}
          >
            T
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-gray-900">
              Toolbox
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500">
            Select a tool below to start a new project or continue your work.
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AppCard
            title="Autodoc"
            description="Generate comprehensive, industry-standard Statements of Work using AI-assisted recipes and custom modules."
            icon={FileEdit}
            onClick={() => navigate('/autodoc')}
          />
          <AppCard
            title="Autoflow"
            description="Design architecture and flow diagrams using a flexible, drag-and-drop canvas with automatic routing."
            icon={GitBranch}
            onClick={() => navigate('/autoflow')}
          />
          <AppCard
            title="Shift Modeler"
            description="Dynamically model 24/7 shift coverage, core business hours, and capacity overlaps for client proposals."
            icon={Clock}
            onClick={() => navigate('/shift-modeler')}
          />
        </div>
      </main>
    </div>
  );
}
