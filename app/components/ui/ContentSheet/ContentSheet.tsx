import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { GoGear } from "react-icons/go";

const ContentSheet = ({ children, keywords }: any) => {
  const SHEET_SIDES = ["left"] as const;
  const [isOpen, setIsOpen] = useState(true);
  const [selectedKws, setSelectedKws] = useState<string[]>([]);

  const handleSelectedKWs = (kws: string[]) => {
    setSelectedKws(kws);
  };

  return (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default ContentSheet;
