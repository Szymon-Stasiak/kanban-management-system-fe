'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    size: number;
    shapeClass: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    rotation: number;
    scale: number;
}

function getRandomPosition() {
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
    };
}

function getRandomVelocity() {
    return {
        x: (Math.random() - 0.5) * 150, // px per duration
        y: (Math.random() - 0.5) * 150,
    };
}

function getRandomShapeClass() {
    const shapes = [
        'rounded-full',
        'rounded-xl',
        'rounded-2xl',
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

export default function FloatingShapes({ count = 15 }: { count?: number }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles: Particle[] = Array.from({ length: count }).map(() => ({
            id: Math.random(),
            size: 20 + Math.random() * 40,
            shapeClass: getRandomShapeClass(),
            position: getRandomPosition(),
            velocity: getRandomVelocity(),
            rotation: Math.random() * 360,
            scale: 0.8 + Math.random() * 0.4,
        }));
        setParticles(newParticles);
    }, [count]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute bg-white ${p.shapeClass}`}
                    style={{
                        width: p.size,
                        height: p.size,
                        top: p.position.y,
                        left: p.position.x,
                        opacity: 0.65 + Math.random() * 0.35,
                    }}
                    animate={{
                        x: [0, p.velocity.x, 0],
                        y: [0, p.velocity.y, 0],
                        rotate: [0, p.rotation, 0],
                        scale: [p.scale, p.scale + 0.2, p.scale],
                    }}
                    transition={{
                        duration: 15 + Math.random() * 10,
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
