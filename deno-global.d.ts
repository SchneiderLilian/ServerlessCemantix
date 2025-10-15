// Minimal global declaration for the Deno runtime used only to silence editor errors.
// Keep this file if you don't want to install Deno or the VS Code Deno extension.

export { };

declare global {
  const Deno: {
    serve(handler: (req: Request) => Promise<Response> | Response): void;
    // add other Deno members you need as optional properties here
  };
}

