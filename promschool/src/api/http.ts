import axios from "axios";

const pick = (...vals: (string | undefined)[]) => vals.find(Boolean) || "";
const RAW_BASE = pick(
  process.env.REACT_APP_API_BASE,       
  process.env.REACT_APP_API_BASE_URL,   
  process.env.NEXT_PUBLIC_API_BASE,     
  process.env.VITE_API_BASE_URL
).replace(/\/$/, "");                   

export const http = axios.create({
  baseURL: RAW_BASE || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});
