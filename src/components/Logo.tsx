import React from 'react';
import { navy } from '@/lib/colors';

export default function Logo({ size = 36 }: { size?: number }) {
    return (
        <div className="flex items-center gap-3">
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
            >
                <rect x="2" y="3" width="20" height="18" rx="4" fill={navy} className="text-slate-900/90 dark:text-white" />
                <path d="M7 8h10M7 12h6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}