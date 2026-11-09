'use client';
import {
  createAlertDialog,
  AlertDialogContext,
} from '@gluestack-ui/core/alert-dialog/creator';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import {
  tva,
  useStyleContext,
  withStyleContext,
} from '@gluestack-ui/utils/nativewind-utils';
import { styled } from 'nativewind';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  Easing,
} from 'react-native-reanimated';

const SCOPE = 'ALERT_DIALOG';

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

const UIAlertDialog: any = createAlertDialog({
  Root: withStyleContext(View as any, SCOPE),
  Backdrop: AnimatedPressable,
  Content: AnimatedView,
  Body: View,
  CloseButton: Pressable,
  Footer: View,
  Header: View,
});

const UIAlertDialogRoot = UIAlertDialog as any;
const UIAlertDialogContent = UIAlertDialog.Content as any;
const UIAlertDialogHeader = UIAlertDialog.Header as any;
const UIAlertDialogBody = UIAlertDialog.Body as any;
const UIAlertDialogFooter = UIAlertDialog.Footer as any;
const UIAlertDialogCloseButton = UIAlertDialog.CloseButton as any;

const alertDialogStyle = tva({
  base: 'w-full h-full justify-center items-center p-4',
  variants: {
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
  },
});

const alertDialogBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-black/50',
});

const alertDialogContentStyle = tva({
  base: 'bg-white rounded-2xl p-6 overflow-hidden shadow-2xl border border-gray-100',
  parentVariants: {
    size: {
      xs: 'w-[60%] max-w-[360px]',
      sm: 'w-[70%] max-w-[420px]',
      md: 'w-[85%] max-w-[480px]',
      lg: 'w-[90%] max-w-[540px]',
      full: 'w-full',
    },
  },
});

const alertDialogCloseButtonStyle = tva({
  base: 'group/alert-dialog-close-button z-10 rounded p-1',
});

const alertDialogHeaderStyle = tva({
  base: 'justify-between items-center flex-row pb-2',
});

const alertDialogFooterStyle = tva({
  base: 'flex-row justify-end items-center gap-3 pt-4',
});

const alertDialogBodyStyle = tva({
  base: 'py-2',
});

type IAlertDialogProps = React.ComponentProps<typeof UIAlertDialogRoot> &
  VariantProps<typeof alertDialogStyle> & { className?: string };

type IAlertDialogContentProps = React.ComponentProps<
  typeof UIAlertDialogContent
> &
  VariantProps<typeof alertDialogContentStyle> & { className?: string };

type IAlertDialogCloseButtonProps = React.ComponentProps<
  typeof UIAlertDialogCloseButton
> &
  VariantProps<typeof alertDialogCloseButtonStyle> & { className?: string };

type IAlertDialogHeaderProps = React.ComponentProps<
  typeof UIAlertDialogHeader
> &
  VariantProps<typeof alertDialogHeaderStyle> & { className?: string };

type IAlertDialogFooterProps = React.ComponentProps<
  typeof UIAlertDialogFooter
> &
  VariantProps<typeof alertDialogFooterStyle> & { className?: string };

type IAlertDialogBodyProps = React.ComponentProps<typeof UIAlertDialogBody> &
  VariantProps<typeof alertDialogBodyStyle> & { className?: string };

const AlertDialog = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogRoot>,
  IAlertDialogProps
>(({ className, size = 'md', ...props }, ref) => {
  return (
    <UIAlertDialogRoot
      ref={ref}
      {...props}
      className={alertDialogStyle({ size, class: className })}
      context={{ size }}
    />
  );
});

const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogContent>,
  IAlertDialogContentProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIAlertDialogContent
      ref={ref}
      entering={ZoomIn.duration(180).easing(Easing.out(Easing.cubic))}
      exiting={ZoomOut.duration(150)}
      {...props}
      className={alertDialogContentStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
      pointerEvents="auto"
    />
  );
});

const AlertDialogCloseButton = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogCloseButton>,
  IAlertDialogCloseButtonProps
>(({ className, ...props }, ref) => {
  return (
    <UIAlertDialogCloseButton
      ref={ref}
      {...props}
      className={alertDialogCloseButtonStyle({
        class: className,
      })}
    />
  );
});

const AlertDialogHeader = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogHeader>,
  IAlertDialogHeaderProps
>(({ className, ...props }, ref) => {
  return (
    <UIAlertDialogHeader
      ref={ref}
      {...props}
      className={alertDialogHeaderStyle({
        class: className,
      })}
    />
  );
});

const AlertDialogFooter = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogFooter>,
  IAlertDialogFooterProps
>(({ className, ...props }, ref) => {
  return (
    <UIAlertDialogFooter
      ref={ref}
      {...props}
      className={alertDialogFooterStyle({
        class: className,
      })}
    />
  );
});

const AlertDialogBody = React.forwardRef<
  React.ComponentRef<typeof UIAlertDialogBody>,
  IAlertDialogBodyProps
>(({ className, ...props }, ref) => {
  return (
    <UIAlertDialogBody
      ref={ref}
      {...props}
      className={alertDialogBodyStyle({
        class: className,
      })}
    />
  );
});

const AlertDialogBackdrop = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  React.ComponentProps<typeof Pressable> & { className?: string }
>(({ className, style, ...props }, ref) => {
  const { closeOnOverlayClick, handleClose } =
    React.useContext(AlertDialogContext);

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(100)}
      className={alertDialogBackdropStyle({ class: className })}
      style={[
        StyleSheet.absoluteFill,
        style as any,
      ]}
    >
      <Pressable
        ref={ref}
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
});

AlertDialog.displayName = 'AlertDialog';
AlertDialogContent.displayName = 'AlertDialogContent';
AlertDialogCloseButton.displayName = 'AlertDialogCloseButton';
AlertDialogHeader.displayName = 'AlertDialogHeader';
AlertDialogFooter.displayName = 'AlertDialogFooter';
AlertDialogBody.displayName = 'AlertDialogBody';
AlertDialogBackdrop.displayName = 'AlertDialogBackdrop';

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCloseButton,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
};
