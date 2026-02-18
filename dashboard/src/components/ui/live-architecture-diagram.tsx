import React from 'react'
import { Database, Figma, Github, Cpu, Activity, Zap, CheckCircle2 } from 'lucide-react'

interface LiveArchitectureDiagramProps {
    currentAgent: string
    status: string
    activeStep: number
    activeIntegrations?: string[]
}

const DataStream = ({ active, reverse = false, color = "blue" }: { active: boolean, reverse?: boolean, color?: string }) => {
    if (!active) return null;
    const colorMap: any = {
        blue: "stroke-blue-400",
        purple: "stroke-purple-400",
        green: "stroke-green-400"
    };

    return (
        <>
            <path
                d="M 0 0"
                className={`${colorMap[color]} opacity-50 stroke-[3] fill-none animate-pulse`}
                style={{ filter: 'blur(4px)' }}
            />
            <circle r="3" fill="currentColor" className={`text-${color}-400`}>
                <animateMotion
                    dur="1.5s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="inherit"
                    keyPoints={reverse ? "1;0" : "0;1"}
                    keyTimes="0;1"
                />
            </circle>
        </>
    );
};

const IntegrationNode = ({ icon: Icon, label, status, position }: { icon: any, label: string, status: 'idle' | 'active' | 'completed', position: string }) => (
    <div className={`absolute ${position} flex flex-col items-center gap-2 group transition-all duration-500`}>
        <div className={`p-3 rounded-xl border-2 transition-all duration-500 transform ${status === 'active' ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.8)] scale-110' :
            status === 'completed' ? 'bg-green-500/10 border-green-500/50' :
                'bg-white/5 border-white/10 opacity-30 group-hover:opacity-100'
            }`}>
            <Icon className={`w-6 h-6 ${status === 'active' ? 'text-blue-400' :
                status === 'completed' ? 'text-green-400' :
                    'text-slate-400'
                }`} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
)

