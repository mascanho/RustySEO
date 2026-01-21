// @ts-nocheck
"use client";

import { useState } from "react";
import { Plus, Trash, Phone, Type, Tag, DollarSign, LayoutList } from "lucide-react";
import type { AdExtension } from "@/types/ad";

interface ExtensionsEditorProps {
    extensions: AdExtension[];
    onChange: (extensions: AdExtension[]) => void;
}

export function ExtensionsEditor({ extensions, onChange }: ExtensionsEditorProps) {
    const [newType, setNewType] = useState<AdExtension['type']>('callout');

    const handleAdd = () => {
        const extension: AdExtension = {
            id: Math.random().toString(36).substring(7),
            type: newType,
            value: "",
        };
        onChange([...extensions, extension]);
    };

    const handleUpdate = (id: string, value: string, extra?: string) => {
        onChange(extensions.map(ext =>
            ext.id === id ? { ...ext, value, extra } : ext
        ));
    };

    const handleRemove = (id: string) => {
        onChange(extensions.filter(ext => ext.id !== id));
    };

    const getIcon = (type: AdExtension['type']) => {
        switch (type) {
            case 'callout': return <LayoutList className="h-4 w-4" />;
            case 'structured_snippet': return <Type className="h-4 w-4" />;
            case 'call': return <Phone className="h-4 w-4" />;
            case 'price': return <DollarSign className="h-4 w-4" />;
            case 'promotion': return <Tag className="h-4 w-4" />;
            default: return <Plus className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Ad Extensions</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black opacity-60">Add assets to improve ad performance</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="text-[11px] bg-white dark:bg-brand-darker border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            backgroundSize: '12px',
                            paddingRight: '32px'
                        }}
                    >
                        <option value="callout">Callout</option>
                        <option value="structured_snippet">Structured Snippet</option>
                        <option value="call">Call</option>
                        <option value="promotion">Promotion</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
                    >
                        <Plus className="h-3.5 w-3.5" /> <span>Add</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {extensions.map((ext) => (
                    <div key={ext.id} className="flex gap-4 items-start p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-brand-dark/20 shadow-sm transition-all hover:shadow-md h-fit">
                        <div className="bg-blue-100/50 dark:bg-blue-500/10 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200/50 dark:border-blue-500/20">
                            {getIcon(ext.type)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-blue-500/70">
                                    {ext.type.replace('_', ' ')}
                                </span>
                                <button
                                    onClick={() => handleRemove(ext.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <input
                                value={ext.value}
                                onChange={(e) => handleUpdate(ext.id, e.target.value, ext.extra)}
                                placeholder={ext.type === 'call' ? "Phone number" : "Extension text"}
                                className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                            />

                            {ext.type === 'promotion' && (
                                <input
                                    value={ext.extra || ""}
                                    onChange={(e) => handleUpdate(ext.id, ext.value, e.target.value)}
                                    placeholder="Promotion code (Optional)"
                                    className="w-full px-3 h-9 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400 mt-1 text-gray-900 dark:text-gray-100"
                                />
                            )}
                        </div>
                    </div>
                ))}

                {extensions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl opacity-50 space-y-2">
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full">
                            <LayoutList className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">No extensions added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
