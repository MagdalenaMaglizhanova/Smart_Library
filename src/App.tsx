// src/App.tsx
import React from 'react';
import Layout from './pages/Layout';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}

export default App;