// App.tsx
import React, { useState } from 'react';
import DynamicPartition from './components/DynamicPartition';
import PageReplacement from './components/PageReplacement';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partition' | 'page'>('partition');

  return (
    <div className="app" style={{ width: '130%', margin: '0' }}>
      <header className="header">
        <h1>内存管理模拟器</h1>
        <nav>
          <button 
            className={activeTab === 'partition' ? 'active' : ''}
            onClick={() => setActiveTab('partition')}
          >
            动态分区分配模拟
          </button>
          <button 
            className={activeTab === 'page' ? 'active' : ''}
            onClick={() => setActiveTab('page')}
          >
            请求调页存储管理
          </button>
        </nav>
      </header>
      
      <main>
        {activeTab === 'partition' ? <DynamicPartition /> : <PageReplacement />}
      </main>
      
      <footer>
        <p>操作系统原理课程设计 - 内存管理模拟器</p>
      </footer>
    </div>
  );
};

export default App;