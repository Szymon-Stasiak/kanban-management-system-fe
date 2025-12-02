import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

interface ProjectItemProps {
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export function ProjectItem({ name, description, color, createdAt }: ProjectItemProps) {
  // Use a deterministic date representation to avoid SSR/CSR hydration mismatches
  const displayDate = createdAt && createdAt.includes('T') ? createdAt.split('T')[0] : createdAt;

  return (
    <div className="flex w-full flex-col">
      <Item variant="outline" className="border-l-4" style={{ borderLeftColor: color }}>
        <ItemContent>
          <ItemTitle>{name}</ItemTitle>
          <ItemDescription>
            {description}
          </ItemDescription>
          <div className="text-sm text-gray-500 mt-2">
            Created: {displayDate}
          </div>
        </ItemContent>
        <ItemActions>
          <button className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
            View details
          </button>
        </ItemActions>
      </Item>
    </div>
  )
}
