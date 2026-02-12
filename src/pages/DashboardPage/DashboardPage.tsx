import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
}

interface RecentActivityItem {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  action: string;
  timestamp: string;
}

interface DashboardData {
  stats: StatCardData[];
  recentActivity: RecentActivityItem[];
  salesData: { month: string; sales: number }[];
}

// --- MOCK API ---

const mockApi = {
  fetchDashboardData: (): Promise<DashboardData> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate a 50% chance of API failure
        if (Math.random() > 0.5) {
          resolve({
            stats: [
              { title: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month', changeType: 'increase', icon: DollarSign },
              { title: 'Subscriptions', value: '+2,350', change: '+180.1% from last month', changeType: 'increase', icon: Users },
              { title: 'Sales', value: '+12,234', change: '+19% from last month', changeType: 'increase', icon: BarChart3 },
              { title: 'Active Now', value: '573', change: '+201 since last hour', changeType: 'increase', icon: Activity },
            ],
            recentActivity: [
              { id: '1', user: { name: 'Olivia Martin', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026704d' }, action: 'purchased a new plan.', timestamp: '2m ago' },
              { id: '2', user: { name: 'Jackson Lee', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026705d' }, action: 'upgraded to Pro.', timestamp: '10m ago' },
              { id: '3', user: { name: 'Isabella Nguyen', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026706d' }, action: 'cancelled their subscription.', timestamp: '30m ago' },
              { id: '4', user: { name: 'William Kim', avatarUrl: 'https://i.pravatar.cc/40?u=a042581f4e29026707d' }, action: 'left a review.', timestamp: '1h ago' },
            ],
            salesData: [
                { month: 'Jan', sales: 4000 }, { month: 'Feb', sales: 3000 }, { month: 'Mar', sales: 5000 },
                { month: 'Apr', sales: 4500 }, { month: 'May', sales: 6000 }, { month: 'Jun', sales: 5500 },
            ],
          });
        } else {
          reject(new Error('Failed to fetch dashboard data. Please try again.'));
        }
      }, 1500); // Simulate network delay
    });
  },
};

// --- UI SUB-COMPONENTS ---

const StatCard: React.FC<StatCardData> = ({ title, value, change, changeType, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className={`text-xs mt-1 ${changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {change}
    </p>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 mb-8"></div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-700 rounded-xl h-80"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80"></div>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">An Error Occurred</h3>
    <p className="text-red-600 dark:text-red-300 mt-2 mb-6">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </button>
  </div>
);


// --- MAIN PAGE COMPONENT ---

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mockApi.fetchDashboardData();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={fetchData} />;
    }

    if (data) {
      return (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's a summary of your account.</p>
            </div>
            <Link
              to="/reports/new"
              className="hidden sm:flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-sm"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Report
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 mt-6 lg:grid-cols-5">
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Overview</h3>
                <div className="h-72 flex items-center justify-center text-gray-400">
                    {/* Placeholder for a chart component like Recharts or Chart.js */}
                    <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                    <p className="ml-4">Chart Component would be rendered here.</p>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <ul className="space-y-4">
                {data.recentActivity.map(item => (
                    <li key={item.id} className="flex items-center space-x-3">
                        <img src={item.user.avatarUrl} alt={item.user.name} className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                <span className="font-semibold">{item.user.name}</span> {item.action}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                        </div>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Your App</title>
        <meta name="description" content="Main dashboard providing an overview of your account statistics and recent activity." />
      </Helmet>
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </>
  );
};

export default DashboardPage;