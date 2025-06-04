// partition.ts
// 分区内存块定义
export interface MemoryBlock {
    start: number;
    size: number;
    allocatedTo?: string; // 作业ID，undefined表示空闲
}

// 空闲块
export interface FreeBlock {
    start: number;
    end: number;
}

// 分区状态
export interface PartitionState {
    blocks: MemoryBlock[];
    freeBlocks: FreeBlock[];
    allocatedJobs: Record<string, MemoryBlock>; // jobId -> MemoryBlock
    totalSize: number;
}

export type PartitionAlgorithm = 'FF' | 'BF'; // FF:首次适应, BF:最佳适应

// 初始化内存
export const initMemory = (totalSize: number): PartitionState => {
    return {
        blocks: [{ start: 0, size: totalSize }],
        freeBlocks: [{ start: 0, end: totalSize }],
        allocatedJobs: {},
        totalSize
    };
};

// 执行分区操作步骤
export const executePartitionStep = (
    state: PartitionState,
    algorithm: PartitionAlgorithm,
    step: { type: 'allocate' | 'free'; jobId: number; size?: number }
): { state: PartitionState; success: boolean } => {
    const jobIdStr = step.jobId.toString();

    if (step.type === 'allocate' && step.size) {
        return allocateMemory(state, algorithm, jobIdStr, step.size);
    } else {
        return freeMemory(state, jobIdStr);
    }
};

// 分配内存
const allocateMemory = (
    state: PartitionState,
    algorithm: PartitionAlgorithm,
    jobId: string,
    size: number
): { state: PartitionState; success: boolean } => {
    // 避免修改原状态
    let newState = JSON.parse(JSON.stringify(state)) as PartitionState;

    // 首先按照算法排序空闲块
    const sortedFreeBlocks = [...newState.freeBlocks];
    if (algorithm === 'FF') {
        // 首次适应：按地址从小到大排序
        sortedFreeBlocks.sort((a, b) => a.start - b.start);
    } else {
        // 最佳适应：按块大小从小到大排序
        sortedFreeBlocks.sort((a, b) => (a.end - a.start) - (b.end - b.start));
    }

    // 找到合适的空闲块
    const suitableBlock = sortedFreeBlocks.find(block => (block.end - block.start) >= size);

    if (!suitableBlock) {
        return { state: newState, success: false };
    }

    // 从空闲块分配内存
    const allocatedStart = suitableBlock.start;
    const allocatedEnd = allocatedStart + size;

    // 更新空闲块列表
    const freeBlockIndex = newState.freeBlocks.findIndex(
        block => block.start === suitableBlock.start && block.end === suitableBlock.end
    );

    if (freeBlockIndex !== -1) {
        newState.freeBlocks.splice(freeBlockIndex, 1);

        // 分配后如果有剩余空间，生成新的空闲块
        if (allocatedEnd < suitableBlock.end) {
            newState.freeBlocks.push({ start: allocatedEnd, end: suitableBlock.end });
            newState.freeBlocks.sort((a, b) => a.start - b.start);
        }
    }

    // 更新内存块列表
    const newBlock: MemoryBlock = {
        start: allocatedStart,
        size: size,
        allocatedTo: jobId
    };

    let inserted = false;
    for (let i = 0; i < newState.blocks.length; i++) {
        const block = newState.blocks[i];
        // 找到要分割的块
        if (block.start <= suitableBlock.start && (block.start + block.size) >= suitableBlock.end && !block.allocatedTo) {
            const beforeSize = suitableBlock.start - block.start;
            const afterStart = allocatedEnd;
            const afterSize = block.start + block.size - allocatedEnd;

            // 替换当前空闲块为三个可能的块（前空闲、新分配、后空闲）
            const newBlocks = [];
            if (beforeSize > 0) {
                newBlocks.push({ start: block.start, size: beforeSize });
            }
            newBlocks.push(newBlock);
            if (afterSize > 0) {
                newBlocks.push({ start: afterStart, size: afterSize });
            }

            // 替换原块
            newState.blocks.splice(i, 1, ...newBlocks);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        // 如果没找到空闲块(不应该发生)，回退到简单方法
        newState.blocks.push(newBlock);
        newState.blocks.sort((a, b) => a.start - b.start);
    }

    // 记录分配的作业
    newState.allocatedJobs[jobId] = newBlock;

    return { state: newState, success: true };
};

// 释放内存
const freeMemory = (
    state: PartitionState,
    jobId: string
): { state: PartitionState; success: boolean } => {
    // 避免修改原状态
    let newState = JSON.parse(JSON.stringify(state)) as PartitionState;

    const allocatedBlock = newState.allocatedJobs[jobId];

    if (!allocatedBlock) {
        return { state: newState, success: false }; // 作业不存在
    }

    // 找到并修改内存块
    const blockIndex = newState.blocks.findIndex(
        block => block.start === allocatedBlock.start && block.size === allocatedBlock.size
    );

    if (blockIndex !== -1) {
        // 标记为空闲
        newState.blocks[blockIndex] = {
            start: allocatedBlock.start,
            size: allocatedBlock.size
        };

        // 添加空闲块
        newState.freeBlocks.push({
            start: allocatedBlock.start,
            end: allocatedBlock.start + allocatedBlock.size
        });
        // 从分配的作业中移除
        delete newState.allocatedJobs[jobId];
        // 尝试合并相邻空闲块
        mergeAdjacentBlocks(newState);
    }
    return { state: newState, success: true };
};

// 合并相邻空闲块
const mergeAdjacentBlocks = (state: PartitionState) => {
    // 按起始地址排序内存块
    state.blocks.sort((a, b) => a.start - b.start);

    // 合并连续的空闲块
    for (let i = state.blocks.length - 1; i > 0; i--) {
        const prevBlock = state.blocks[i - 1];
        const currentBlock = state.blocks[i];

        // 检查是否都是空闲块并且相邻
        if (!prevBlock.allocatedTo && !currentBlock.allocatedTo &&
            prevBlock.start + prevBlock.size === currentBlock.start) {
            // 合并块
            prevBlock.size += currentBlock.size;
            // 删除当前块
            state.blocks.splice(i, 1);
        }
    }

    // 重新计算空闲块列表
    state.freeBlocks = [];
    let currentBlock: FreeBlock | null = null;

    for (const block of state.blocks) {
        if (!block.allocatedTo) {
            if (currentBlock === null) {
                currentBlock = { start: block.start, end: block.start + block.size };
            } else if (currentBlock.end === block.start) {
                currentBlock.end = block.start + block.size;
            } else {
                state.freeBlocks.push(currentBlock);
                currentBlock = { start: block.start, end: block.start + block.size };
            }
        } else {
            if (currentBlock !== null) {
                state.freeBlocks.push(currentBlock);
                currentBlock = null;
            }
        }
    }

    // 处理最后一个空闲块
    if (currentBlock !== null) {
        state.freeBlocks.push(currentBlock);
    }

    // 按地址排序空闲块
    state.freeBlocks.sort((a, b) => a.start - b.start);
};