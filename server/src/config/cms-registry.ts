export type CmsField =
  | { kind: "text"; label: string; max: number; multiline?: boolean; hint?: string; default: string }
  | { kind: "image" | "video"; label: string; hint?: string; default: string }
  | { kind: "link"; label: string; external?: boolean; hint?: string; default: string }
  | { kind: "url"; label: string; hosts?: string[]; hint?: string; default: string }
  | { kind: "number"; label: string; min: number; max: number; hint?: string; default: number }
  | { kind: "select"; label: string; options: { value: string; label: string }[]; hint?: string; default: string }
  | { kind: "toggle"; label: string; hint?: string; default: boolean }
  | { kind: "list"; label: string; max: number; item: CmsListItem; hint?: string; default: unknown[] };

export type CmsListItem = Exclude<CmsField, { kind: "list" }> | { kind: "object"; label: string; fields: Record<string, CmsField> };

export type CmsIssue = { path: string[]; message: string };

export type CmsSection = {
  key: string;
  label: string;
  hint: string;
  pinned?: boolean;
  fields: Record<string, CmsField>;
  check?: (content: Record<string, unknown>) => CmsIssue | null;
};

export type CmsPage = {
  id: string;
  label: string;
  detail: string;
  path: string | null;
  sortable: boolean;
  sections: CmsSection[];
};

export const CMS_PAGE_IDS = ["site", "navbar", "footer", "home", "menu", "franchise", "locations", "delivery", "checkout", "orders"] as const;
export type CmsPageId = (typeof CMS_PAGE_IDS)[number];

const INSTAGRAM_HOSTS = ["instagram.com"];

const text = (label: string, max: number, value: string, extra: { multiline?: boolean; hint?: string } = {}): Extract<CmsField, { kind: "text" }> =>
  ({ kind: "text", label, max, default: value, ...extra });

