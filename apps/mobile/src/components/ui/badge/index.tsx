'use client';
import {
  tva,
  useStyleContext,
  withStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import React from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';

const SCOPE = 'BADGE';
const Root = withStyleContext(Pressable, SCOPE);

const badgeStyle = tva({
  base: 'flex-row items-center justify-center border h-fit',
  variants: {
    variant: {
      default: 'bg-primary border-primary',
      secondary: 'bg-secondary border-border',
      outline: 'bg-background border-border',
      muted: 'bg-muted border-transparent',
      destructive: 'bg-destructive border-destructive',
      thought: 'bg-[#F0ECFA] border-[#DFD6F5]',
      emotion: 'bg-[#E8F1FB] border-[#D0E3F7]',
      reaction: 'bg-[#FDF3E2] border-[#F7E3BE]',
      behavior: 'bg-[#EAF6F0] border-[#CBEAD9]',
    },
    size: {
      xs: 'min-h-[22px] px-1.5 py-0.5 gap-1',
      sm: 'min-h-[26px] px-2.5 py-1 gap-1.5',
      md: 'min-h-[32px] px-3 py-1.5 gap-1.5',
      lg: 'min-h-[36px] px-3.5 py-2 gap-2',
    },
    rounding: {
      none: 'rounded-none',
      xs: 'rounded-xs',
      sm: 'rounded-sm',
      md: 'rounded-md',
      default: 'rounded-[10px]',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
    rounding: 'default',
  },
});

const badgeTextStyle = tva({
  base: 'web:select-none shrink',
  parentVariants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive-foreground',
      thought: 'text-[#4B3B8F]',
      emotion: 'text-[#1E4E8C]',
      reaction: 'text-[#8A5A12]',
      behavior: 'text-[#166534]',
    },
    size: {
      xs: 'text-[10.5px]',
      sm: 'text-[12px]',
      md: 'text-[13px]',
      lg: 'text-[14px]',
    },
  },
  defaultVariants: {
    size: 'sm',
    variant: 'default',
  },
});

const badgeIconStyle = tva({
  base: 'pointer-events-none shrink-0',
  parentVariants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive-foreground',
      thought: 'text-[#4B3B8F]',
      emotion: 'text-[#1E4E8C]',
      reaction: 'text-[#8A5A12]',
      behavior: 'text-[#166534]',
    },
    size: {
      xs: 'h-2.5 w-2.5',
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    },
  },
});

const variantColorMap: Record<string, string> = {
  default: '#FFFFFF',
  secondary: '#18181B',
  outline: '#18181B',
  muted: '#71717A',
  destructive: '#FFFFFF',
  thought: '#4B3B8F',
  emotion: '#1E4E8C',
  reaction: '#8A5A12',
  behavior: '#166534',
};

const iconSizeMap: Record<string, number> = {
  xs: 10,
  sm: 12,
  md: 13,
  lg: 15,
};

const badgeActionHitSlopMap: Record<string, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
};

const badgeGroupStyle = tva({
  base: 'flex-row items-center',
  variants: {
    space: {
      '2xs': 'gap-0.5',
      'xs': 'gap-1',
      'sm': 'gap-1.5',
      'md': 'gap-2',
      'lg': 'gap-3',
      'xl': 'gap-4',
    },
    flexDirection: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    isAttached: {
      true: 'gap-0',
    },
  },
  defaultVariants: {
    space: 'sm',
    flexDirection: 'row',
    wrap: false,
  },
});

type IBadgeProps = Omit<
  React.ComponentPropsWithoutRef<typeof Pressable>,
  'context'
> &
  VariantProps<typeof badgeStyle> & {
    className?: string;
    rounded?: VariantProps<typeof badgeStyle>['rounding'];
  };

