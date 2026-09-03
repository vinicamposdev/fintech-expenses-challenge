import { RouterProvider } from 'react-router-dom';
import { router } from './lib/router';
import './index.css';

function App(): JSX.Element {
  return <RouterProvider router={router} />;
}

export default App;
