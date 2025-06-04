// MemoryVisualization.tsx
import React from 'react';
import { type PartitionState } from '../utils/partition';

interface MemoryVisualizationProps {
  memoryState: PartitionState;
  totalMemory: number;
  height: number;
}

const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({
  memoryState,
  totalMemory,
  height
}) => {
  const blocks = memoryState.blocks;
  
  return (
    <div 
      className="memory-bar" 
      style={{ 
        width: '100%', 
        height: `${height}px`,
        backgroundColor: '#f0f0f0',
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      {blocks.map((block, index) => {
        const blockWidth = (block.size / totalMemory) * 100;
        const blockColor = block.allocatedTo 
          ? `hsl(${parseInt(block.allocatedTo) * 40}, 70%, 60%)` 
          : '#4CAF50';
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${(block.start / totalMemory) * 100}%`,
              width: `${blockWidth}%`,
              height: '100%',
              backgroundColor: blockColor,
              borderRight: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            {block.allocatedTo ? `作业${block.allocatedTo}` : '空闲'}
            <div className="size-label">{block.size}K</div>
          </div>
        );
      })}
    </div>
  );
};

export default MemoryVisualization;