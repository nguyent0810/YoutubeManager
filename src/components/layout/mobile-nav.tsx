"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { useUiStore } from "@/stores/ui-store"

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen)
  const setOpen = useUiStore((s) => s.setMobileNavOpen)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} side="left">
        <SheetHeader className="border-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
        </SheetHeader>
        <SheetContent className="p-0">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