export const CMS_PAGES: CmsPage[] = [
  {
    id: "site",
    label: "Site settings",
    detail: "Settings shared by every storefront page.",
    path: null,
    sortable: false,
    sections: [
      {
        key: "ordering",
        label: "Store ordering behavior",
        hint: "Use the on-site cart and delivery flow, or send every order button to an external ordering site.",
        fields: {
          mode: {
            kind: "select",
            label: "Ordering mode",
            options: [
              { value: "cart", label: "On-site cart and delivery flow" },
              { value: "redirect", label: "Redirect to an external ordering URL" },
            ],
            default: "cart",
          },
          redirectUrl: { kind: "url", label: "External order URL", hint: "Required for redirect mode. Must start with https://", default: "" },
          ctaLabel: text("Order button label", 80, "Order Now"),
        },
        check: (content) => content.mode === "redirect" && !String(content.redirectUrl ?? "").startsWith("https://")
          ? { path: ["redirectUrl"], message: "Add a secure external ordering URL before enabling redirect mode" }
          : null,
      },
    ],
  },
  {
    id: "navbar",
    label: "Navbar",
    detail: "Logo, navigation links, order buttons, language switch, and the social icons in the header.",
    path: "/",
    sortable: false,
    sections: [
      {
        key: "logo",
        label: "Logo",
        hint: "Leave the image empty to keep the built-in Crispies wordmark.",
        fields: {
          imageUrl: { kind: "image", label: "Logo image", default: "" },
          alt: text("Alt text", 80, "Crispies home"),
        },
      },
      {
        key: "navigation",
        label: "Navigation",
        hint: "Links shown in the header and the mobile menu. Keep this short so the bar still fits.",
        fields: {
          links: {
            kind: "list",
            label: "Links",
            max: 6,
            item: {
              kind: "object",
              label: "Link",
              fields: {
                label: text("Label", 40, ""),
                href: { kind: "link", label: "Page", default: "/menu" },
              },
            },
            default: [
              { label: "Menu", href: "/menu" },
              { label: "Locations", href: "/locations" },
              { label: "Franchise inquiry", href: "/franchise-inquiries" },
            ],
          },
          showLanguage: { kind: "toggle", label: "Show the language switch", default: true },
          cartLabel: text("Cart button label", 40, "Cart"),
          menuLabel: text("Mobile menu button", 40, "Menu"),
          closeLabel: text("Mobile close button", 40, "Close"),
        },
      },
      {
        key: "actions",
        label: "Order buttons",
        hint: "The Click & Collect and Get It Delivered pills. Icons are the built-in bag and bike.",
        fields: {
          showCollect: { kind: "toggle", label: "Show Click & Collect", default: true },
          collectLine1: text("Collect, first line", 24, "Click"),
          collectLine2: text("Collect, second line", 24, "& Collect"),
          collectIcon: {
            kind: "select",
            label: "Collect icon",
            options: [
              { value: "bag", label: "Bag" },
              { value: "bike", label: "Bike" },
              { value: "none", label: "No icon" },
            ],
            default: "bag",
          },
          showDeliver: { kind: "toggle", label: "Show Get It Delivered", default: true },
          deliverLine1: text("Deliver, first line", 24, "Get It"),
          deliverLine2: text("Deliver, second line", 24, "Delivered"),
          deliverIcon: {
            kind: "select",
            label: "Deliver icon",
            options: [
              { value: "bag", label: "Bag" },
              { value: "bike", label: "Bike" },
              { value: "none", label: "No icon" },
            ],
            default: "bike",
          },
        },
      },
      {
        key: "socials",
        label: "Social icons",
        hint: "The icon column on desktop and the row in the mobile menu.",
        fields: {
          show: { kind: "toggle", label: "Show social icons", default: true },
          links: {
            kind: "list",
            label: "Accounts",
            max: 5,
            item: {
              kind: "object",
              label: "Account",
              fields: {
                platform: {
                  kind: "select",
                  label: "Icon",
                  options: [
                    { value: "instagram", label: "Instagram" },
                    { value: "facebook", label: "Facebook" },
                    { value: "x", label: "X" },
                  ],
                  default: "instagram",
                },
                label: text("Accessible label", 40, ""),
                url: { kind: "url", label: "Profile URL", default: "" },
              },
            },
            default: [
              { platform: "instagram", label: "Instagram", url: "https://instagram.com" },
              { platform: "facebook", label: "Facebook", url: "https://facebook.com" },
              { platform: "x", label: "X", url: "https://twitter.com" },
            ],
          },
        },
      },
    ],
  },
  {
    id: "home",
    label: "Homepage",
    detail: "Manage each homepage section. Hero and welcome always open the page; the rest can be reordered.",
    path: "/",
    sortable: true,
    sections: [
      {
        key: "hero",
        label: "Hero",
        hint: "Headline and background video shown at the top of the homepage.",
        pinned: true,
        fields: {
          lines: { kind: "list", label: "Headline lines", max: 3, item: text("Line", 60, ""), default: ["Always Good", "Mood Food"] },
          videoUrl: { kind: "video", label: "Background video", hint: "MP4, WebM or MOV, up to 50 MB. Plays muted.", default: "/images/herobgvideo.mp4" },
        },
      },
      {
        key: "welcome",
        label: "Welcome",
        hint: "The welcome paragraph beside the homepage images.",
        pinned: true,
        fields: {
          description: text("Paragraph", 2000, "Crispies was founded with a mission to serve the best burgers & chicken around. Our aim has always been to serve fresh, handmade food, bursting with flavours from around the globe.", { multiline: true }),
        },
      },
      {
        key: "flavours",
        label: "Discover your flavor",
        hint: "Section heading, flavour tiles, heat scale, gallery, and order button.",
        fields: {
          title: text("Original flavours label", 120, "Crispies Original Flavours"),
          discoverTitle: text("Main heading", 120, "Discover Your Crispy Flavor"),
          flavours: {
            kind: "list",
            label: "Flavour tiles",
            max: 5,
            item: { kind: "object", label: "Flavour", fields: { label: text("Name", 60, ""), image: { kind: "image", label: "Tile artwork", default: "" } } },
            default: ["Zesty Lemon", "Korean BBQ", "Smokey BBQ", "Hawaiian Sweet Chilli", "Fiery Buffalo"].map((label) => ({ label, image: "" })),
          },
          scaleTitle: text("Heat scale heading", 120, "Flaming Grill Flavour"),
          scale: {
            kind: "list",
            label: "Heat scale",
            max: 6,
            item: { kind: "object", label: "Heat level", fields: { label: text("Name", 60, ""), image: { kind: "image", label: "Icon artwork", default: "" } } },
            default: ["Garlic", "Lemon", "Mild", "Hot", "Extra", "BBQ & Jerk Sauce"].map((label) => ({ label, image: "" })),
          },
          galleryImages: { kind: "list", label: "Gallery images", max: 12, item: { kind: "image", label: "Image", default: "" }, default: [] },
          ctaLabel: text("Button label", 80, "Order On The Website"),
          ctaUrl: { kind: "link", label: "Button destination", external: true, default: "/menu" },
        },
      },
      {
        key: "locations",
        label: "Locations",
        hint: "Show live branch cards or a single button to the locations page. Branch details come from the Locations manager.",
        fields: {
          title: text("Heading", 120, "Find Your Nearest Crispies"),
          displayMode: {
            kind: "select",
            label: "Display mode",
            options: [
              { value: "cards", label: "Show branch cards" },
              { value: "redirect", label: "Show button and redirect" },
            ],
            default: "cards",
          },
          cardLimit: { kind: "number", label: "Maximum cards", min: 1, max: 10, default: 5 },
          ctaLabel: text("Button label", 80, "View All Locations"),
          ctaUrl: { kind: "link", label: "Button destination", default: "/locations" },
        },
      },
      {
        key: "partner",
        label: "Partner",
        hint: "The franchise block on the homepage.",
        fields: {
          title: text("Headline", 200, "Bring Crispies\nto your city.", { multiline: true, hint: "One line per row." }),
          description: text("Supporting line", 500, "Join London's fastest-growing halal restaurant brand."),
          ctaLabel: text("Button label", 80, "Become A Partner"),
          ctaUrl: { kind: "link", label: "Button destination", default: "/franchise-inquiries" },
          imageUrl: { kind: "image", label: "Image", default: "" },
        },
      },
      {
        key: "instagram",
        label: "Instagram",
        hint: "Profile metrics, bio, reels, thumbnails, likes, and views.",
        fields: {
          title: text("Section heading", 120, "Instagram"),
          username: text("Username", 50, "crispiesuk"),
          profileUrl: { kind: "url", label: "Profile URL", hosts: INSTAGRAM_HOSTS, default: "https://www.instagram.com/crispiesuk" },
          posts: text("Posts", 40, "557"),
          followers: text("Followers", 40, "16.1k"),
          following: text("Following", 40, "19"),
          bio: text("Profile bio", 500, "Good Mood Food 🍔🍟"),
          followLabel: text("Follow button label", 40, "Follow"),
          reels: {
            kind: "list",
            label: "Reels",
            max: 12,
            item: {
              kind: "object",
              label: "Reel",
              fields: {
                url: { kind: "url", label: "Instagram reel URL", hosts: INSTAGRAM_HOSTS, default: "" },
                thumbnailUrl: { kind: "image", label: "Thumbnail", default: "" },
                likes: text("Likes", 40, ""),
                views: text("Views", 40, ""),
              },
            },
            default: [],
          },
        },
      },
    ],
  },
];

export function findCmsPage(id: string) {
  return CMS_PAGES.find((page) => page.id === id) ?? null;
}

export function findCmsSection(pageId: string, key: string) {
  return findCmsPage(pageId)?.sections.find((section) => section.key === key) ?? null;
}

export function sectionDefaults(section: CmsSection): Record<string, unknown> {
  return Object.fromEntries(Object.entries(section.fields).map(([name, field]) => [name, structuredClone(field.default)]));
}

export function publicDefinition(page: CmsPage) {
  return {
    id: page.id,
    label: page.label,
    detail: page.detail,
    path: page.path,
    sortable: page.sortable,
  };
}

export function sectionDefinition(section: CmsSection) {
  return { label: section.label, hint: section.hint, pinned: Boolean(section.pinned), fields: section.fields };
}
