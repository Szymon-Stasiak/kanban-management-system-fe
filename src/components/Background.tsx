'use client';


import React from 'react';
import {motion} from 'framer-motion';


// Losowe kształty tła — proste i lekkie
const shapes = [
    {size: 220, radius: 36, x: -0.2, y: -0.15, rotate: 12},
    {size: 160, radius: 28, x: 0.8, y: -0.25, rotate: -18},
    {size: 120, radius: 20, x: -0.7, y: 0.7, rotate: 45},
    {size: 180, radius: 28, x: 0.4, y: 0.6, rotate: -8},
];


export default function Background() {
    return (
        <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 via-white to-slate-100 opacity-95"/>


            {shapes.map((s, i) => (
                <motion.div
                    key={i}
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{
                        translateX: [0, 20 * (i % 2 === 0 ? 1 : -1), 0],
                        translateY: [0, -10 * (i % 3 === 0 ? 1 : -1), 0],
                        rotate: [s.rotate - 6, s.rotate + 6, s.rotate - 6],
                        opacity: [0.6, 0.85, 0.6],
                    }}
                    transition={{duration: 14 + i * 3, repeat: Infinity, ease: 'easeInOut'}}
                    className="pointer-events-none"
                    style={{
                        position: 'absolute',
                        left: `${(s.x + 1) * 40}%`,
                        top: `${(s.y + 1) * 40}%`,
                        width: s.size,
                        height: s.size,
                        borderRadius: s.radius,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(250,250,255,0.6))',
                        boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
                        backdropFilter: 'blur(6px)'
                    }}
                />
            ))}


            {/* Subtle animated radial lights */}
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: [0, 0.06, 0]}}
                transition={{duration: 18, repeat: Infinity, ease: 'easeInOut'}}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]"
                style={{
                    backgroundImage: 'radial-gradient(800px 400px at 10% 20%, rgba(99,102,241,0.06), transparent 10%, rgba(14,165,233,0.02) 30%, transparent 60%), radial-gradient(700px 300px at 90% 80%, rgba(236,72,153,0.03), transparent 10%)'
                }}
            />
        </div>
    );
}