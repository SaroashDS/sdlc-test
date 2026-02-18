import React from 'react'

interface LiquidButtonProps {
    children: React.ReactNode
    variant?: 'cool' | 'warm'
    size?: 'md' | 'lg' | 'xl'
    className?: string
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({ children, variant = 'cool', size = 'md', className = '' }) => {
    const baseStyles = "relative overflow-hidden font-bold transition-all duration-300 rounded-xl flex items-center justify-center gap-2 group"
    const variants = {
        cool: "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]",
        warm: "bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]"
    }
    const sizes = {
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg"
    }

    return (
        <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
            <span className="relative z-10">{children}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
    )
}
