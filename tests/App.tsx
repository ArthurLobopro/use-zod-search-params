import { Navigate, Route, Routes } from "react-router-dom";
import UserTable from "./components/UserTable";

function App() {
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500">
            View and manage user access. Pagination and search states are
            persisted in the URL.
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Routes>
            <Route path="/" element={<UserTable />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
