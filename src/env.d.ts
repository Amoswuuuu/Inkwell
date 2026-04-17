/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.yml' {
  const value: Record<string, any>;
  export default value;
}

declare module '*.yaml' {
  const value: Record<string, any>;
  export default value;
}
