import React from 'react';
import { Button as BaseButton } from '../ui/button';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ variant = "default", size = "default", ...props }, ref) => {
    return <BaseButton ref={ref} {...props as any} variant={variant as any} size={size as any} />;
  }
);

Button.displayName = "Button";
