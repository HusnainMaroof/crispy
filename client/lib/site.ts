/** Public origin of the storefront. Canonicals, the sitemap and robots.txt all build on it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://crispiesuk.com").replace(/\/$/, "");

export const SITE_NAME = "Crispies";

export const DEFAULT_TITLE = "Crispies | Halal Burgers and Chicken in London";

export const DEFAULT_DESCRIPTION =
  "Halal smash burgers and crispy fried chicken in London. Order delivery or click and collect from your nearest Crispies branch.";

const OG_IMAGE = { url: "/images/og-logo.png", width: 1200, height: 630, alt: SITE_NAME };

type PageMeta = {
  /** Page title without the brand. The root template adds " | Crispies". Omit for the homepage. */
  title?: string;
  description: string;
  /** Path from the site root, used for the canonical URL and og:url. */
  path: string;
  /** Pages with private or per-visitor content, such as checkout and order history. */
  noindex?: boolean;
};

/**
 * Title, description, canonical, Open Graph and Twitter tags for one page.
 * A page must set all of them: Next copies the parent's openGraph block whole
 * when a child leaves it out, so every page would share the homepage card.
 */
export function pageMetadata({ title, description, path, noindex }: PageMeta) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  return {
    ...(title ? { title } : { title: { absolute: DEFAULT_TITLE } }),
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      locale: "en_GB",
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
