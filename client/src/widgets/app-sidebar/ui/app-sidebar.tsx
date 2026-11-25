import { Link, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Car01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar";

const NAV_ITEMS = [
  { title: "All Cars", to: "/cars", icon: Car01Icon },
  { title: "Add Car", to: "/cars/new", icon: PlusSignIcon },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/cars" />}>
              <img
                src="/logo.png"
                alt="HAUP"
                className="size-8 shrink-0 rounded-lg object-contain"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">HAUP</span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Fleet</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  render={<Link to={item.to} />}
                  isActive={pathname === item.to}
                  tooltip={item.title}
                >
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
