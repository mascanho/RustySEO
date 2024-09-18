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
    <div>
      {SHEET_SIDES.map((side) => (
        <Sheet key={side} open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <GoGear
              className="text-sky-dark cursor-pointer ml-2 animate-spin hover:animate-none"
              size={12}
            />
          </SheetTrigger>
          <SheetContent
            className="h-[50rem] overflow-hidden w-[30rem] my-auto ml-2"
            side={side}
          >
            <SheetHeader>
              <SheetTitle>SERP Headings</SheetTitle>
              <SheetDescription>
                Bulk check SERP for selected Keywords
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <section className="grid grid-cols-3 gap-2 mr-6">
                {keywords &&
                  keywords[0]?.map((kw: string, index: number) => (
                    <div
                      onClick={
                        selectedKws.includes(kw)
                          ? () => {}
                          : () => handleSelectedKWs([...selectedKws, kw])
                      }
                      key={index}
                      className="dark:bg-gray-700 bg-slate-200 w-full px-1.5 py-1 rounded-lg text-xs flex items-center"
                    >
                      <span className="bg-brand-bright px-1 py-[1px] rounded-full text-white text-xs">
                        {kw[1]}
                      </span>
                      <span className="ml-1 truncate">{kw[0]}</span>
                    </div>
                  ))}
              </section>
              <section className="flex flex-wrap border p-1 items-start justify-start gap-1">
                {selectedKws?.map((kw: string, index: number) => (
                  <div
                    key={index}
                    className="dark:bg-gray-700 flex bg-slate-200 w-fit px-1.5 py-1 rounded-lg text-xs items-center"
                  >
                    <span className="text-xs truncate">{kw[0]}</span>
                  </div>
                ))}
              </section>
            </div>
            <SheetFooter>{""}</SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
};

export default ContentSheet;
