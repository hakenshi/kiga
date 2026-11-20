import type { ComponentProps } from "react";
import type { Badge } from "@/components/ui/badge";

export type Sizes = NonNullable<ComponentProps<typeof Badge>["size"]>;

export interface Props {
  size?: Sizes;
}
