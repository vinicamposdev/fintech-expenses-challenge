import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Categories } from '../pages/Categories';
import { Transactions } from '../pages/Transactions';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: 'categories',
            element: <Categories />,
          },
          {
            path: 'transactions',
            element: <Transactions />,
          },
        ],
      },
    ],
  },
]);
