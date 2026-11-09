'use client';
import { createModal as createDrawer, ModalContext } from '@gluestack-ui/core/modal/creator';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import {
  tva,
  useStyleContext,
  withStyleContext,
} from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideInDown,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
  SlideOutDown,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';

const SCOPE = 'MODAL';

const AnimatedPressable = styled(
  Animated.createAnimatedComponent(Pressable) as any,
  {
    className: 'style',
  }
) as any;
const AnimatedView = styled(
  Animated.createAnimatedComponent(View) as any,
  {
    className: 'style',
  }
) as any;

const UIDrawer: any = createDrawer({
  Root: withStyleContext(View as any, SCOPE),
  Backdrop: AnimatedPressable,
  Content: AnimatedView,
  Body: ScrollView,
  CloseButton: Pressable,
  Footer: View,
  Header: View,
});

const UIDrawerRoot = UIDrawer as any;
const UIDrawerContent = UIDrawer.Content as any;
const UIDrawerHeader = UIDrawer.Header as any;
const UIDrawerBody = UIDrawer.Body as any;
const UIDrawerFooter = UIDrawer.Footer as any;
const UIDrawerCloseButton = UIDrawer.CloseButton as any;

const drawerStyle = tva({
  base: 'w-full h-full web:pointer-events-none relative',
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
    anchor: {
      left: 'items-start',
      right: 'items-end',
      top: 'justify-start',
      bottom: 'justify-end',
    },
  },
});

const drawerBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-black/50 web:cursor-default',
});

const drawerContentStyle = tva({
  base: 'bg-background p-6 absolute',
  parentVariants: {
    size: {
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
    anchor: {
      left: 'h-full border-r border-border/80',
      right: 'h-full border-l border-border/80',
      top: 'w-full border-b border-border/80 rounded-b-xl',
      bottom: 'w-full border-t border-border/80 rounded-t-xl',
    },
  },
  parentCompoundVariants: [
    {
      size: 'sm',
      anchor: 'left',
      class: 'sm:w-1/4 w-2/5',
    },
    {
      size: 'sm',
      anchor: 'right',
      class: 'sm:w-1/4 w-2/5',
    },
    {
      size: 'sm',
      anchor: 'top',
      class: 'h-1/4',
    },
    {
      size: 'sm',
      anchor: 'bottom',
      class: 'h-1/4',
    },
    {
      size: 'md',
      anchor: 'left',
      class: 'w-1/2',
    },
    {
      size: 'md',
      anchor: 'right',
      class: 'w-1/2',
    },
    {
      size: 'md',
      anchor: 'top',
      class: 'h-1/2',
    },
    {
      size: 'md',
      anchor: 'bottom',
      class: 'h-1/2',
    },
    {
      size: 'lg',
      anchor: 'left',
      class: 'w-3/4',
    },
    {
      size: 'lg',
      anchor: 'right',
      class: 'w-3/4',
    },
    {
      size: 'lg',
      anchor: 'top',
      class: 'h-3/4',
    },
    {
      size: 'lg',
      anchor: 'bottom',
      class: 'h-3/4',
    },
    {
      size: 'full',
      anchor: 'left',
      class: 'w-full',
    },
    {
      size: 'full',
      anchor: 'right',
      class: 'w-full',
    },
    {
      size: 'full',
      anchor: 'top',
      class: 'h-full',
    },
    {
      size: 'full',
      anchor: 'bottom',
      class: 'h-full',
    },
  ],
});

const drawerCloseButtonStyle = tva({
  base: 'z-10 rounded-sm p-2 data-[focus-visible=true]:bg-accent web:cursor-pointer web:outline-0 data-[hover=true]:bg-accent/50',
});

const drawerHeaderStyle = tva({
  base: 'justify-between items-center flex-row pb-4',
});

const drawerBodyStyle = tva({
  base: 'mt-4 mb-6 shrink-0',
});

const drawerFooterStyle = tva({
  base: 'flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4',
});

type IDrawerProps = React.ComponentProps<typeof View> &
  VariantProps<typeof drawerStyle> & {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
    children?: React.ReactNode;
  };

type IDrawerBackdropProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof drawerBackdropStyle> & { className?: string; children?: React.ReactNode };

type IDrawerContentProps = React.ComponentProps<typeof View> &
  VariantProps<typeof drawerContentStyle> & { className?: string; children?: React.ReactNode };

type IDrawerHeaderProps = React.ComponentProps<typeof View> &
  VariantProps<typeof drawerHeaderStyle> & { className?: string; children?: React.ReactNode };

type IDrawerBodyProps = React.ComponentProps<typeof ScrollView> &
  VariantProps<typeof drawerBodyStyle> & { className?: string; children?: React.ReactNode };

type IDrawerFooterProps = React.ComponentProps<typeof View> &
  VariantProps<typeof drawerFooterStyle> & { className?: string; children?: React.ReactNode };

type IDrawerCloseButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof drawerCloseButtonStyle> & { className?: string; children?: React.ReactNode };

const Drawer = React.forwardRef<any, IDrawerProps>(function Drawer(
  { className, size = 'md', anchor = 'left', style, ...props },
  ref
) {
  return (
    <UIDrawerRoot
      ref={ref}
      {...props}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, style]}
      className={drawerStyle({ size, anchor, class: className })}
      context={{ size, anchor }}
    />
  );
});

