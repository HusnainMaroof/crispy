/** Development catalogue used by seed:catalogue and tests. Not loaded in production. */

const IMG = {
  box: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=600",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600",
  wings: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600",
  grill: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600",
  platter: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600",
  kids: "https://images.unsplash.com/photo-1509042239860-f550ce740f57?auto=format&fit=crop&q=80&w=800&h=600",
  sides: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800&h=600",
  dessert: "https://images.unsplash.com/photo-1606313564200-e1d346c0d0a1?auto=format&fit=crop&q=80&w=800&h=600",
  drink: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800&h=600",
} as const;

export const MOCK_BRANCH_SLUGS = [
  "harrow-road",
  "tower-hill",
  "kilburn",
  "harrow",
  "elephant-and-castle",
  "edgware-road",
  "stockwell",
  "wembley-central",
  "ruislip",
] as const;

export const mockCategories = [
  { id: "mock-cat-box", number: "01", title: "Box Meals", image: IMG.box, sort_order: 0 },
  { id: "mock-cat-gourmet", number: "02", title: "Gourmet Burgers", image: IMG.burger, sort_order: 1 },
  { id: "mock-cat-wraps", number: "03", title: "Wraps", image: IMG.wrap, sort_order: 2 },
  { id: "mock-cat-wings", number: "04", title: "Wings", image: IMG.wings, sort_order: 3 },
  { id: "mock-cat-grill", number: "05", title: "Grill", image: IMG.grill, sort_order: 4 },
  { id: "mock-cat-platters", number: "06", title: "Platters", image: IMG.platter, sort_order: 5 },
  { id: "mock-cat-kids", number: "07", title: "Kids", image: IMG.kids, sort_order: 6 },
  { id: "mock-cat-sides", number: "08", title: "Sides", image: IMG.sides, sort_order: 7 },
  { id: "mock-cat-desserts", number: "09", title: "Desserts", image: IMG.dessert, sort_order: 8 },
  { id: "mock-cat-drinks", number: "10", title: "Drinks", image: IMG.drink, sort_order: 9 },
] as const;

type MockItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  sort_order: number;
  badge?: string;
  badge_variant?: string;
};

