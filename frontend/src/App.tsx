import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  unstable_HistoryRouter as HistoryRouter,
} from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// 使用React.lazy进行代码分割
const HomePage = React.lazy(() => import('./pages/HomePage'));
const GamePage = React.lazy(() => import('./pages/GamePage'));

// 配置React Router未来标记以消除警告
const future = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

function App() {
  return (
    <ErrorBoundary>
      <Router future={future}>
        <div className='App'>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/game' element={<GamePage />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
