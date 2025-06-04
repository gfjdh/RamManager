// pagination.ts
export type PageReplacementAlgorithm = 'FIFO' | 'LRU';

export interface SimulationStep {
  step: number;
  instructionAddress: number;
  page: number; // 指令所在页面
  memoryFrames: (number | null)[]; // 每个内存帧中存储的页面（null表示空闲）
  pageFault: boolean; // 是否发生缺页
  replacedPage: number | null; // 被替换的页面
  replacedFrame: number | null; // 发生置换的帧
  referencedPages: number[]; // 当前步骤被访问的页面
}

// 生成指令访问序列
export const generateInstructionSequence = (): number[] => {
  const sequence: number[] = [];
  
  // 随机选择起始指令
  let currentInstruction = Math.floor(Math.random() * 320);
  
  while (sequence.length < 320) {
    // 将当前指令加入序列
    sequence.push(currentInstruction);
    
    // 50%顺序执行
    if (sequence.length < 320) {
      currentInstruction++;
      if (currentInstruction >= 320) currentInstruction = 0;
      sequence.push(currentInstruction);
    }
    
    // 25%跳转到前地址部分
    if (sequence.length < 320) {
      const jumpTarget = Math.floor(Math.random() * currentInstruction);
      currentInstruction = jumpTarget;
      sequence.push(currentInstruction);
    }
    
    // 顺序执行下一条
    if (sequence.length < 320) {
      currentInstruction++;
      if (currentInstruction >= 320) currentInstruction = 0;
      sequence.push(currentInstruction);
    }
    
    // 25%跳转到后地址部分
    if (sequence.length < 320) {
      const jumpTarget = Math.floor(Math.random() * (319 - currentInstruction)) + currentInstruction + 2;
      currentInstruction = Math.min(jumpTarget, 319);
      sequence.push(currentInstruction);
    }
    
    // 顺序执行下一条
    if (sequence.length < 320) {
      currentInstruction++;
      if (currentInstruction >= 320) currentInstruction = 0;
      sequence.push(currentInstruction);
    }
  }
  
  // 确保序列长度恰好为320
  return sequence.slice(0, 320);
};

// 模拟页面置换过程
export const simulatePageReplacement = (
  instructionSequence: number[],
  algorithm: PageReplacementAlgorithm
): SimulationStep[] => {
  const steps: SimulationStep[] = [];
  
  // 初始化内存帧（4个页框）
  const memoryFrames: (number | null)[] = [null, null, null, null];
  
  // 对于LRU算法，需要记录页面的访问时间
  const pageAccessTime: Record<number, number> = {};
  
  // 页面的使用顺序（用于FIFO）
  const pageLoadOrder: number[] = [];
  
  // 记录每步操作
  for (let step = 0; step < instructionSequence.length; step++) {
    const instructionAddress = instructionSequence[step];
    const page = Math.floor(instructionAddress / 10);
    
    // 记录页面访问时间（用于LRU）
    pageAccessTime[page] = step;
    
    // 检查页面是否已在内存中
    const frameIndex = memoryFrames.indexOf(page);
    const pageFault = frameIndex === -1;
    
    let replacedPage: number | null = null;
    let replacedFrame: number | null = null;
    
    if (pageFault) {
      // 查找空闲帧
      let freeFrameIndex = memoryFrames.indexOf(null);
      
      if (freeFrameIndex !== -1) {
        // 有空闲帧，直接加载
        memoryFrames[freeFrameIndex] = page;
        replacedFrame = freeFrameIndex;
        pageLoadOrder.push(page);
      } else {
        // 需要置换页面
        let pageToReplace: number;
        let frameToReplace: number;
        
        if (algorithm === 'FIFO') {
          // FIFO算法：替换最先加载的页面
          // 查找最先加载的页面
          const firstPage = pageLoadOrder[0];
          frameToReplace = memoryFrames.indexOf(firstPage);
          pageToReplace = firstPage;
          
          // 更新加载顺序
          pageLoadOrder.shift();
          pageLoadOrder.push(page);
        } else {
          // LRU算法：替换最近最少使用的页面
          // 查找所有内存页面
          const pagesInMemory = memoryFrames.filter(p => p !== null) as number[];
          
          // 找到最近最久未使用的页面
          let oldestAccessTime = step;
          let candidatePage = pagesInMemory[0];
          
          for (const p of pagesInMemory) {
            if (pageAccessTime[p] < oldestAccessTime) {
              oldestAccessTime = pageAccessTime[p];
              candidatePage = p;
            }
          }
          
          pageToReplace = candidatePage;
          frameToReplace = memoryFrames.indexOf(pageToReplace);
          pageLoadOrder.push(page);
        }
        
        // 执行替换
        replacedPage = pageToReplace;
        replacedFrame = frameToReplace;
        memoryFrames[frameToReplace] = page;
      }
    }
    
    // 记录步骤状态
    steps.push({
      step,
      instructionAddress,
      page,
      memoryFrames: [...memoryFrames],
      pageFault,
      replacedPage,
      replacedFrame,
      referencedPages: [page]
    });
  }
  
  return steps;
};