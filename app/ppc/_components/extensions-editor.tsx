// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
                    <p className="text-xs text-muted-foreground">Add assets to improve ad performance</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="text-xs bg-transparent border rounded-md px-2 py-1 dark:border-white/10"
                    >
                        <option value="callout">Callout</option>
                        <option value="structured_snippet">Structured Snippet</option>
                        <option value="call">Call</option>
                        <option value="promotion">Promotion</option>
                    </select>
                    <Button type="button" size="sm" onClick={handleAdd} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {extensions.map((ext) => (
                    <div key={ext.id} className="flex gap-3 items-start p-3 rounded-lg border dark:border-white/5 bg-gray-50/50 dark:bg-brand-dark/20 h-fit">
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                            {getIcon(ext.type)}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                                    {ext.type.replace('_', ' ')}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => handleRemove(ext.id)} className="h-6 w-6 text-red-500">
                                    <Trash className="h-3 w-3" />
                                </Button>
                            </div>

                            <Input
                                value={ext.value}
                                onChange={(e) => handleUpdate(ext.id, e.target.value, ext.extra)}
                                placeholder={ext.type === 'call' ? "Phone number" : "Extension text"}
                                className="h-8 text-xs"
                            />

                            {ext.type === 'promotion' && (
                                <Input
                                    value={ext.extra || ""}
                                    onChange={(e) => handleUpdate(ext.id, ext.value, e.target.value)}
                                    placeholder="Promotion code (Optional)"
                                    className="h-8 text-xs mt-1"
                                />
                            )}
                        </div>
                    </div>
                ))}

                {extensions.length === 0 && (
                    <div className="text-center py-6 border border-dashed rounded-lg opacity-50">
                        <p className="text-xs">No extensions added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
