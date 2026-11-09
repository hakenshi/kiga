'use client';
import { createAvatar } from '@gluestack-ui/core/avatar/creator';
import React from 'react';
import { Image, Text, View } from 'react-native';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
const SCOPE = 'AVATAR';

const UIAvatar = createAvatar({
  Root: withStyleContext(View, SCOPE),
  Badge: View,
  Group: View,
  Image: Image,
  FallbackText: Text,
});

const avatarStyle = tva({
  base: 'relative flex h-12 w-12 shrink-0 rounded-full bg-muted items-center justify-center group-[.avatar-group]/avatar-group:-ml-2.5',
});

const avatarFallbackTextStyle = tva({
  base: 'text-foreground text-lg font-bold uppercase',
});

const avatarGroupStyle = tva({
  base: 'group/avatar-group flex-row-reverse relative avatar-group',
});

const avatarBadgeStyle = tva({
  base: 'absolute h-3 w-3 rounded-full border-2 border-background right-0 bottom-0 bg-green-500',
});

const avatarImageStyle = tva({
  base: 'h-full w-full rounded-full absolute',
});

type IAvatarProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIAvatar>,
  'context'
> &
  VariantProps<typeof avatarStyle>;

const Avatar = React.forwardRef<
  React.ComponentRef<typeof UIAvatar>,
  IAvatarProps
>(function Avatar({ className, ...props }, ref) {
  return (
    <UIAvatar
      ref={ref}
      {...props}
      className={avatarStyle({ class: className })}
      context={{}}
    />
  );
});

type IAvatarBadgeProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Badge> &
  VariantProps<typeof avatarBadgeStyle>;

const AvatarBadge = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Badge>,
  IAvatarBadgeProps
>(function AvatarBadge({ className, ...props }, ref) {
  return (
    <UIAvatar.Badge
      ref={ref}
      {...props}
      className={avatarBadgeStyle({ class: className })}
    />
  );
});

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children.trim();
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractText).join('').trim();
  }
  if (React.isValidElement(children) && (children.props as any)?.children) {
    return extractText((children.props as any).children);
  }
  return '';
}

function getInitials(str: string): string {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  let result = '';
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > 0) {
      result += words[i].charAt(0);
    }
    if (result.length >= 2) break;
  }
  return result.toUpperCase();
}

type IAvatarFallbackTextProps = React.ComponentPropsWithoutRef<
  typeof Text
> &
  VariantProps<typeof avatarFallbackTextStyle>;
const AvatarFallbackText = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IAvatarFallbackTextProps
>(function AvatarFallbackText({ className, children, ...props }, ref) {
  const rawText = extractText(children);
  const displayText = rawText.length <= 2 ? rawText.toUpperCase() : getInitials(rawText);

  return (
    <Text
      ref={ref}
      {...props}
      className={avatarFallbackTextStyle({ class: className })}
    >
      {displayText}
    </Text>
  );
});
AvatarFallbackText.displayName = 'AvatarFallbackText';

type IAvatarImageProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Image> &
  VariantProps<typeof avatarImageStyle>;

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Image>,
  IAvatarImageProps
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <UIAvatar.Image
      ref={ref}
      {...props}
      className={avatarImageStyle({
        class: className,
      })}
      resizeMode="cover"
    />
  );
});

type IAvatarGroupProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Group> &
  VariantProps<typeof avatarGroupStyle>;

const AvatarGroup = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Group>,
  IAvatarGroupProps
>(function AvatarGroup({ className, ...props }, ref) {
  return (
    <UIAvatar.Group
      ref={ref}
      {...props}
      className={avatarGroupStyle({
        class: className,
      })}
    />
  );
});

// Compatibility component for shadcn-style wrapping or direct text
const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IAvatarFallbackTextProps
>(function AvatarFallback({ className, children, ...props }, ref) {
  if (
    React.isValidElement(children) &&
    ((children.type as any) === AvatarFallbackText ||
      (children.type as any)?.displayName === 'AvatarFallbackText')
  ) {
    return children;
  }
  return (
    <AvatarFallbackText ref={ref} className={className} {...props}>
      {children}
    </AvatarFallbackText>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarFallbackText,
  AvatarGroup,
  AvatarImage
};
