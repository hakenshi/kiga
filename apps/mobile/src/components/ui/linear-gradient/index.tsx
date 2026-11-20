'use client';
import { tva } from '@gluestack-ui/utils';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import React from 'react';

const StyledExpoLinearGradient = styled(ExpoLinearGradient, { className: 'style' });

const linearGradientStyle = tva({
  base: '',
});

const LinearGradient = React.forwardRef(
  ({ className, ...props }: any, ref?: any) => {
    return (
      <StyledExpoLinearGradient
        {...props}
        className={linearGradientStyle({ class: className })}
        ref={ref}
      />
    );
  }
);

export default () => <LinearGradient />;