const DrawerBackdrop = React.forwardRef<any, IDrawerBackdropProps>(
  function DrawerBackdrop({ className, style, ...props }, ref) {
    const { closeOnOverlayClick, handleClose } = React.useContext(ModalContext);

    return (
      <Animated.View
        ref={ref}
        entering={FadeIn.duration(200).easing(Easing.in(Easing.cubic))}
        exiting={FadeOut.duration(150)}
        className={className}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          style as any,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (closeOnOverlayClick) {
              handleClose();
            }
          }}
          {...props}
        />
      </Animated.View>
    );
  }
);

const DrawerContent = React.forwardRef<any, IDrawerContentProps>(
  function DrawerContent({ className, ...props }, ref) {
    const { size: parentSize, anchor: parentAnchor } = useStyleContext(SCOPE);

    // Calculate positioning classes
    const customClass =
      parentAnchor === 'left' || parentAnchor === 'right'
        ? `top-0 ${parentAnchor === 'left' ? 'left-0' : 'right-0'}`
        : `left-0 ${parentAnchor === 'top' ? 'top-0' : 'bottom-0'}`;

    // Select entering and exiting animations based on anchor
    const enteringAnimation =
      parentAnchor === 'left'
        ? SlideInLeft.duration(200).easing(Easing.in(Easing.cubic))
        : parentAnchor === 'right'
          ? SlideInRight.duration(200)
          : parentAnchor === 'top'
            ? SlideInUp.duration(200)
            : SlideInDown.duration(200);

    const exitingAnimation =
      parentAnchor === 'left'
        ? SlideOutLeft.duration(200)
        : parentAnchor === 'right'
          ? SlideOutRight.duration(200)
          : parentAnchor === 'top'
            ? SlideOutUp.duration(200)
            : SlideOutDown.duration(200);

    return (
      <UIDrawerContent
        ref={ref}
        entering={enteringAnimation}
        exiting={exitingAnimation}
        {...props}
        className={drawerContentStyle({
          parentVariants: {
            size: parentSize,
            anchor: parentAnchor,
          },
          class: `${className || ''} ${customClass}`,
        })}
        pointerEvents="auto"
      />
    );
  }
);

const DrawerHeader = React.forwardRef<any, IDrawerHeaderProps>(
  function DrawerHeader({ className, ...props }, ref) {
    return (
      <UIDrawerHeader
        ref={ref}
        {...props}
        className={drawerHeaderStyle({
          class: className,
        })}
      />
    );
  }
);

const DrawerBody = React.forwardRef<any, IDrawerBodyProps>(
  function DrawerBody({ className, ...props }, ref) {
    return (
      <UIDrawerBody
        ref={ref}
        {...props}
        className={drawerBodyStyle({
          class: className,
        })}
      />
    );
  }
);

const DrawerFooter = React.forwardRef<any, IDrawerFooterProps>(
  function DrawerFooter({ className, ...props }, ref) {
    return (
      <UIDrawerFooter
        ref={ref}
        {...props}
        className={drawerFooterStyle({
          class: className,
        })}
      />
    );
  }
);

const DrawerCloseButton = React.forwardRef<any, IDrawerCloseButtonProps>(
  function DrawerCloseButton({ className, ...props }, ref) {
    return (
      <UIDrawerCloseButton
        ref={ref}
        {...props}
        className={drawerCloseButtonStyle({
          class: className,
        })}
      />
    );
  }
);

Drawer.displayName = 'Drawer';
DrawerBackdrop.displayName = 'DrawerBackdrop';
DrawerContent.displayName = 'DrawerContent';
DrawerHeader.displayName = 'DrawerHeader';
DrawerBody.displayName = 'DrawerBody';
DrawerFooter.displayName = 'DrawerFooter';
DrawerCloseButton.displayName = 'DrawerCloseButton';

export {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
};
