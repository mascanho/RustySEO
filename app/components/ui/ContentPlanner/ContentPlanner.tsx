import { useContentItems } from "../hooks/useContentItems";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ContentCard } from "./ContentCard";

export function ContentPlanner() {
  const { items, addItem, updateItem, onDragEnd } = useContentItems();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Content Planner</h1>
      <Button onClick={addItem} className="mb-4">
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Topic
      </Button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="content-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <ContentCard
                        item={item}
                        updateItem={updateItem}
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
