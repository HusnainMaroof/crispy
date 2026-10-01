export type CmsField =
  | { kind: "text"; label: string; max: number; multiline?: boolean; hint?: string; default: string }
  | { kind: "image" | "video"; label: string; hint?: string; default: string }
  | { kind: "link"; label: string; external?: boolean; hint?: string; default: string }
  | { kind: "url"; label: string; hosts?: string[]; hint?: string; default: string }
  | { kind: "number"; label: string; min: number; max: number; hint?: string; default: number }
  | { kind: "select"; label: string; options: { value: string; label: string }[]; hint?: string; default: string }
  | { kind: "toggle"; label: string; hint?: string; default: boolean }
  | { kind: "branches"; label: string; max: number; hint?: string; default: string[] }
  | { kind: "list"; label: string; max: number; item: CmsListItem; hint?: string; default: unknown[] };

export type CmsListItem = Exclude<CmsField, { kind: "list" } | { kind: "branches" }> | { kind: "object"; label: string; fields: Record<string, CmsField> };

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
        label: "Order system",
        hint: "Cart system shows Your Cart and Get It Delivered, both open the cart, and /checkout stays live. Redirect system shows Click & Collect and Get It Delivered, both open the branch and platform popup, and the cart and /checkout are switched off.",
        fields: {
          mode: {
            kind: "select",
            label: "System",
            options: [
              { value: "cart", label: "Cart system" },
              { value: "redirect", label: "Redirect system" },
            ],
            hint: "This one switch controls the whole store, including the navbar buttons.",
            default: "redirect",
          },
          redirectUrl: { kind: "url", label: "External order URL", hint: "Fallback destination for redirect mode, used when a platform link is empty. Must start with https://", default: "" },
          uberEatsUrl: { kind: "url", label: "Uber Eats link", hint: "Where the customer goes after picking Uber Eats in the Click & Collect popup. Must start with https://", default: "" },
          deliverooUrl: { kind: "url", label: "Deliveroo link", hint: "Where the customer goes after picking Deliveroo in the Click & Collect popup. Must start with https://", default: "" },
          justEatUrl: { kind: "url", label: "Just Eat link", hint: "Where the customer goes after picking Just Eat in the Click & Collect popup. Must start with https://", default: "" },
          ctaLabel: text("Order button label", 80, "Order Now"),
        },
      },
    ],
  },
  {
    id: "navbar",
    label: "Navbar",
    detail: "Logo and order buttons. The navigation links are fixed in the storefront code and are not editable here.",
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
    ],
  },
  {
    id: "home",
    label: "Homepage",
    detail: "Hero and welcome stay at the top. Reorder the other sections, and edit only what each section shows.",
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
        hint: "Paragraph and the two photos in the welcome panel. The headline is fixed and cannot be edited here.",
        pinned: true,
        fields: {
          description: text("Paragraph", 2000, "Crispies was founded with a mission to serve the best burgers & chicken around. Our aim has always been to serve fresh, handmade food, bursting with flavours from around the globe.", { multiline: true }),
          backImage: { kind: "image", label: "Back photo", hint: "The straight photo behind the tilted one.", default: "/images/welcomeSectionimageOne.jpg.avif" },
          frontImage: { kind: "image", label: "Front photo", hint: "The tilted photo that slides in over the back photo.", default: "/images/welcomeSectionimageTwo.jpg.avif" },
        },
      },
      {
        key: "flavours",
        label: "Discover your flavor",
        hint: "Headings, flavour names, heat scale, scrolling photos, and the order button.",
        fields: {
          title: text("Original flavours label", 120, "Crispies Original Flavours"),
          discoverTitle: text("Main heading", 120, "Discover Your Crispy Flavor"),
          tiles: {
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
          ctaLabel: text("Button label", 80, "Order On The Website"),
          ctaUrl: { kind: "link", label: "Button destination", external: true, default: "/menu" },
          centerImage: { kind: "image", label: "Center image", hint: "The photo on the white card in the middle of the carousel.", default: "/images/orderOnimage.png" },
          galleryImages: {
            kind: "list",
            label: "Carousel",
            max: 12,
            hint: "These photos scroll behind the center card. Use at least two.",
            item: { kind: "image", label: "Slide", default: "" },
            default: ["/images/aboutimage.jpg", "/images/aboutimage.jpg", "/images/aboutimage.jpg", "/images/aboutimage.jpg"],
          },
        },
      },
      {
        key: "locations",
        label: "Locations",
        hint: "Pick which branches appear, and the order they appear in. Names, hours, and addresses come from Locations.",
        fields: {
          title: text("Heading", 120, "Find Your Nearest Crispies"),
          locationIds: { kind: "branches", label: "Branches", max: 12, hint: "Leave this empty to show every branch. Otherwise only the ticked branches appear, in this order.", default: [] },
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
        hint: "Profile, numbers, and the reels in the row.",
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
