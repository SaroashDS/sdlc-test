import React from 'react'

export const WebGLShader: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 opacity-50" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),transparent_50%)]" />
        </div>
    )
}
