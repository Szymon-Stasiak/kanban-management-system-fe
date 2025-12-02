'use client';

import React, {useState} from 'react';
import {FaTachometerAlt, FaTasks, FaUser, FaArrowRight, FaSignOutAlt} from 'react-icons/fa';
import Logo from "@/components/Logo";
import {motion, AnimatePresence} from 'framer-motion';
import {useRouter} from "next/navigation";
import ConfirmModal from "@/components/modals/ConfirmModal";
import {authRequest, logout} from "@/lib/auth";

export default function Navbar() {
    const router = useRouter();
    const [showLogOutModal, setShowLogOutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [isExpanded, setIsExpanded] = useState(false);

    // Sync expansion state from localStorage after mount to avoid SSR/client hydration mismatch
    React.useEffect(() => {
        try {
            const stored = localStorage.getItem('navbarExpanded');
            if (stored !== null) setIsExpanded(stored === 'true');
        } catch (e) {
            // ignore
        }
    }, []);

    const handleLogOut= async () => {
        setLoggingOut(true);
            logout();
            router.push('/login');
    };

    const toggleExpand = () => {
        setIsExpanded(prev => {
            localStorage.setItem('navbarExpanded', (!prev).toString());
            return !prev;
        });
    };

    const menuItems = [
        {icon: <FaTachometerAlt/>, label: 'Dashboard', path: '/dashboard'},
        {icon: <FaTasks/>, label: 'Tasks', path: '/tasks'},
        {icon: <FaUser/>, label: 'Profile', path: '/profile'},
    ];

    return (
        <motion.div
            animate={{width: isExpanded ? 224 : 80}}
            initial={false}
            transition={{type: 'spring', stiffness: 220, damping: 25}}
            className="bg-white rounded-[40px] h-full flex flex-col justify-between shadow-lg py-6 overflow-hidden"
        >
            <div className="flex items-center mb-6 pl-6 pr-6">
                <Logo/>
                {isExpanded && (
                    <motion.span
                        initial={false}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -10}}
                        transition={{duration: 0.3}}
                        className="ml-4 text-lg font-semibold"
                    >
                        Kanban
                    </motion.span>
                )}
            </div>

            <motion.div
                animate={{width: isExpanded ? 160 : 48}}
                initial={false}
                transition={{type: 'spring', stiffness: 220, damping: 25}}
                className="border-t border-gray-300 mb-6 mx-auto"
            />

            <div className="flex flex-col flex-1 gap-6">
                {menuItems.map((item) => (
                    <motion.div
                        key={item.label}
                        onClick={() => router.push(item.path)}
                        initial={false}
                        animate={isExpanded ? "expanded" : "collapsed"}
                        variants={{
                            expanded: {width: "100%"},
                            collapsed: {width: "auto"},
                        }}
                        className={`relative flex items-center gap-4 px-4 py-3 w-full rounded-full hover:bg-gray-100 hover:text-blue-500 transition-colors cursor-pointer`}
                    >
                        <div className="flex-shrink-0 w-10 flex justify-center">
                            <motion.div
                                className={`text-3xl ${!isExpanded ? 'hover:scale-125 transition-transform duration-200' : ''}`}
                                layout
                            >
                                {item.icon}
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    key="label"
                                    initial={false}
                                    animate={{opacity: 1, x: 0}}
                                    exit={{opacity: 0, x: -10}}
                                    transition={{duration: 0.3}}
                                    className="text-sm font-medium"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col px-1">

                <motion.div
                    onClick={() => setShowLogOutModal(true)}
                    initial={false}
                    animate={isExpanded ? "expanded" : "collapsed"}
                    variants={{
                        expanded: {width: "100%"},
                        collapsed: {width: "auto"},
                    }}
                    className="relative flex items-center gap-4 px-4 py-3 w-full rounded-full hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer mb-4"
                >
                    <div className="flex-shrink-0 w-10 flex justify-center">
                        <motion.div
                            className={`text-3xl ${!isExpanded ? 'hover:scale-125 transition-transform duration-200' : ''}`}
                            layout
                        >
                            <FaSignOutAlt/>
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                key="logout"
                                initial={{opacity: 0, x: -10}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: -10}}
                                transition={{duration: 0.3}}
                                className="text-sm font-medium"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>


            <div className="flex flex-col px-6">
                <motion.div
                    animate={{width: isExpanded ? 160 : 48}}
                    initial={false}
                    transition={{type: 'spring', stiffness: 220, damping: 25}}
                    className="border-t border-gray-300 my-6"
                />
                <motion.button
                    onClick={toggleExpand}
                    className="p-2 rounded-full flex justify-center items-center"
                    animate={{rotate: isExpanded ? 180 : 0}}
                    transition={{type: 'spring', stiffness: 220, damping: 25}}
                >
                    <FaArrowRight className="text-xl"/>
                </motion.button>
            </div>
            <ConfirmModal
                show={showLogOutModal}
                onClose={() => setShowLogOutModal(false)}
                onConfirm={handleLogOut}
                confirming={loggingOut}
                title="Are you sure you want to log out?"
                description=""
                confirmText="Log Out"
                cancelText="Cancel"
            />
        </motion.div>
    );
}
