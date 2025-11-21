'use client';
import React, { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { gradientSequence } from '@/lib/colors';
import FloatingShapes from './FloatingShapes';
export default function BackgroundGradient() {
    const controls = useAnimationControls();

    useEffect(() => {
        const animateColors = async () => {
            while (true) {
                await controls.start({
                    background : gradientSequence
                    ,
                    transition: {
                        duration: 50,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatType: 'reverse',
                    },
                });
            }
        };

        animateColors();
    }, [controls]);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <motion.div
                animate={controls}
                initial={{
                    background:
                        'radial-gradient(circle at 50% 50%, #3b82f6, #9333ea, #14b8a6)',
                }}
                className="absolute inset-0 opacity-90"
                style={{
                    backgroundSize: '200% 200%',
                    filter: 'blur(120px)',
                }}
            />
            <FloatingShapes count={45} />
            <motion.div
                className="absolute inset-0 mix-blend-overlay opacity-40"
                animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                    duration: 30,
                    ease: 'easeInOut',
                    repeat: Infinity,
                }}
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4), transparent 60%)',
                    backgroundSize: '150% 150%',
                }}
            />
        </div>
    );
}
