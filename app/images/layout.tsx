import MenuDrawer from "../components/ui/MenuDrawer";

export default function ImagesLayout({ children }: any) {
  return (
    <main className="-mt-20 h-full">
      <div className="dark:bg-brand-darker w-full bg-red-500 h-11">
        <MenuDrawer />
      </div>
      {children}
    </main>
  );
}
