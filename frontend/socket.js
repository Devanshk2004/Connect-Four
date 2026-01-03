"use client";

import { io } from "socket.io-client";

// In dev, assuming backend is on port 4000. 
// In prod, this would need env var or relative path if proxied.
const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const socket = io(URL, {
    autoConnect: false
});
