import { useState, useEffect } from "react";
import { DropResult } from "react-beautiful-dnd";

export interface ContentItem {
  id: string;
  keyword: string;
  title: string;
  description: string;
  ideas: string[];
  url: string;
  category: string;
  urgency: "Priority" | "Not Priority";
  assignee: string;
  date: string;
  dueDate?: string;
}

const LOCAL_STORAGE_KEY = "contentItems";

export function useContentItems() {
  const [items, setItems] = useState<ContentItem[]>(() => {
    const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedItems ? JSON.parse(storedItems) : [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      keyword: "",
      title: "",
      description: "",
      ideas: [],
      url: "",
      category: "",
      urgency: "Not Priority",
      assignee: "",
      date: new Date().toLocaleDateString(),
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ContentItem>) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return { items, addItem, updateItem, onDragEnd, removeItem };
}
