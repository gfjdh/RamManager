# 内存管理模拟器

## 项目概述

这个内存管理模拟器是一个交互式教学工具，旨在帮助学生理解操作系统中的两种核心内存管理技术：
1. **动态分区分配**：模拟首次适应(FF)和最佳适应(BF)算法
2. **请求调页存储管理**：模拟FIFO和LRU页面置换算法

## 运行要求

- Node.js (v14+)
- npm (v6+)

## 安装与运行
### 快速使用
```bash
# 克隆仓库
git clone https://github.com/yourusername/memory-management-simulator.git

# 进入项目目录
cd memory-management-simulator

# 启动服务器
serve -s dist   
```
### 二次开发
```bash
# 克隆仓库
git clone https://github.com/yourusername/memory-management-simulator.git

# 进入项目目录
cd memory-management-simulator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构
```
src
├── App.css
├── App.tsx
├── index.css
├── main.tsx
├── vite-env.d.ts
├── assets
│   └── react.svg
├── components
│   ├── DynamicPartition.tsx
│   ├── MemoryVisualization.tsx
│   └── PageReplacement.tsx
└── utils
    ├── pagination.ts
    └── partition.ts
```

## 功能特性

### 动态分区分配模拟
- 支持首次适应(FF)和最佳适应(BF)算法
- 可视化内存分区状态
- 逐步执行分配和释放操作
- 显示作业使用情况
- 记录操作日志

### 请求调页存储管理
- 支持FIFO和LRU页面置换算法
- 自动生成符合特定规律的指令序列
- 可视化内存页框状态
- 显示页表状态
- 跟踪缺页率和执行进度
- 详细的模拟日志

## 使用方法

### 动态分区分配模拟
1. 选择算法（首次适应或最佳适应）
2. 点击"开始模拟"按钮
3. 点击"执行下一步"按钮逐步执行分配或释放操作
4. 观察内存可视化图、操作日志和作业使用情况

### 请求调页存储管理
1. 选择算法（FIFO或LRU）
2. 点击"开始模拟"按钮开始执行
3. 使用手动控制按钮逐步查看执行过程：
   - 上一步/下一步
   - 前进/后退10步
   - 跳转到开始/结束
4. 观察内存页框状态、页表状态、进度条和统计信息

## 实现细节

### 动态分区分配
- **核心算法**：在`partition.ts`中实现
- **内存表示**：
  - `MemoryBlock`：表示内存块（起始位置、大小、分配状态）
  - `FreeBlock`：表示空闲块（起始位置、结束位置）
  - `PartitionState`：表示整个内存状态（所有块、空闲块、已分配作业）
- **关键操作**：
  - `initMemory`：初始化内存
  - `executePartitionStep`：执行分配或释放操作
  - `allocateMemory`：实现FF和BF分配算法
  - `freeMemory`：释放内存并合并相邻空闲块

### 请求调页存储管理
- **核心算法**：在`pagination.ts`中实现
- **指令生成**：
  - 按照50%顺序执行、25%向前跳转、25%向后跳转的规律生成320条指令序列
- **页面置换**：
  - FIFO：使用队列记录页面进入顺序
  - LRU：记录每个页面的最后访问时间
- **状态跟踪**：
  - `SimulationStep`：记录每一步的状态（内存帧内容、缺页情况、置换页面等）

### 用户界面
- 使用React和TypeScript构建
- 直观的可视化：
  - 动态分区：彩色条形图表示不同作业
  - 页面置换：可视化内存帧和页表状态
- 详细的统计信息和操作日志

## 算法说明

### 动态分区分配算法
1. **首次适应(FF)**：
   - 从内存起始地址开始搜索
   - 选择第一个足够大的空闲分区
   - 时间复杂度：O(n)

2. **最佳适应(BF)**：
   - 搜索所有空闲分区
   - 选择大小最接近请求的空闲分区
   - 时间复杂度：O(n log n)（需要排序）

### 页面置换算法
1. **先进先出(FIFO)**：
   - 替换最先进入内存的页面
   - 使用队列跟踪页面加载顺序
   - 时间复杂度：O(1)

2. **最近最少使用(LRU)**：
   - 替换最近最久未使用的页面
   - 记录每个页面的最后访问时间
   - 时间复杂度：O(m)（m为内存帧数）