const AgentNode = ({ label, status, isActive }: { label: string, status: string, isActive: boolean }) => (
    <div className="flex flex-col items-center gap-4 relative z-10">
        <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 transform ${isActive ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-110' :
            status === 'completed' ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
                'bg-white/5 border-white/10'
            }`}>
            {status === 'completed' ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : isActive ? (
                <Cpu className="w-8 h-8 text-purple-400 animate-spin-slow" />
            ) : (
                <Activity className="w-8 h-8 text-slate-600" />
            )}
        </div>
        <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400 h-8 flex items-center justify-center max-w-[120px] leading-tight mx-auto">
                {label}
            </div>
            {isActive && <div className="text-[8px] text-purple-500/80 font-mono animate-pulse mt-1">PROCESSING...</div>}
        </div>
    </div>
)

export const LiveArchitectureDiagram: React.FC<LiveArchitectureDiagramProps> = ({ currentAgent, status, activeStep, activeIntegrations = [] }) => {
    const agents = [
        { id: 'Requirements', label: 'Requirement Gathering Agent' },
        { id: 'Development', label: 'Development Agent' },
        { id: 'Testing', label: 'Testing & Debugging Agent' },
        { id: 'Deployment', label: 'Deployment Agent' }
    ]

    const isAdoActive = activeIntegrations.includes('ado');
    const isFigmaActive = activeIntegrations.includes('figma');
    const isGithubActive = activeIntegrations.includes('github');

    return (
        <div className="w-full bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 min-h-[450px] flex items-center justify-center relative overflow-hidden group">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Integration Nodes */}
            <IntegrationNode
                icon={Database}
                label="Azure DevOps"
                status={isAdoActive ? 'active' : activeStep > 1 ? 'completed' : 'idle'}
                position="-top-2 left-1/4 -translate-x-1/2"
            />
            <IntegrationNode
                icon={Figma}
                label="Figma"
                status={isFigmaActive ? 'active' : activeStep > 1 ? 'completed' : 'idle'}
                position="-top-2 left-1/2 -translate-x-1/2"
            />
            <IntegrationNode
                icon={Github}
                label="GitHub"
                status={isGithubActive ? 'active' : activeStep > 1 ? 'completed' : 'idle'}
                position="-top-2 left-3/4 -translate-x-1/2"
            />

            {/* Main Flow */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-12 relative mt-20">

                {/* Animated Flow Lines Between Agents */}
                <div className="absolute top-10 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 hidden md:block overflow-hidden">
                    {status === 'running' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent w-1/3 animate-flow-horizontal" />
                    )}
                </div>

                {agents.map((agent, index) => {
                    const isActive = activeStep === index + 1
                    const isCompleted = activeStep > index + 1
                    const agentStatus = isCompleted ? 'completed' : isActive ? 'running' : 'idle'

                    return (
                        <AgentNode
                            key={agent.id}
                            label={agent.label}
                            status={agentStatus}
                            isActive={isActive}
                        />
                    )
                })}
            </div>

            {/* Live Trails SVG Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 15px rgba(96,165,250,0.4))' }}>
                <defs>
                    <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>

                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Trail from ADO to Requirements */}
                <g opacity={isAdoActive ? 1 : 0.2}>
                    <path d="M 25% 60 L 25% 150 L 12% 150 L 12% 230" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeDasharray="4 4" className={isAdoActive ? "animate-pulse" : ""} />
                    {isAdoActive && (
                        <>
                            <path d="M 25% 60 L 25% 150 L 12% 150 L 12% 230" stroke="url(#trailGradient)" strokeWidth="4" fill="none" className="animate-trail" style={{ strokeDasharray: '60, 120' }} />
                            <circle r="4" fill="#60a5fa" filter="url(#glow)">
                                <animateMotion dur="2s" repeatCount="indefinite" path="M 25% 60 L 25% 150 L 12% 150 L 12% 230" />
                            </circle>
                        </>
                    )}
                </g>

                {/* Trail from Figma to Requirements */}
                <g opacity={isFigmaActive ? 1 : 0.2}>
                    <path d="M 50% 60 L 50% 150 L 12% 150 L 12% 230" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeDasharray="4 4" className={isFigmaActive ? "animate-pulse" : ""} />
                    {isFigmaActive && (
                        <>
                            <path d="M 50% 60 L 50% 150 L 12% 150 L 12% 230" stroke="url(#trailGradient)" strokeWidth="4" fill="none" className="animate-trail" style={{ strokeDasharray: '60, 120' }} />
                            <circle r="4" fill="#60a5fa" filter="url(#glow)">
                                <animateMotion dur="2.5s" repeatCount="indefinite" path="M 50% 60 L 50% 150 L 12% 150 L 12% 230" />
                            </circle>
                        </>
                    )}
                </g>

                {/* Trail from GitHub to Requirements & Deployment */}
                <g opacity={isGithubActive ? 1 : 0.2}>
                    {/* Path to Requirements (Step 1) */}
                    {activeStep === 1 && (
                        <>
                            <path d="M 75% 60 L 75% 150 L 12% 150 L 12% 230" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeDasharray="4 4" className={isGithubActive ? "animate-pulse" : ""} />
                            {isGithubActive && (
                                <>
                                    <path d="M 75% 60 L 75% 150 L 12% 150 L 12% 230" stroke="url(#trailGradient)" strokeWidth="4" fill="none" className="animate-trail" style={{ strokeDasharray: '60, 120' }} />
                                    <circle r="4" fill="#60a5fa" filter="url(#glow)">
                                        <animateMotion dur="3s" repeatCount="indefinite" path="M 75% 60 L 75% 150 L 12% 150 L 12% 230" />
                                    </circle>
                                </>
                            )}
                        </>
                    )}

                    {/* Path to Deployment (Step 4) */}
                    {activeStep >= 4 && (
                        <>
                            <path d="M 75% 60 L 75% 150 L 88% 150 L 88% 230" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeDasharray="4 4" className={isGithubActive ? "animate-pulse" : ""} />
                            {isGithubActive && (
                                <>
                                    <path d="M 75% 60 L 75% 150 L 88% 150 L 88% 230" stroke="url(#trailGradient)" strokeWidth="4" fill="none" className="animate-trail-reverse" style={{ strokeDasharray: '60, 120' }} />
                                    <circle r="4" fill="#60a5fa" filter="url(#glow)">
                                        <animateMotion dur="2s" repeatCount="indefinite" path="M 88% 230 L 88% 150 L 75% 150 L 75% 60" />
                                    </circle>
                                </>
                            )}
                        </>
                    )}
                </g>
            </svg>
        </div>
    )
}
