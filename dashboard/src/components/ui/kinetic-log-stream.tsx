import React from 'react'

export interface LogEntry {
    id: string
    timestamp: string
    type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING'
    message: string
    agent: string
}

interface KineticLogStreamProps {
    logs: LogEntry[]
    title: string
}

const KineticLogStream: React.FC<KineticLogStreamProps> = ({ logs, title }) => {
    return (
        <div className="flex flex-col h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-slate-400 font-bold uppercase tracking-wider">{title}</span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span className={`font-bold shrink-0 ${log.type === 'ERROR' ? 'text-red-400' :
                                log.type === 'SUCCESS' ? 'text-green-400' :
                                    log.type === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'
                            }`}>{log.agent}</span>
                        <span className="text-slate-300 break-words">{log.message}</span>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                        Waiting for logs...
                    </div>
                )}
            </div>
        </div>
    )
}

export default KineticLogStream
