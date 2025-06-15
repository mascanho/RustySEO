export const dynamic = "force-static";
import { Toaster } from "@/components/ui/sonner";
import MenuDrawer from "../components/ui/MenuDrawer";

export default function Layout({ children }: any) {
  return (
    <main className="-mt-24 h-screen overflow-hidden">
      {children}
      <Toaster />
    </main>
  );
}