export const mockItems: MockItem[] = [
  { id: "mock-box-chicken", category_id: "mock-cat-box", name: "Chicken Box", description: "Fried chicken pieces with fries and a dipping sauce.", price: 10.5, image: IMG.box, sort_order: 0 },
  { id: "mock-box-crispy", category_id: "mock-cat-box", name: "Crispy Chicken Box", description: "Crispy chicken fillet, fries and coleslaw in one box.", price: 11.5, image: IMG.box, sort_order: 1 },
  { id: "mock-box-wings", category_id: "mock-cat-box", name: "Wings Box", description: "Wings, fries and a sauce, boxed for one.", price: 12.5, image: IMG.wings, sort_order: 2 },
  { id: "mock-box-burger", category_id: "mock-cat-box", name: "Burger Box", description: "A chicken burger with fries and a drink.", price: 11.99, image: IMG.burger, sort_order: 3 },

  { id: "mock-burger-classic", category_id: "mock-cat-gourmet", name: "Classic Beef Burger", description: "Beef-style patty, lettuce, tomato and house sauce.", price: 8.5, image: IMG.burger, sort_order: 0 },
  { id: "mock-burger-crispy", category_id: "mock-cat-gourmet", name: "Crispy Chicken Burger", description: "Crispy chicken fillet, lettuce, house sauce and a toasted bun.", price: 8.99, image: IMG.burger, sort_order: 1 },
  { id: "mock-burger-spicy", category_id: "mock-cat-gourmet", name: "Spicy Chicken Burger", description: "Spiced crispy chicken with lettuce and chilli mayo.", price: 9.5, image: IMG.burger, sort_order: 2 },
  { id: "mock-burger-bbq", category_id: "mock-cat-gourmet", name: "BBQ Chicken Burger", description: "Chicken fillet with smoky BBQ sauce and cheddar.", price: 9.5, image: IMG.burger, sort_order: 3 },
  { id: "mock-burger-double", category_id: "mock-cat-gourmet", name: "Double Beef Burger", description: "Two beef-style patties, cheese and house sauce.", price: 11.5, image: IMG.burger, sort_order: 4 },

  { id: "mock-wrap-crispy", category_id: "mock-cat-wraps", name: "Crispy Chicken Wrap", description: "Crispy chicken, lettuce and sauce in a toasted wrap.", price: 7.5, image: IMG.wrap, sort_order: 0 },
  { id: "mock-wrap-spicy", category_id: "mock-cat-wraps", name: "Spicy Chicken Wrap", description: "Spiced chicken and salad in a soft wrap.", price: 7.99, image: IMG.wrap, sort_order: 1 },
  { id: "mock-wrap-bbq", category_id: "mock-cat-wraps", name: "BBQ Chicken Wrap", description: "Chicken, BBQ sauce and slaw in a wrap.", price: 8.5, image: IMG.wrap, sort_order: 2 },
  { id: "mock-wrap-grilled", category_id: "mock-cat-wraps", name: "Grilled Chicken Wrap", description: "Grilled chicken, lettuce and a light sauce.", price: 8.99, image: IMG.wrap, sort_order: 3 },

  { id: "mock-wings-6", category_id: "mock-cat-wings", name: "6pc Classic Wings", description: "Six wings tossed in a mild house sauce.", price: 5.99, image: IMG.wings, sort_order: 0 },
  { id: "mock-wings-10", category_id: "mock-cat-wings", name: "10pc Classic Wings", description: "Ten classic wings with a dipping sauce.", price: 9.5, image: IMG.wings, sort_order: 1 },
  { id: "mock-wings-6-spicy", category_id: "mock-cat-wings", name: "6pc Spicy Wings", description: "Six wings in a hotter chilli glaze.", price: 6.5, image: IMG.wings, sort_order: 2 },
  { id: "mock-wings-10-spicy", category_id: "mock-cat-wings", name: "10pc Spicy Wings", description: "Ten spicy wings for a bigger portion.", price: 9.99, image: IMG.wings, sort_order: 3 },

  { id: "mock-grill-chicken", category_id: "mock-cat-grill", name: "Grilled Chicken", description: "Chargrilled chicken breast with a side salad.", price: 10.5, image: IMG.grill, sort_order: 0 },
  { id: "mock-grill-steak", category_id: "mock-cat-grill", name: "Chicken Steak", description: "Flattened grilled chicken with peppers and onions.", price: 14.5, image: IMG.grill, sort_order: 1 },
  { id: "mock-grill-strips", category_id: "mock-cat-grill", name: "Grilled Chicken Strips", description: "Strips of grilled chicken with a dip.", price: 9.99, image: IMG.grill, sort_order: 2 },

  { id: "mock-platter-chicken", category_id: "mock-cat-platters", name: "Chicken Platter", description: "A sharing plate of fried and grilled chicken.", price: 16.5, image: IMG.platter, sort_order: 0 },
  { id: "mock-platter-mixed", category_id: "mock-cat-platters", name: "Mixed Grill Platter", description: "Grilled chicken, strips and sides for two.", price: 22, image: IMG.grill, sort_order: 1 },
  { id: "mock-platter-family", category_id: "mock-cat-platters", name: "Family Feast Platter", description: "A large sharing platter of chicken and sides.", price: 28, image: IMG.platter, sort_order: 2 },

  { id: "mock-kids-burger", category_id: "mock-cat-kids", name: "Kids Chicken Burger", description: "A smaller chicken burger with fries.", price: 5.99, image: IMG.kids, sort_order: 0 },
  { id: "mock-kids-nuggets", category_id: "mock-cat-kids", name: "Kids Nuggets", description: "Chicken nuggets with fries and a dip.", price: 5.5, image: IMG.kids, sort_order: 1 },
  { id: "mock-kids-strips", category_id: "mock-cat-kids", name: "Kids Chicken Strips", description: "Chicken strips sized for a smaller appetite.", price: 6.5, image: IMG.kids, sort_order: 2 },

  { id: "mock-side-fries", category_id: "mock-cat-sides", name: "Regular Fries", description: "A regular portion of salted fries.", price: 2.5, image: IMG.sides, sort_order: 0 },
  { id: "mock-side-fries-large", category_id: "mock-cat-sides", name: "Large Fries", description: "A larger portion of salted fries.", price: 3.5, image: IMG.sides, sort_order: 1 },
  { id: "mock-side-loaded", category_id: "mock-cat-sides", name: "Loaded Fries", description: "Fries with cheese sauce and crispy onions.", price: 4.99, image: IMG.sides, sort_order: 2 },
  { id: "mock-side-rings", category_id: "mock-cat-sides", name: "Onion Rings", description: "Crispy onion rings with a dip.", price: 3.99, image: IMG.sides, sort_order: 3 },
  { id: "mock-side-mozz", category_id: "mock-cat-sides", name: "Mozzarella Sticks", description: "Breaded mozzarella sticks with a dip.", price: 4.5, image: IMG.sides, sort_order: 4 },

  { id: "mock-dessert-brownie", category_id: "mock-cat-desserts", name: "Chocolate Brownie", description: "A warm chocolate brownie.", price: 3.99, image: IMG.dessert, sort_order: 0 },
  { id: "mock-dessert-cake", category_id: "mock-cat-desserts", name: "Chocolate Cake", description: "A slice of chocolate sponge cake.", price: 4.5, image: IMG.dessert, sort_order: 1 },
  { id: "mock-dessert-cheesecake", category_id: "mock-cat-desserts", name: "Cheesecake", description: "A slice of baked cheesecake.", price: 4.99, image: IMG.dessert, sort_order: 2 },

  { id: "mock-drink-coke", category_id: "mock-cat-drinks", name: "Coca-Cola", description: "A canned cola.", price: 1.99, image: IMG.drink, sort_order: 0 },
  { id: "mock-drink-pepsi", category_id: "mock-cat-drinks", name: "Pepsi", description: "A canned cola.", price: 1.99, image: IMG.drink, sort_order: 1 },
  { id: "mock-drink-mango", category_id: "mock-cat-drinks", name: "Mango Drink", description: "A chilled mango soft drink.", price: 2.5, image: IMG.drink, sort_order: 2 },
  { id: "mock-drink-water", category_id: "mock-cat-drinks", name: "Still Water", description: "A bottle of still water.", price: 1.5, image: IMG.drink, sort_order: 3 },
];

