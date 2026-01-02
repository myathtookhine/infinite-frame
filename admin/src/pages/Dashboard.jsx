import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  return (
    <main className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="font-sans text-3xl sm:text-5xl mb-2">Dashboard</h2>
        <p className="font-sans text-gray-600 text-sm sm:text-lg">Welcome to the Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="border-2 border-black p-6 sm:p-8 rounded-md transition-shadow hover:shadow-md">
          <div className="font-sans text-sm text-gray-600 mb-2">Total Frames</div>
          <div className="font-sans text-4xl sm:text-5xl">0</div>
        </div>
        <div className="border-2 border-black p-6 sm:p-8 rounded-md transition-shadow hover:shadow-md">
          <div className="font-sans text-sm text-gray-600 mb-2">Active Users</div>
          <div className="font-sans text-4xl sm:text-5xl">0</div>
        </div>
        <div className="border-2 border-black p-6 sm:p-8 rounded-md transition-shadow hover:shadow-md">
          <div className="font-sans text-sm text-gray-600 mb-2">Sessions</div>
          <div className="font-sans text-4xl sm:text-5xl">0</div>
        </div>
      </div>

      {/* Zen Quote */}
      <div className="border-2 border-black p-8 sm:p-12 text-center rounded-md">
        <p className="font-sans text-xl sm:text-2xl mb-4">"Everything is temporary"</p>
        <p className="font-sans text-sm text-gray-600">— Infinite Frame Philosophy</p>
      </div>
    </main>
  );
};

export default Dashboard;
