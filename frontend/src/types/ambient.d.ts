declare module "sonner" {
  import * as React from "react";
  export interface ToasterProps {
    theme?: string;
    [key: string]: any;
  }
  export const Toaster: React.FC<ToasterProps>;
  export const toast: {
    success(message: string): void;
    error(message: string): void;
    info(message: string): void;
    warning(message: string): void;
  };
}

declare module "lucide-react" {
  import * as React from "react";
  export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;
  export const LogOut: LucideIcon;
  export const User: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Settings: LucideIcon;
  const icons: { [key: string]: LucideIcon };
  export default icons;
}