export const mockDeals = [
  { id: "mock-deal-burger", name: "Burger Meal Deal", description: "A burger, regular fries and a canned drink.", price: 10.99, image: IMG.burger },
  { id: "mock-deal-wings", name: "Family Wings Deal", description: "A large wings portion with two sides.", price: 18.99, image: IMG.wings },
  { id: "mock-deal-box", name: "Chicken Box Deal", description: "A chicken box with a drink.", price: 12.99, image: IMG.box },
  { id: "mock-deal-lunch", name: "Lunch Deal", description: "A wrap, regular fries and a drink.", price: 8.99, image: IMG.wrap },
  { id: "mock-deal-wings-sides", name: "Wings & Sides Deal", description: "Ten wings with large fries.", price: 11.5, image: IMG.wings },
  { id: "mock-deal-weekend", name: "Weekend Meal Deal", description: "Two burgers, two sides and two drinks.", price: 14.99, image: IMG.burger },
];

export type BranchRule = { available?: boolean; price?: number | null };

const off = { available: false as const };
const price = (value: number): BranchRule => ({ price: value });

const WEMBLEY_OFF = [
  "mock-wrap-crispy", "mock-wrap-spicy", "mock-wrap-bbq", "mock-wrap-grilled",
  "mock-grill-chicken", "mock-grill-steak", "mock-grill-strips",
  "mock-platter-chicken", "mock-platter-mixed", "mock-platter-family",
  "mock-dessert-brownie", "mock-dessert-cake", "mock-dessert-cheesecake",
];

const RUISLIP_OFF = [
  "mock-burger-crispy", "mock-burger-spicy", "mock-burger-bbq", "mock-burger-double",
  "mock-grill-chicken", "mock-grill-steak", "mock-grill-strips",
  "mock-platter-chicken", "mock-platter-mixed", "mock-platter-family",
  "mock-dessert-brownie", "mock-dessert-cake", "mock-dessert-cheesecake",
];

export const mockBranchMenuRules: Record<string, Record<string, BranchRule>> = {
  "harrow-road": {
    "mock-burger-crispy": price(9.25),
    "mock-wings-10": price(10.25),
  },
  "tower-hill": {
    "mock-grill-chicken": off,
    "mock-grill-steak": off,
    "mock-grill-strips": off,
    "mock-burger-classic": price(8.99),
    "mock-burger-spicy": off,
  },
  kilburn: {
    "mock-wings-10-spicy": off,
    "mock-wings-6-spicy": off,
    "mock-side-fries-large": price(4.25),
  },
  harrow: {
    "mock-platter-mixed": off,
    "mock-box-burger": off,
  },
  "elephant-and-castle": {
    "mock-platter-family": off,
    "mock-burger-double": off,
  },
  "edgware-road": {
    "mock-box-chicken": price(11.5),
    "mock-wrap-crispy": price(7.75),
  },
  stockwell: {
    "mock-side-fries": off,
    "mock-side-rings": off,
    "mock-wings-6": off,
    "mock-side-loaded": price(5.49),
  },
  "wembley-central": {
    ...Object.fromEntries(WEMBLEY_OFF.map((id) => [id, off])),
    "mock-burger-classic": price(7.99),
  },
  ruislip: {
    ...Object.fromEntries(RUISLIP_OFF.map((id) => [id, off])),
    "mock-kids-nuggets": price(4.99),
  },
};

export const mockBranchDealRules: Record<string, Record<string, BranchRule>> = {
  "harrow-road": { "mock-deal-burger": price(11.49) },
  "elephant-and-castle": { "mock-deal-wings": off, "mock-deal-weekend": off },
  stockwell: { "mock-deal-wings": off },
};
