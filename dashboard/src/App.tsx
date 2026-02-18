import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import KineticLogStream, { type LogEntry as KineticLogEntry } from "@/components/ui/kinetic-log-stream"
import { LiveArchitectureDiagram } from "@/components/ui/live-architecture-diagram"
import './index.css'
import { Activity, Terminal, GitPullRequest, CheckCircle2 } from 'lucide-react'

// Types
interface AgentStatus {
    name: string
    displayName: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    step: string
    progress: number
}

interface LogEntry {
    id: string
    time: string
    agent: string
    message: string
    type: 'info' | 'success' | 'error' | 'warning'
}

interface ExecutionResult {
    pr_url?: string
    pr_number?: number
    total_duration_ms?: number
    files_generated?: number
    quality_score?: number
}

// Backend API URL
const API_BASE = 'http://localhost:8008'
const WS_BASE = 'ws://localhost:8008'

export default function App() {
    const [storyId, setStoryId] = useState('')
    const [isRunning, setIsRunning] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [agents, setAgents] = useState<AgentStatus[]>([
        { name: 'RequirementGatheringAgent', displayName: 'Requirements', status: 'pending', step: '', progress: 0 },
        { name: 'DevelopmentAgent', displayName: 'Development', status: 'pending', step: '', progress: 0 },
        { name: 'TestingDebuggingAgent', displayName: 'Testing', status: 'pending', step: '', progress: 0 },
        { name: 'DeploymentAgent', displayName: 'Deployment', status: 'pending', step: '', progress: 0 },
    ])
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [wsConnected, setWsConnected] = useState(false)
    const [executionId, setExecutionId] = useState<string | null>(null)
    const [result, setResult] = useState<ExecutionResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeIntegrations, setActiveIntegrations] = useState<string[]>([])

    const wsRef = useRef<WebSocket | null>(null)

    // Add log entry
    const addLog = useCallback((agent: string, message: string, type: LogEntry['type'] = 'info') => {
        const now = new Date()
        const time = now.toLocaleTimeString('en-US', { hour12: false })
        const entry: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            time,
            agent,
            message,
            type
        }
        setLogs(prev => [entry, ...prev]) // Newest first for KineticLogStream
    }, [])

    // Update agent status
    const updateAgent = useCallback((agentName: string, updates: Partial<AgentStatus>) => {
        setAgents(prev => prev.map(agent =>
            agent.name === agentName ? { ...agent, ...updates } : agent
        ))
    }, [])

    // Handle WebSocket message
    const handleWsMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data)

            if (data.type === 'progress') {
                const agentName = data.agent
                const step = data.step
                const status = data.status as AgentStatus['status']

                updateAgent(agentName, { status, step })

                const logType = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info'
                addLog(agentName, step, logType)

                // Reset integration highlight when an agent completes
                if (status === 'completed' || status === 'failed') {
                    setActiveIntegrations([])
                }

                if (agentName === 'DeploymentAgent' && status === 'completed' && data.details) {
                    setResult({
                        pr_url: data.details.pr_url as string,
                        pr_number: data.details.pr_number as number,
                        total_duration_ms: data.details.total_duration_ms as number
                    })
                    setIsRunning(false)
                }

                if (status === 'failed') {
                    setError(`${agentName} failed: ${step}`)
                    setIsRunning(false)
                }
            }

            if (data.type === 'detailed_step') {
                const detailedData = data
                const logType = detailedData.status === 'success' ? 'success'
                    : detailedData.status === 'error' ? 'error'
                        : detailedData.status === 'warning' ? 'warning' : 'info'
                addLog(detailedData.agent, detailedData.substep, logType)

                // Detect active integration from detailed step text
                const msg = detailedData.substep.toLowerCase()
                const newIntegrations: string[] = []

                if (msg.includes('ado') || msg.includes('devops')) newIntegrations.push('ado')
                if (msg.includes('figma')) newIntegrations.push('figma')
                if (msg.includes('github') || msg.includes('pr') || msg.includes('repo')) newIntegrations.push('github')

                if (newIntegrations.length > 0) {
                    setActiveIntegrations(newIntegrations)
                } else if (detailedData.status === 'success') {
                    setActiveIntegrations([]) // Clear highlight on success of the step
                }
            }

            if (data.type === 'test_result') {
                const testData = data
                const logType = testData.passed ? 'success' : 'error'
                const message = testData.passed
                    ? `Test passed: ${testData.test_name} ✅`
                    : `Test failed: ${testData.test_name} ❌`
                addLog('TestingDebuggingAgent', message, logType)
            }
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
        }
    }, [addLog, updateAgent])

    // Connect WebSocket
    useEffect(() => {
        const connectWebSocket = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return

            const ws = new WebSocket(`${WS_BASE}/ws/executions`)

            ws.onopen = () => {
                setWsConnected(true)
                addLog('System', 'Connected to server', 'success')
            }

            ws.onclose = () => {
                setWsConnected(false)
                addLog('System', 'Disconnected from server', 'warning')
                setTimeout(connectWebSocket, 3000)
            }

            ws.onerror = () => {
                setWsConnected(false)
            }

            ws.onmessage = handleWsMessage
            wsRef.current = ws
        }

        connectWebSocket()
        return () => wsRef.current?.close()
    }, [addLog, handleWsMessage])

    const handleStart = async () => {
        if (!storyId.trim()) return

        setHasStarted(true)
        setAgents(prev => prev.map(a => ({ ...a, status: 'pending', step: '', progress: 0 })))
        setLogs([])
        setResult(null)
        setError(null)
        setIsRunning(true)

        addLog('System', `Starting execution for story #${storyId}`, 'info')

        try {
            const response = await fetch(`${API_BASE}/api/v1/process-story`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ story_id: parseInt(storyId), force_reprocess: true })
            })

            const data = await response.json()

            if (data.success) {
                setExecutionId(data.execution_id)
                addLog('System', `Execution started: ${data.message}`, 'success')
            } else {
                setError(data.message)
                setIsRunning(false)
                addLog('System', `Failed to start: ${data.message}`, 'error')
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error'
            setError(`Failed to connect to server: ${errorMsg}`)
            setIsRunning(false)
            addLog('System', `Connection error: ${errorMsg}`, 'error')
        }
    }

    const handleFastTrack = async () => {
        setHasStarted(true)
        setAgents(prev => prev.map(a => ({ ...a, status: 'pending', step: '', progress: 0 })))
        setLogs([])
        setResult(null)
        setError(null)
        setIsRunning(true)
        setStoryId('99999') // Fast track pseudo ID

        addLog('System', 'Initializing Fast-Track Development (Manual Source)', 'info')

        try {
            const response = await fetch(`${API_BASE}/api/v1/fast-track`, {
                method: 'POST'
            })

            const data = await response.json()

            if (data.success) {
                setExecutionId(data.execution_id)
                addLog('System', `Fast-track execution started: ${data.message}`, 'success')
            } else {
                setError(data.message)
                setIsRunning(false)
                addLog('System', `Fast-track failed to start: ${data.message}`, 'error')
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error'
            setError(`Failed to connect to server: ${errorMsg}`)
            setIsRunning(false)
            addLog('System', `Connection error: ${errorMsg}`, 'error')
        }
    }

    // Transform logs for Kinetic Stream
    const kineticLogs: KineticLogEntry[] = logs.map(log => ({
        id: log.id,
        timestamp: log.time,
        type: log.type === 'error' ? 'ERROR' : log.type === 'success' ? 'SUCCESS' : log.type === 'warning' ? 'WARNING' : 'INFO',
        message: log.message,
        agent: log.agent
    }))

    const getActiveStep = () => {
        if (!isRunning && !result) return 0;
        if (result) return 5;
        const activeAgentIndex = agents.findIndex(a => a.status === 'running');
        if (activeAgentIndex !== -1) return activeAgentIndex + 1;
        // If running but no agent is strictly "running" (maybe transitioning), find last completed
        const lastCompletedIndex = [...agents].reverse().findIndex(a => a.status === 'completed');
        if (lastCompletedIndex !== -1) return (agents.length - 1 - lastCompletedIndex) + 1;
        return 0;
    }

    return (
        <div className="relative w-full min-h-screen text-white overflow-x-hidden overflow-y-auto bg-[#0a0a0a] selection:bg-purple-500/30 font-sans">
            <WebGLShader />

            {/* Background Decorative Text */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none select-none -z-5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-white/[0.02] uppercase tracking-[0.2em] whitespace-nowrap">
                    Autonomous
                </div>
            </div>

            {/* Container for conditional views */}
            <div className="relative z-10 w-full min-h-screen flex flex-col p-4 md:p-6 transition-all duration-500">

                <AnimatePresence mode="wait">
                    {!hasStarted ? (
                        /* INITIAL VIEW: Centered Hero & Input */
                        <motion.div
                            key="initial-view"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center min-h-[90vh] w-full max-w-4xl mx-auto gap-8"
                        >
                            <div className="relative bg-black/60 backdrop-blur-xl p-12 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-8 shadow-2xl shadow-purple-500/10 overflow-hidden group w-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

                                <div className="z-10 text-center space-y-6 max-w-2xl mx-auto">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400 mb-2">
                                        <Terminal className="w-3 h-3" /> AI-SDLC ORCHESTRATOR v2.0
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                                        SLDC <br />Pair Programmer
                                    </h1>
                                    <p className="text-slate-400 text-xl font-light">
                                        Enter a User Story ID to initialize...
                                    </p>
                                </div>

                                <div className="z-10 w-full max-w-lg flex flex-col sm:flex-row gap-4 items-center">
                                    <input
                                        type="text"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-center text-lg sm:text-left focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-white placeholder:text-slate-600 font-mono"
                                        placeholder="Story ID (e.g. 12345)"
                                        value={storyId}
                                        onChange={(e) => setStoryId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                        autoFocus
                                    />
                                    <div onClick={() => handleStart()} className={!storyId.trim() ? 'opacity-50 pointer-events-none' : ''}>
                                        <LiquidButton variant="cool" size="xl" className="h-14 px-8 text-lg">
                                            Start Automation
                                        </LiquidButton>
                                    </div>
                                </div>

                                <div className="z-10 flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setHasStarted(true)
                                                setIsRunning(true)
                                                addLog('System', 'Testing GitHub PR capability...', 'info')
                                                const response = await fetch(`${API_BASE}/api/v1/test-pr`, { method: 'POST' })
                                                const data = await response.json()
                                                if (data.success) {
                                                    addLog('System', `Test PR created: #${data.pr_number}`, 'success')
                                                    setResult({
                                                        pr_url: data.pr_url,
                                                        pr_number: data.pr_number,
                                                        total_duration_ms: 0
                                                    })
                                                } else {
                                                    setError(data.message)
                                                    addLog('System', `Test PR failed: ${data.message}`, 'error')
                                                }
                                                setIsRunning(false)
                                            } catch (e) {
                                                setError('Failed to reach server')
                                                setIsRunning(false)
                                            }
                                        }}
                                        className="px-6 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition-all cursor-pointer flex items-center gap-2 font-mono text-sm"
                                    >
                                        <GitPullRequest className="w-4 h-4" /> Direct Test PR
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* EXECUTION VIEW: Dashboard Grid */
                        <motion.div
                            key="execution-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-6 w-full max-w-6xl mx-auto"
                        >
                            {/* Compact Header */}
                            <header className="flex justify-between items-center bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg">
                                        <Terminal className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight">Active Session</h2>
                                        <p className="text-xs text-slate-400 font-mono">ID: {storyId} • {executionId || 'Initializing...'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></span>
                                        <span className="text-xs font-medium text-slate-300">{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
                                    </div>

                                    {/* Create New Object Button */}
                                    <button
                                        onClick={() => {
                                            setHasStarted(false);
                                            setStoryId('');
                                            setResult(null);
                                            setLogs([]);
                                            setError(null);
                                            setIsRunning(false);
                                        }}
                                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors cursor-pointer"
                                    >
                                        New Session
                                    </button>

                                    <button
                                        onClick={async () => {
                                            try {
                                                addLog('System', 'Testing GitHub PR capability...', 'info')
                                                const response = await fetch(`${API_BASE}/api/v1/test-pr`, { method: 'POST' })
                                                const data = await response.json()
                                                if (data.success) {
                                                    addLog('System', `Test PR created: #${data.pr_number}`, 'success')
                                                    setResult({
                                                        pr_url: data.pr_url,
                                                        pr_number: data.pr_number,
                                                        total_duration_ms: 0
                                                    })
                                                } else {
                                                    setError(data.message)
                                                    addLog('System', `Test PR failed: ${data.message}`, 'error')
                                                }
                                            } catch (e) {
                                                setError('Failed to reach server')
                                            }
                                        }}
                                        className="px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <GitPullRequest className="w-3 h-3" /> Test PR
                                    </button>

                                    {/* Fast Track button visible only during Development phase */}
                                    {isRunning && agents.find(a => a.name === 'DevelopmentAgent')?.status === 'running' && (
                                        <button
                                            onClick={handleFastTrack}
                                            className="px-3 py-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 transition-all cursor-pointer flex items-center gap-2 animate-in fade-in zoom-in duration-300"
                                        >
                                            <Activity className="w-3 h-3" /> Fast-Track
                                        </button>
                                    )}
                                </div>
                            </header>

                            {/* 1. Live Architecture Diagram (Top) */}
                            <div className="relative group">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#0a0a0a] border border-white/10 rounded-full text-xs font-mono text-purple-400 z-20 flex items-center gap-2 shadow-xl">
                                    <Activity className="w-3 h-3 animate-pulse" /> LIVE TOPOLOGY
                                </div>
                                <LiveArchitectureDiagram
                                    currentAgent={agents.find(a => a.status === 'running')?.name || ''}
                                    status={isRunning ? 'running' : 'idle'}
                                    activeStep={getActiveStep()}
                                    activeIntegrations={activeIntegrations}
                                />
                            </div>

                            {/* 2. Success/Error Messages (Middle) */}
                            <AnimatePresence>
                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4"
                                    >
                                        <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                                            <Activity className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-red-400">Execution Error</h3>
                                            <p className="text-sm text-red-300/80 mt-1">{error}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Success Result */}
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                                                <GitPullRequest className="w-6 h-6 text-black" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-green-400">Deployment Successful!</h3>
                                                <p className="text-sm text-green-300/60">Pull Request Created • All Checks Passed</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs text-slate-400 uppercase tracking-widest">Duration</div>
                                                <div className="text-xl font-mono text-white">{((result.total_duration_ms || 0) / 1000).toFixed(1)}s</div>
                                            </div>
                                            <a
                                                href={result.pr_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-3 bg-green-500 hover:bg-green-400 hover:scale-105 active:scale-95 text-black font-bold rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2"
                                            >
                                                View PR #{result.pr_number} <CheckCircle2 className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 3. Logs (Bottom) */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-medium text-slate-500 ml-2">SYSTEM LOGS</h3>
                                <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                    <KineticLogStream logs={kineticLogs} title="Execution Stream" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
