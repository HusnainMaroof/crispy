import type { StoreLocationCard } from "@/lib/storefront-locations";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const CUISINE = ["Halal", "Burgers", "Fried Chicken"];

function JsonLd({ data }: { data: unknown }) {
  // "<" is escaped so a value can never close the script tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** One Restaurant per branch, built only from the branch rows in the database. */
function restaurant(branch: StoreLocationCard) {
  return {
    "@type": "Restaurant",
    name: `${SITE_NAME} ${branch.name}`,
    url: `${SITE_URL}/locations`,
    image: `${SITE_URL}/images/og-logo.png`,
    servesCuisine: CUISINE,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      ...(branch.postcode ? { postalCode: branch.postcode } : {}),
      addressLocality: "London",
      addressCountry: "GB",
    },
    ...(branch.lat !== null && branch.lng !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: branch.lat, longitude: branch.lng } }
      : {}),
    ...(branch.phone ? { telephone: branch.phone } : {}),
  };
}

/** Brand and website schema for the homepage. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            sameAs: ["https://www.instagram.com/crispiesuk"],
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
        ],
      }}
    />
  );
}

/** Breadcrumb trail for an inner page. Home is added first automatically. */
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
        })),
      }}
    />
  );
}

/** schema.org employment types, matched loosely from the free-text job type. */
function employmentType(type: string) {
  const value = type.toLowerCase();
  if (value.includes("full")) return "FULL_TIME";
  if (value.includes("part")) return "PART_TIME";
  if (value.includes("contract")) return "CONTRACTOR";
  if (value.includes("temp")) return "TEMPORARY";
  if (value.includes("intern")) return "INTERN";
  return undefined;
}

/**
 * JobPosting for one open role. The salary is free text in the admin panel, so
 * it stays in the description rather than being guessed into baseSalary.
 */
export function JobPostingJsonLd({
  job,
  branch,
}: {
  job: { id: string; title: string; description: string; type: string; created_at: string; location: string };
  branch?: StoreLocationCard;
}) {
  const type = employmentType(job.type);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.description || `${job.title} at ${SITE_NAME} ${job.location}.`,
        ...(job.created_at ? { datePosted: job.created_at.slice(0, 10) } : {}),
        ...(type ? { employmentType: type } : {}),
        url: `${SITE_URL}/career/${job.id}`,
        hiringOrganization: { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL, logo: `${SITE_URL}/icon.png` },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            ...(branch?.address ? { streetAddress: branch.address } : {}),
            ...(branch?.postcode ? { postalCode: branch.postcode } : {}),
            addressLocality: "London",
            addressCountry: "GB",
          },
        },
      }}
    />
  );
}

/** Restaurant schema for every branch that is open. Renders nothing when there are none. */
export function RestaurantsJsonLd({ branches }: { branches: StoreLocationCard[] }) {
  const open = branches.filter((branch) => branch.status === "open" && branch.address.trim());
  if (open.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": open.map((branch) => ({
          ...restaurant(branch),
          brand: { "@type": "Brand", name: SITE_NAME },
        })),
      }}
    />
  );
}
