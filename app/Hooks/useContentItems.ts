import { useState } from "react";
import { DropResult } from "react-beautiful-dnd";

export interface ContentItem {
  id: string;
  keyword: string;
  title: string;
  description: string;
  ideas: string[];
  url: string;
  rating: number;
  category: string;
  urgency: "Priority" | "Not Priority";
  assignee: string;
}

export function useContentItems() {
  const [items, setItems] = useState<ContentItem[]>([]);

  const addItem = () => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      keyword: "",
      title: "",
      description: "",
      ideas: [],
      url: "",
      rating: 0,
      category: "",
      urgency: "Not Priority",
      assignee: "",
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

  return { items, addItem, updateItem, onDragEnd };
}
