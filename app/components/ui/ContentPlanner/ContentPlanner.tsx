import { useContentItems } from "@/app/Hooks/useContentItems";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { useState, useEffect } from "react";

export function ContentPlanner() {
  const { items, addItem, updateItem, removeItem, onDragEnd } =
    useContentItems();
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    const heights = items.map(
      (item) => document.getElementById(item.id)?.offsetHeight || 0,
    );
    setMaxHeight(Math.max(...heights));
  }, [items]);

  return (
    <div className="mx-auto p-4 h-full">
      <button
        onClick={addItem}
        className="mb-4 flex items-center py-2 bg-brand-bright text-white px-2 text-xs rounded-md"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Topic
      </button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="content-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid xl:gap-6 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-full"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex flex-col h-full"
                    >
                      <ContentCard
                        item={item}
                        updateItem={updateItem}
                        removeItem={removeItem}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
