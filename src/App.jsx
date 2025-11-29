import React, { useState, useEffect } from 'react';
import DispatcherDashboard from './components/DispatcherDashboard';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return <DispatcherDashboard onNavigate={navigate} sharedData={sharedData} />;
}

export default App;
