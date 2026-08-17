import { Navigate, NavLink, Route, Routes } from "react-router";
import BasicPage from "./pages/BasicPage";
import ClearDefaultsPage from "./pages/ClearDefaultsPage";
import StrictPage from "./pages/StrictPage";

function App() {
  const tabs = [
    { path: "/basic", label: "Basic Config", desc: "Default hook options" },
    {
      path: "/clear-defaults",
      label: "Clear Defaults",
      desc: "Stripped defaults",
    },
    { path: "/strict", label: "Strict Mode", desc: "Throw on parse error" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              useZodSearchParams
            </h1>
            <p className="text-sm text-slate-500">
              Interactive test application showcasing different configurations,
              validations, and options.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              v1.2.0
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              React 19
            </span>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 max-w-max">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`
              }
              data-testid={`tab-${tab.path.replace("/", "")}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <main className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Routes>
            <Route path="/basic" element={<BasicPage />} />
            <Route path="/clear-defaults" element={<ClearDefaultsPage />} />
            <Route path="/strict" element={<StrictPage />} />
            <Route path="/" element={<Navigate to="/basic" replace />} />
            <Route path="*" element={<Navigate to="/basic" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
