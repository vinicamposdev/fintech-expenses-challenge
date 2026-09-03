import { RouterProvider } from 'react-router-dom';
import { router } from './lib/router';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App(): JSX.Element {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
