// Lightweight ambient module declarations to reduce editor TypeScript errors
// Replace with proper @types/* packages or real types when available.

declare module '@neondatabase/serverless';
declare module '@upstash/redis';
declare module '@upstash/redis/redis';
declare module '@jest/globals';
declare module 'pino';
declare module 'ws';

// If you still see errors after installing packages, remove these declarations
// so the real type definitions from @types/* or built-in types take precedence.
