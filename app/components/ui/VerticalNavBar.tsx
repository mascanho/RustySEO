"use client";

import { MENUS } from "@/app/Data/Menus";
import MenuDrawer from "./MenuDrawer";

function VerticalNavBar() {
  return (
    <div className="min-h-screen w-32 border">
      <div>
        <img
          src="https://tauri.app/logo.svg"
          alt="Tauri Logo"
          className="mx-auto"
        />
      </div>

      <section className="flex flex-col justify-center items-center">
        <MenuDrawer />
      </section>
    </div>
  );
}

export default VerticalNavBar;
