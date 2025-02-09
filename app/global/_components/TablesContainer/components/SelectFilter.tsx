import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SelectFilter = ({ options, value, onChange }: any) => {
  return (
    <Select>
      <SelectTrigger className="w-[180px] dark:text-white/50 p-3 h-8 border border-gray-300 rounded-md dark:border-gray-700">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SelectFilter;
