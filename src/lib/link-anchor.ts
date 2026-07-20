// Utilities to build & parse popup/CTA links that target a category or product
// on the /commander page, independently of the restaurant.

export const slugify = (input: string): string =>
  (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type AnchorTarget =
  | { type: "category"; slug: string }
  | { type: "product"; slug: string }
  | null;

export const buildCategoryLink = (name: string) =>
  `/commander#cat=${slugify(name)}`;

export const buildProductLink = (name: string) =>
  `/commander#prod=${slugify(name)}`;

export const parseAnchorFromHash = (hash: string): AnchorTarget => {
  if (!hash) return null;
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const [key, ...rest] = clean.split("=");
  const value = rest.join("=");
  if (!value) return null;
  if (key === "cat") return { type: "category", slug: value };
  if (key === "prod") return { type: "product", slug: value };
  return null;
};

// From a stored button_link value, detect if it points to a category/product.
export const parseAnchorFromLink = (link: string): AnchorTarget => {
  if (!link) return null;
  const hashIdx = link.indexOf("#");
  if (hashIdx === -1) return null;
  return parseAnchorFromHash(link.slice(hashIdx));
};
