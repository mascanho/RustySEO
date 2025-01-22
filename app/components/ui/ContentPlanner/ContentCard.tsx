import { useState } from "react";
import { ContentItem } from "@/app/Hooks/useContentItems";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Star, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface ContentCardProps {
  item: ContentItem;
  updateItem: (id: string, updates: Partial<ContentItem>) => void;
  removeItem: (id: string) => void | undefined;
  dragHandleProps: any;
}

export function ContentCard({
  item,
  updateItem,
  dragHandleProps,
  removeItem,
}: ContentCardProps) {
  const [newIdea, setNewIdea] = useState("");
  const [date, setDate] = useState<Date | undefined>(
    item.dueDate ? new Date(item.dueDate) : undefined,
  );

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      updateItem(item.id, { ideas: [...item.ideas, newIdea.trim()] });
      setNewIdea("");
    }
  };

  return (
    <div className="bg-white shadow-lg min-h-[550px] h-fit rounded-lg p-2 relative dark:bg-brand-darker border-white-50">
      <CardHeader className="flex flex-col w-full  space-y-1 pb-2 pt-8 dark:bg-brand-darker">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-full dark:bg-green-200 -ml-4 justify-start text-left w-fit font-normal my-1 ${
                date ? "bg-red-400 text-white" : ""
              }`}
            >
              {date ? format(date, "PPP") : <span>Pick a Due Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto my-1" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                updateItem(item.id, { dueDate: newDate?.toISOString() });
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0"
            onClick={() => removeItem(item.id)}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
          <div
            {...dragHandleProps}
            className="cursor-move absolute top-2 left-1/2 -translate-x-1/2"
          >
            <GripVertical className="h-5 w-5 text-gray-500 rotate-90" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 h-full">
        <Input
          value={item.keyword}
          onChange={(e) => updateItem(item.id, { keyword: e.target.value })}
          placeholder="Topic (Keyword)"
          className="font-bold w-full dark:text-white/50"
        />
        <Input
          value={item.title}
          onChange={(e) => updateItem(item.id, { title: e.target.value })}
          placeholder="Topic Title"
          className="w-full dark:text-white/50"
        />
        <Textarea
          value={item.description}
          onChange={(e) => updateItem(item.id, { description: e.target.value })}
          placeholder="Topic Description"
          rows={3}
          className="w-full dark:bg-brand-darker dark:text-white/50 dark:placeholder:text-white/50 dark:border dark:border-white/10"
        />
        <div>
          <h4 className="font-semibold mb-1">Ideas:</h4>
          <ul className="list-disc list-inside">
            {item.ideas.map((idea, index) => (
              <li key={index}>{idea}</li>
            ))}
          </ul>
          <div className="flex mt-2">
            <Input
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="New Idea"
              className="mr-2 w-full"
            />
            <Button onClick={handleAddIdea} size="sm">
              Add
            </Button>
          </div>
        </div>
        <Input
          value={item.url}
          onChange={(e) => updateItem(item.id, { url: e.target.value })}
          placeholder="URL"
          className="w-full"
        />
        {/* <div className="flex items-center">
          <span className="mr-2">Rating:</span>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant="ghost"
              size="sm"
              onClick={() => updateItem(item.id, { rating })}
            >
              <Star
                className={`h-4 w-4 ${
                  rating <= item.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </Button>
          ))}
        </div> */}

        <Select
          value={item.category}
          onValueChange={(value) => updateItem(item.id, { category: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
            <SelectItem value="Social Proof">Social Proof</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={item.urgency}
          onValueChange={(value) =>
            updateItem(item.id, {
              urgency: value as "Priority" | "Not Priority",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Priority">Priority</SelectItem>
            <SelectItem value="Not Priority">Not Priority</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={item.assignee}
          onChange={(e) => updateItem(item.id, { assignee: e.target.value })}
          placeholder="Assignee"
          className="w-full"
        />
      </CardContent>
    </div>
  );
}
