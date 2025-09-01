import * as React from "react";
import { Switch as ShadcnSwitch } from "@radix-ui/react-switch";
import clsx from "clsx";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof ShadcnSwitch> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => (
    <ShadcnSwitch
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...props}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5 bg-blue-600" : "translate-x-1 bg-gray-300"
        )}
      />
    </ShadcnSwitch>
  )
);
Switch.displayName = "Switch";

export default Switch;
