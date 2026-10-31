import { VStack } from "@/components/ui/vstack";
import React, { PropsWithChildren } from "react";
import { Text, TextProps } from "react-native";

export interface AuthHeaderProps extends PropsWithChildren {
  className?: string;
}

export function AuthHeader({ children, className }: AuthHeaderProps) {
  return (
    <VStack space="md" className={className}>
      {children}
    </VStack>
  );
}

export interface AuthTitleProps extends PropsWithChildren, TextProps {
  className?: string;
}

export function AuthTitle({
  children,
  className = "text-2xl font-heading font-bold",
  ...props
}: AuthTitleProps) {
  return (
    <Text className={className} {...props}>
      {children}
    </Text>
  );
}

export interface AuthSubtitleProps extends PropsWithChildren, TextProps {
  className?: string;
}

export function AuthSubtitle({
  children,
  className = "text-zinc-600 font-subtitle",
  ...props
}: AuthSubtitleProps) {
  return (
    <Text className={className} {...props}>
      {children}
    </Text>
  );
}

AuthHeader.Title = AuthTitle;
AuthHeader.Subtitle = AuthSubtitle;

export {
  AuthHeader as AuthPagesHeader,
  AuthTitle as AuthPagesTitle,
  AuthSubtitle as AuthPagesSubtitle,
};

export default AuthHeader;
