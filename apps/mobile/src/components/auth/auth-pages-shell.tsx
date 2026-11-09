import { VStack } from "@/components/ui/vstack";
import React, { PropsWithChildren } from "react";
import AuthHeader, { AuthSubtitle, AuthTitle } from "./auth-pages-header";

export interface AuthPagesShellProps extends PropsWithChildren {
  className?: string;
}

export default function AuthPagesShell({
  children,
  className = "flex-1 px-5 py-20",
}: AuthPagesShellProps) {
  return (
    <VStack className={className} space="xl">
      {children}
    </VStack>
  );
}

AuthPagesShell.Header = AuthHeader;
AuthPagesShell.Title = AuthTitle;
AuthPagesShell.Subtitle = AuthSubtitle;
