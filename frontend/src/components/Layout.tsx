import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';

export function Layout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (): void => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">Fintech Expenses</h1>
              <div className="flex gap-6">
                <Link
                  to="/"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/categories"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/categories')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Categories
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>&copy; 2026 Fintech Expenses Challenge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
