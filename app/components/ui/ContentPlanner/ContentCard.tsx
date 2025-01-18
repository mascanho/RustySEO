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
import { GripVertical, Star } from "lucide-react";

interface ContentCardProps {
  item: ContentItem;
  updateItem: (id: string, updates: Partial<ContentItem>) => void;
  dragHandleProps: any;
}

export function ContentCard({
  item,
  updateItem,
  dragHandleProps,
}: ContentCardProps) {
  const [newIdea, setNewIdea] = useState("");

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      updateItem(item.id, { ideas: [...item.ideas, newIdea.trim()] });
      setNewIdea("");
    }
  };

  return (
    <div className="bg-white shadow-lg min-h-[550px] h-fit rounded-lg p-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex-grow">
          <Input
            value={item.keyword}
            onChange={(e) => updateItem(item.id, { keyword: e.target.value })}
            placeholder="Topic (Keyword)"
            className="font-bold"
          />
        </CardTitle>
        <div {...dragHandleProps} className="cursor-move">
          <GripVertical className="h-5 w-5 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 h-full">
        <Input
          value={item.title}
          onChange={(e) => updateItem(item.id, { title: e.target.value })}
          placeholder="Topic Title"
        />
        <Textarea
          value={item.description}
          onChange={(e) => updateItem(item.id, { description: e.target.value })}
          placeholder="Topic Description"
          rows={3}
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
              className="mr-2"
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
        />
        <div className="flex items-center">
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
        </div>
        <Select
          value={item.category}
          onValueChange={(value) => updateItem(item.id, { category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
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
          <SelectTrigger>
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
        />
      </CardContent>
    </div>
  );
}
