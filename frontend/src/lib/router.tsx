import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: '/login',
    element: <div className="min-h-screen flex items-center justify-center">Login Page (Coming Soon)</div>,
  },
  {
    path: '/register',
    element: <div className="min-h-screen flex items-center justify-center">Register Page (Coming Soon)</div>,
  },
]);
