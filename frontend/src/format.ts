export const IMAGES = [
  { src: "https://images.unsplash.com/photo-1765670047380-f930013e5940?auto=format&fit=crop&w=1400&q=85", alt: "Crowd gathered at an illuminated quay in the city" },
  { src: "https://images.unsplash.com/photo-1722355005120-35d0443dfe59?auto=format&fit=crop&w=1400&q=85", alt: "People gathered for a creative activity" },
  { src: "https://images.unsplash.com/photo-1789518076181-0d46f66b86af?auto=format&fit=crop&w=1400&q=85", alt: "People in a square in front of colourful historic houses" },
  { src: "https://images.unsplash.com/photo-1762571923739-da4b681267ad?auto=format&fit=crop&w=1400&q=85", alt: "People gathered in a square near a brick building" },
];

export function imageFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return IMAGES[hash % IMAGES.length]!;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }).replace(".", "").slice(0, 3).toUpperCase(),
    long: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}