const Badge = React.forwardRef<React.ElementRef<typeof Pressable>, IBadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'sm',
      rounding,
      rounded,
      onPress,
      ...props
    },
    ref
  ) => {
    const resolvedRounding = rounding ?? rounded ?? 'default';
    const isPressable = Boolean(onPress);

    return (
      <Root
        ref={ref}
        onPress={onPress}
        disabled={!isPressable}
        accessibilityRole={isPressable ? 'button' : undefined}
        className={badgeStyle({
          variant,
          size,
          rounding: resolvedRounding,
          class: `${isPressable ? 'active:opacity-75' : ''} ${className ?? ''}`,
        })}
        context={{ variant, size, rounding: resolvedRounding }}
        {...props}
      />
    );
  }
);

type IBadgeTextProps = React.ComponentPropsWithoutRef<typeof Text> &
  VariantProps<typeof badgeTextStyle> & { className?: string };

const BadgeText = React.forwardRef<React.ElementRef<typeof Text>, IBadgeTextProps>(
  ({ className, size, style, ...props }, ref) => {
    const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);
    const isBold =
      className?.includes('font-bold') || className?.includes('font-heading');
    const isMedium = className?.includes('font-medium');

    return (
      <Text
        ref={ref}
        {...props}
        style={[
          {
            fontFamily: isBold
              ? 'PlusJakartaSans_700Bold'
              : isMedium
                ? 'PlusJakartaSans_500Medium'
                : 'PlusJakartaSans_600SemiBold',
            fontWeight: 'normal',
          },
          style,
        ]}
        className={badgeTextStyle({
          parentVariants: {
            size: parentSize,
            variant: parentVariant,
          },
          size,
          class: className,
        })}
      />
    );
  }
);

type IBadgeIconProps = {
  className?: string;
  as?: React.ElementType;
  size?: number | 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  children?: React.ReactNode;
};

const BadgeIcon = React.forwardRef<any, IBadgeIconProps>(
  ({ className, as: Component, size, color, children, ...props }, ref) => {
    const { size: parentSize, variant: parentVariant } = useStyleContext(SCOPE);

    const resolvedSize =
      typeof size === 'number'
        ? size
        : iconSizeMap[size ?? parentSize ?? 'sm'] ?? 12;

    const resolvedColor =
      color ?? (parentVariant ? variantColorMap[parentVariant] : undefined) ?? '#18181B';

    if (Component) {
      return (
        <Component
          ref={ref}
          size={resolvedSize}
          color={resolvedColor}
          className={badgeIconStyle({
            parentVariants: {
              size: parentSize,
              variant: parentVariant,
            },
            class: className,
          })}
          {...props}
        />
      );
    }

    if (children) {
      return <>{children}</>;
    }

    return null;
  }
);

type IBadgeActionProps = React.ComponentPropsWithoutRef<typeof Pressable> & {
  className?: string;
  hitSlop?: PressableProps['hitSlop'];
};

const BadgeAction = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  IBadgeActionProps
>(({ className, hitSlop, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);
  const resolvedHitSlop =
    hitSlop ?? badgeActionHitSlopMap[parentSize ?? 'sm'] ?? 8;

  return (
    <Pressable
      ref={ref}
      hitSlop={resolvedHitSlop}
      accessibilityRole="button"
      className={`items-center justify-center active:opacity-60 ${className ?? ''}`}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';
BadgeText.displayName = 'BadgeText';
BadgeIcon.displayName = 'BadgeIcon';
BadgeAction.displayName = 'BadgeAction';

type IBadgeGroupProps = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof badgeGroupStyle>;

const BadgeGroup = React.forwardRef<React.ElementRef<typeof View>, IBadgeGroupProps>(
  (
    {
      className,
      space = 'sm',
      flexDirection = 'row',
      wrap = false,
      isAttached = false,
      ...props
    },
    ref
  ) => {
    return (
      <View
        ref={ref}
        className={badgeGroupStyle({
          space,
          flexDirection,
          wrap,
          isAttached,
          class: className,
        })}
        {...props}
      />
    );
  }
);
BadgeGroup.displayName = 'BadgeGroup';

export { Badge, BadgeText, BadgeIcon, BadgeAction, BadgeGroup };
