// DynamicPartition.tsx
import React, { useState, useEffect, useRef } from 'react';
import MemoryVisualization from './MemoryVisualization';
import { executePartitionStep, initMemory, type PartitionAlgorithm, type PartitionState } from '../utils/partition';

// 定义步骤类型
type StepType = 'allocate' | 'free';
interface Step {
  type: StepType;
  jobId: number;
  size?: number;
}

const DynamicPartition: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [algorithm, setAlgorithm] = useState<PartitionAlgorithm>('FF');
  const [memoryState, setMemoryState] = useState<PartitionState | null>(null);
  const [operationLog, setOperationLog] = useState<string[]>([]);
  const timerIds = useRef<number[]>([]);
  
  const steps: Step[] = [
    { type: 'allocate', jobId: 1, size: 130 },
    { type: 'allocate', jobId: 2, size: 60 },
    { type: 'allocate', jobId: 3, size: 100 },
    { type: 'free', jobId: 2 },
    { type: 'allocate', jobId: 4, size: 200 },
    { type: 'free', jobId: 3 },
    { type: 'free', jobId: 1 },
    { type: 'allocate', jobId: 5, size: 140 },
    { type: 'allocate', jobId: 6, size: 60 },
    { type: 'allocate', jobId: 7, size: 50 },
    { type: 'free', jobId: 6 },
  ];

  useEffect(() => {
    resetSimulation();
    return () => {
      // 组件卸载时清理所有定时器
      timerIds.current.forEach(id => clearTimeout(id));
    };
  }, [algorithm]);

  const resetSimulation = () => {
    // 清理现有定时器
    timerIds.current.forEach(id => clearTimeout(id));
    timerIds.current = [];
    setCurrentStep(0);
    setOperationLog([]);
    const initialState = initMemory(640);
    setMemoryState(initialState);
    setOperationLog(["初始状态：640K 空闲内存"]);
  };

  const executeStep = () => {
    if (!memoryState || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    const result = executePartitionStep(memoryState, algorithm, step);
    
    setMemoryState(result.state);
    
    const logEntry = 
      step.type === 'allocate' 
        ? `作业${step.jobId}申请${step.size}K - ${result.success ? "成功" : "失败"}`
        : `作业${step.jobId}释放内存`;
        
    setOperationLog([...operationLog, logEntry]);
    setCurrentStep(currentStep + 1);
  };

  const runAllSteps = () => {
    resetSimulation();
    steps.forEach(() => {
      // 模拟逐步执行
      setTimeout(executeStep, 800);
    });
  };

  return (
    <div className="dynamic-partition">
      <div className="controls">
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as PartitionAlgorithm)}>
          <option value="FF">首次适应算法</option>
          <option value="BF">最佳适应算法</option>
        </select>
        <button onClick={resetSimulation}>重置</button>
        <button onClick={executeStep} disabled={currentStep >= steps.length}>
          执行下一步
        </button>
        <button onClick={runAllSteps} disabled={currentStep >= steps.length}>
          全部执行
        </button>
      </div>
      
      {memoryState && (
        <div className="memory-visualization-container">
          <div className="memory-header">
            <span className="free-block-label">空闲分区: {memoryState.freeBlocks.map(b => `${b.start}K-${b.end}K`).join(', ')}</span>
            <span className="total-memory">总内存: 640K</span>
          </div>
          <MemoryVisualization 
            memoryState={memoryState} 
            totalMemory={640} 
            height={60}
          />
        </div>
      )}
      
      <div className="operation-log">
        <h3>操作记录</h3>
        <ul>
          {operationLog.map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      </div>
      
      <div className="status">
        <h3>当前状态: 步骤 {currentStep}/{steps.length}</h3>
        <div className="job-list">
          <h4>作业使用情况</h4>
          {memoryState && Object.entries(memoryState.allocatedJobs).map(([jobId, block]) => (
            <div key={jobId} className="job-info">
              作业{jobId}: {block.start}K-{block.size}K ({block.size - block.start}K)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicPartition;