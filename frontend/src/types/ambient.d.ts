/*
  Ambient declarations for third-party packages that may lack bundled
  TypeScript typings in certain editor / lint configurations.
  These are intentionally minimal – if the real package already ships
  its own .d.ts file the compiler will prefer those. Otherwise these
  stubs prevent “Cannot find module …” type errors.
*/

declare module "sonner" {
  import * as React from "react";

  /** Toast function */
  export interface ToastFn {
    (message: string, options?: Record<string, unknown>): void;
    success(message: string, options?: Record<string, unknown>): void;
    error(message: string, options?: Record<string, unknown>): void;
    info(message: string, options?: Record<string, unknown>): void;
    warning(message: string, options?: Record<string, unknown>): void;
  }

  /** The exported toast instance */
  export const toast: ToastFn;

  /** Toaster component props */
  export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
    theme?: string;
  }

  /** Main Toaster component */
  export const Toaster: React.FC<ToasterProps>;
}

/*
  lucide-react already ships its own type definitions.  The following
  stub is guarded with `export {}` to avoid duplicate-identifier clashes
  in environments where the real types are present, while still
  satisfying editors that can’t resolve them.
*/

declare module "lucide-react" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  import * as React from "react";
  export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;
  // Common icons used in this project – extend if you add more.
  export const User: LucideIcon;
  export const LogOut: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  const all: Record<string, LucideIcon>;
  export default all;
}

declare module "next-themes" {
  import * as React from "react";
  export interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    children?: React.ReactNode;
  }
  export const ThemeProvider: React.FC<ThemeProviderProps>;
  export const useTheme: () => { theme?: string; setTheme: (theme: string) => void };
}