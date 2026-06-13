"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavItem[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const renderSubItems = (subItems: NavItem[] | undefined) => {
    if (!subItems) return null

    return (
      <SidebarMenuSub>
        {subItems.map((subItem) => (
          <Collapsible
            key={subItem.title}
            asChild
            defaultOpen={subItem.isActive}
            className="group/collapsible"
          >
            <SidebarMenuSubItem>
              {subItem.items ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuSubButton>
                      <span>{subItem.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 h-4 w-4" />
                    </SidebarMenuSubButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {renderSubItems(subItem.items)}
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuSubButton asChild>
                  <a href={subItem.url}>
                    <span>{subItem.title}</span>
                  </a>
                </SidebarMenuSubButton>
              )}
            </SidebarMenuSubItem>
          </Collapsible>
        ))}
      </SidebarMenuSub>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {renderSubItems(item.items)}
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
