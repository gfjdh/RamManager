// PageReplacement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';

// 添加 NodeJS.Timeout 类型声明
declare global {
    interface Window {
        setTimeout: (handler: TimerHandler, timeout?: number, ...args: any[]) => number;
        clearTimeout: (handle?: number) => void;
    }
}

export type PageReplacementAlgorithm = 'FIFO' | 'LRU';

export interface SimulationStep {
    step: number;
    instructionAddress: number;
    page: number;
    memoryFrames: (number | null)[];
    pageFault: boolean;
    replacedPage: number | null;
    replacedFrame: number | null;
    referencedPages: number[];
}

const PageReplacement: React.FC = () => {
    const [algorithm, setAlgorithm] = useState<PageReplacementAlgorithm>('FIFO');
    const [instructionSequence, setInstructionSequence] = useState<number[]>([]);
    const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [pageFaults, setPageFaults] = useState(0);
    const [pageFaultRate, setPageFaultRate] = useState(0);

    // 生成指令访问序列
    const generateInstructionSequence = useCallback((): number[] => {
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
                const min = 0;
                const max = Math.max(0, currentInstruction - 1);
                if (max >= min) {
                    const jumpTarget = Math.floor(Math.random() * (max - min + 1)) + min;
                    currentInstruction = jumpTarget;
                    sequence.push(currentInstruction);
                }
            }

            // 顺序执行下一条
            if (sequence.length < 320) {
                currentInstruction++;
                if (currentInstruction >= 320) currentInstruction = 0;
                sequence.push(currentInstruction);
            }

            // 25%跳转到后地址部分
            if (sequence.length < 320) {
                const min = currentInstruction + 2;
                const max = 319;
                if (min <= max) {
                    const jumpTarget = Math.floor(Math.random() * (max - min + 1)) + min;
                    currentInstruction = Math.min(jumpTarget, 319);
                    sequence.push(currentInstruction);
                }
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
    }, []);

    // 模拟页面置换过程
    const simulatePageReplacement = useCallback((
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
                    }

                    // 执行替换
                    replacedPage = pageToReplace;
                    replacedFrame = frameToReplace;
                    memoryFrames[frameToReplace] = page;
                    pageLoadOrder.push(page);
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
                referencedPages: [page] // 直接传递值，避免声明变量
            });
        }

        return steps;
    }, []);

    // 初始化指令序列
    useEffect(() => {
        resetSimulation();
    }, [generateInstructionSequence]);

    const resetSimulation = useCallback(() => {
        const sequence = generateInstructionSequence();
        setInstructionSequence(sequence);
        setSimulationSteps([]);
        setCurrentStep(0);
        setIsRunning(false);
        setPageFaults(0);
        setPageFaultRate(0);
    }, [generateInstructionSequence]);

    // 添加日志状态和操作
    const [operationLog, setOperationLog] = useState<string[]>([]);

    const startSimulation = useCallback(() => {
        setIsRunning(true);
        setCurrentStep(0);
        setOperationLog(["模拟开始，使用算法: " + algorithm]);

        const steps = simulatePageReplacement(instructionSequence, algorithm);
        setSimulationSteps(steps);

        // 计算缺页率
        const faults = steps.filter(step => step.pageFault).length;
        setPageFaults(faults);
        setPageFaultRate(Math.round((faults / instructionSequence.length) * 10000) / 100);
    }, [instructionSequence, algorithm, simulatePageReplacement]);

    // 自动执行步骤
    useEffect(() => {
        let timer: number;

        if (isRunning && currentStep < simulationSteps.length) {
            const step = simulationSteps[currentStep];
            let logEntry = `指令#${step.step}: 地址 ${step.instructionAddress} -> 页 ${step.page}`;

            if (step.pageFault) {
                logEntry += " - 缺页!";
                if (step.replacedPage !== null && step.replacedFrame !== null) {
                    logEntry += ` 置换页${step.replacedPage}（帧${step.replacedFrame})`;
                } else {
                    logEntry += " 加载到空闲帧";
                }
            }

            setOperationLog(prevLog => [...prevLog, logEntry]);

            if (currentStep < simulationSteps.length - 1) {
                timer = window.setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                }, 300);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isRunning, currentStep, simulationSteps.length]);

    return (
        <div className="page-replacement">
            <div className="controls">
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as PageReplacementAlgorithm)}>
                    <option value="FIFO">先进先出(FIFO)</option>
                    <option value="LRU">最近最少使用(LRU)</option>
                </select>
                <button onClick={resetSimulation}>重置</button>
                <button onClick={startSimulation} disabled={isRunning || simulationSteps.length > 0}>
                    开始模拟
                </button>
            </div>
            <div className="stats">
                <div className="stat-item">
                    <span className="stat-label">总指令数:</span>
                    <span className="stat-value">{instructionSequence.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">缺页次数:</span>
                    <span className="stat-value">{pageFaults}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">缺页率:</span>
                    <span className="stat-value">{pageFaultRate}%</span>
                </div>
            </div>

            {simulationSteps.length > 0 && currentStep < simulationSteps.length && (
                <>
                    <div className="current-instruction">
                        <h3>
                            当前指令: #{currentStep} (地址: {simulationSteps[currentStep].instructionAddress})
                            {simulationSteps[currentStep].pageFault && (
                                <span className="page-fault-indicator">缺页!</span>
                            )}
                        </h3>
                        <p>
                            页面: {Math.floor(simulationSteps[currentStep].instructionAddress / 10)} (指令范围: {
                                Math.floor(simulationSteps[currentStep].instructionAddress / 10) * 10
                            }-{
                                Math.floor(simulationSteps[currentStep].instructionAddress / 10) * 10 + 9
                            })
                        </p>
                    </div>

                    <div className="memory-frames">
                        <h3>内存页框</h3>
                        <div className="frames-container">
                            {simulationSteps[currentStep].memoryFrames.map((page, frameId) => (
                                <div
                                    key={frameId}
                                    className={`memory-frame ${page !== null ? 'occupied' : 'free'} ${simulationSteps[currentStep].replacedFrame === frameId ? 'replaced' : ''
                                        }`}
                                >
                                    <div className="frame-id">帧 {frameId}</div>
                                    <div className="page-number">
                                        {page !== null ? `页 ${page}` : '空闲'}
                                    </div>
                                    {simulationSteps[currentStep].replacedFrame === frameId && (
                                        <div className="replacement-indicator">置换</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="page-table">
                        <h3>页表状态</h3>
                        <div className="pages-container">
                            {Array.from({ length: 32 }, (_, pageId) => {
                                const inMemory = simulationSteps[currentStep].memoryFrames.includes(pageId);
                                const referenced = simulationSteps[currentStep].referencedPages.includes(pageId);

                                return (
                                    <div
                                        key={pageId}
                                        className={`page-table-entry ${inMemory ? 'in-memory' : 'in-disk'} ${referenced ? 'referenced' : ''
                                            }`}
                                    >
                                        <div className="page-id">页 {pageId}</div>
                                        <div className="page-status">
                                            {inMemory
                                                ? `帧 ${simulationSteps[currentStep].memoryFrames.indexOf(pageId)}`
                                                : '磁盘'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            <div className="progress">
                <h3>执行进度</h3>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(currentStep / instructionSequence.length) * 100}%` }}
                    ></div>
                    <div className="progress-label">
                        第 {currentStep + 1} / {instructionSequence.length} 条指令
                    </div>
                </div>
            </div>
            {/* 添加日志区域 */}
            <div className="operation-log">
                <h3>模拟日志</h3>
                <div className="log-container">
                    {operationLog.map((log, index) => (
                        <div
                            key={index}
                            className={`log-entry ${log.includes('缺页') ? 'page-fault' : log.includes('置换') ? 'replacement' : ''
                                }`}
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </div>
            <div className="manual-controls">
                <button
                    onClick={() => setCurrentStep(0)}
                    disabled={currentStep === 0}
                >
                    重置到开始
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.max(prev - 10, 0))}
                    disabled={currentStep === 0}
                >
                    后退10步
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                    disabled={currentStep === 0}
                >
                    上一步
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, instructionSequence.length - 1))}
                    disabled={currentStep >= instructionSequence.length - 1}
                >
                    下一步
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.min(prev + 10, instructionSequence.length - 1))}
                    disabled={currentStep >= instructionSequence.length - 1}
                >
                    前进10步
                </button>
                <button
                    onClick={() => setCurrentStep(instructionSequence.length - 1)}
                    disabled={currentStep >= instructionSequence.length - 1}
                >
                    跳到最后
                </button>
            </div>
        </div>
    );
};

export default PageReplacement;