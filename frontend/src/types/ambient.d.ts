declare module "sonner" {
  import * as React from "react";
  export const toast: {
    (message: string, options?: Record<string, unknown>): void;
    success(message: string, options?: Record<string, unknown>): void;
    error(message: string, options?: Record<string, unknown>): void;
    info(message: string, options?: Record<string, unknown>): void;
    warning(message: string, options?: Record<string, unknown>): void;
  };

  export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
    theme?: string;
  }

  export const Toaster: React.FC<ToasterProps>;
}

declare module "lucide-react" {
  import * as React from "react";
  export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;
  /* Common icons we use */
  export const User: LucideIcon;
  export const LogOut: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Settings: LucideIcon;
  /* Fallback for any other icon */
  const icons: Record<string, LucideIcon>;
  export default icons;
}