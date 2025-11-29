const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:")) return url;
  return `${API_BASE_URL.replace("/api", "")}${url}`;
};
