'use client';
import React, { useEffect, useState } from 'react';
import SharedLayout from '@/components/layouts/SharedLayout';
import { CustomTable } from '@/components/CustomTable';
import { authRequest } from '@/lib/auth';
import { Description } from '@radix-ui/react-dialog';

interface Task {
    id: string;
    name: string;
    description: string;
    priority: string;
    completed: boolean;
    column: number;
    position: number;
    createdAt: string;

    due_date: string;
}

export default function DashboardPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const formatDate = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        if (Number.isNaN(d.getTime())) return "Invalid date";

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}-${month}-${year}`; //Converts the due date from YYYY-MM-DD to DD-MM-YYYY
    };                                    // (Display only, in DB is YYYY-MM-DD)

    const [filterDueStatus, setFilterDueStatus] =
        useState<"" | "today" | "upcoming" | "overdue">("");
    const [filterDueDate, setFilterDueDate] = useState<string>("");
    const [filterPriority, setFilterPriority] =
        useState<"" | "low" | "medium" | "high">("");
    const [filterCompleted, setFilterCompleted] =
        useState<"" | "completed" | "not_completed">("");
    const [filterCreatedFrom, setFilterCreatedFrom] = useState<string>("");
    const [filterCreatedTo, setFilterCreatedTo] = useState<string>("");
    const [searchTaskName, setSearchTaskName] = useState<string>("")

    const handleClearFilters = () => {
        setFilterDueStatus("");
        setFilterDueDate("");
        setFilterPriority("");
        setFilterCompleted("");
        setFilterCreatedFrom("");
        setFilterCreatedTo("");
        setSearchTaskName("");
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };


    // Fetch all tasks on mount
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await authRequest<any[]>({ method: 'get', url: '/tasks/getall' });
                const items = Array.isArray(data) ? data.map((t: any) => ({
                    id: t.public_task_id || t.id,
                    name: t.name || t.title,
                    description: t.description,
                    priority: t.priority || 'N/A',
                    completed: !!t.completed || !!t.is_completed,
                    position: t.position, 
                    column: t.column_id,
                    createdAt: t.created_at ?? t.createdAt ?? t.created,
                    due_date: t.due_date || 'No set Due Date',
                })) : [];
                setTasks(items);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch tasks');
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const filteredTasks = tasks.filter((t) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const due = t.due_date ? new Date(t.due_date) : null;
        const created = t.createdAt ? new Date(t.createdAt) : null;
        const normalizedSearch = searchTaskName.trim().toLowerCase();

        // today/upcoming/overdue
        if (filterDueStatus === "today") {
            if (!due) return false;
            const d = new Date(due);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() !== today.getTime()) return false;
        }

        if (filterDueStatus === "upcoming") {
            if (!due) return false;
            if (due < tomorrow) return false;
        }

        if (filterDueStatus === "overdue") {
            if (!due) return false;
            if (due >= today) return false;
        }

        //Exact due date filter
        if (filterDueDate) {
            if (!due) return false;
            const filterDate = new Date(filterDueDate);
            filterDate.setHours(0, 0, 0, 0);

            const d = new Date(due);
            d.setHours(0, 0, 0, 0);

            if (d.getTime() !== filterDate.getTime()) return false;
        }

        //Priority
        if (filterPriority && t.priority !== filterPriority) {
            return false;
        }

        //Completed or not
        if (filterCompleted === "completed" && !t.completed) return false;
        if (filterCompleted === "not_completed" && t.completed) return false;

        //Creation date range
        if (filterCreatedFrom) {
            if (!created) return false;
            const from = new Date(filterCreatedFrom);
            from.setHours(0, 0, 0, 0);
            if (created < from) return false;
        }

        if (filterCreatedTo) {
            if (!created) return false;
            const to = new Date(filterCreatedTo);
            to.setHours(23, 59, 59, 999);
            if (created > to) return false;
        }

        if (normalizedSearch) {
            const taskName = (t.name ?? "").toLowerCase();
            if (!taskName.includes(normalizedSearch)) {
                return false;
            }
        }

        return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (!sortColumn) return 0;

        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
            case 'name':
            case 'description':
                aVal = (a[sortColumn] || '').toLowerCase();
                bVal = (b[sortColumn] || '').toLowerCase();
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
                break;
            case 'completed':
                aVal = a.completed ? 1 : 0;
                bVal = b.completed ? 1 : 0;
                break;
            case 'column':
            case 'position':
                aVal = a[sortColumn] || 0;
                bVal = b[sortColumn] || 0;
                break;
            case 'createdAt':
            case 'due_date':
                aVal = a[sortColumn] ? new Date(a[sortColumn]).getTime() : 0;
                bVal = b[sortColumn] ? new Date(b[sortColumn]).getTime() : 0;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold mb-1">Tasks</h2>
                        <p className="text-slate-600">View all your tasks</p>
                    </div>

                    {/* FILTER BOX */}
                    <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Filter</h3>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {/* Due date (Past/Today/Upcoming */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Due date
                                </label>
                                <select
                                    className="w-full border rounded px-2 py-1"
                                    value={filterDueStatus}
                                    onChange={(e) =>
                                        setFilterDueStatus(e.target.value as typeof filterDueStatus)
                                    }
                                >
                                    <option value="">All</option>
                                    <option value="today">Today</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>

                            {/* Exact due date */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Due date (exact)
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded px-2 py-1"
                                    value={filterDueDate}
                                    onChange={(e) => setFilterDueDate(e.target.value)}
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Priority
                                </label>
                                <select
                                    className="w-full border rounded px-2 py-1"
                                    value={filterPriority}
                                    onChange={(e) =>
                                        setFilterPriority(e.target.value as typeof filterPriority)
                                    }
                                >
                                    <option value="">All</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Completed */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Completed
                                </label>
                                <select
                                    className="w-full border rounded px-2 py-1"
                                    value={filterCompleted}
                                    onChange={(e) =>
                                        setFilterCompleted(e.target.value as typeof filterCompleted)
                                    }
                                >
                                    <option value="">All</option>
                                    <option value="completed">Completed</option>
                                    <option value="not_completed">Not completed</option>
                                </select>
                            </div>

                            {/* Creation date range */}
                            <div className="sm:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Creation date
                                </label>
                                <div className="flex gap-2">
                                    <label className="block text-xs font-small text-slate-500 mb-1">
                                        From:
                                    </label>
                                    <input
                                        type="date"
                                        className="w-1/2 border rounded px-2 py-1"
                                        value={filterCreatedFrom}
                                        onChange={(e) => setFilterCreatedFrom(e.target.value)}
                                    />
                                    <label className="block text-xs font-small text-slate-500 mb-1">
                                        To:
                                    </label>
                                    <input
                                        type="date"
                                        className="w-1/2 border rounded px-2 py-1"
                                        value={filterCreatedTo}
                                        onChange={(e) => setFilterCreatedTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex flex-col gap-2 sm:gap-4">
                            <h3 className="text-sm font-semibold text-slate-700">Search by name</h3>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={searchTaskName}
                                    placeholder="Search here"
                                    id="searchInput"
                                    type="text"
                                    onChange={(e) => setSearchTaskName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading tasks...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : filteredTasks.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">
                        No tasks match your filters
                        </p>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <CustomTable
                                data={sortedTasks.map((t) => {
                                    let formattedDate = "";
                                    if (t.createdAt) {
                                        const date = new Date(t.createdAt);
                                        formattedDate = date.toLocaleString("sv-SE", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                    }
                                    return {
                                        name: t.name,
                                        description: t.description,
                                        priority: t.priority,
                                        completed: t.completed ? "Yes" : "No",
                                        createdAt: formattedDate,
                                        due_date: formatDate(t.due_date),
                                        column: t.column,
                                        position: t.position
                                    };
                                })}
                                columnHeaders={["Name", "Description", "Priority", "Completed", "Created at", "Due Date", "Column", "Position"]}
                                path="/tasks"
                                onHeaderClick={(header) => {
                                    const columnMap: Record<string, string> = {
                                        'Name': 'name',
                                        'Description': 'description',
                                        'Priority': 'priority',
                                        'Completed': 'completed',
                                        'Created at': 'createdAt',
                                        'Due Date': 'due_date',
                                        'Column': 'column',
                                        'Position': 'position'
                                    };
                                    const column = columnMap[header];
                                    if (column) handleSort(column);
                                }}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                            />
                        </div>
                    )}
                </div>
            </div>
        </SharedLayout>
    );
}
