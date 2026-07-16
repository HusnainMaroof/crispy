"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
};

export type MenuCategoryType = {
  id: string;
  number: string;
  title: string;
  image: string;
  items: MenuItemType[];
};

export type TabId = "full-menu" | "deals";

const IMG = {
  wings: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600",
  tenders:
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600",
  grill: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600",
  platter:
    "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600",
  box: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=600",
  gourmet:
    "https://images.unsplash.com/photo-1550317135-9ba9fbc88e54?auto=format&fit=crop&q=80&w=800&h=600",
  kids: "https://images.unsplash.com/photo-1509042239860-f550ce740f57?auto=format&fit=crop&q=80&w=800&h=600",
  sides: "https://images.unsplash.com/photo-1639024471283-035a8a9c4c35?auto=format&fit=crop&q=80&w=800&h=600",
  dessert:
    "https://images.unsplash.com/photo-1606313564200-e1d346c0d0a1?auto=format&fit=crop&q=80&w=800&h=600",
};

const initialMenuCategories: MenuCategoryType[] = [
  {
    id: "wings",
    number: "01",
    title: "Crispies Style Wings",
    image: IMG.wings,
    items: [
      { id: "wings-5", name: "5 Wings", description: "Five crispy golden wings tossed in your choice of house sauce.", price: "£5.99", priceValue: 5.99, image: IMG.wings },
      { id: "wings-7", name: "7 Wings", description: "Seven wings, more crunch, more flavour — pick your heat level.", price: "£7.99", priceValue: 7.99, image: IMG.wings },
      { id: "wings-10", name: "10 Wings", description: "The full ten — perfect for sharing or going solo on a big day.", price: "£10.99", priceValue: 10.99, image: IMG.wings },
    ],
  },
  {
    id: "tenders",
    number: "02",
    title: "Chicken Tenders",
    image: IMG.tenders,
    items: [
      { id: "tenders-3", name: "Trio-Tastic", description: "Three juicy hand-breaded tenders, crisp outside, tender all the way through.", price: "£5.49", priceValue: 5.49, image: IMG.tenders, badge: "3 Tenders" },
      { id: "tenders-5", name: "Five Easy Pieces", description: "Five golden tenders served with your choice of dipping sauce.", price: "£7.99", priceValue: 7.99, image: IMG.tenders, badge: "5 Tenders" },
      { id: "tenders-10", name: "Ten Steps to Heaven", description: "Ten tenders — the real deal. Share if you must.", price: "£12.99", priceValue: 12.99, image: IMG.tenders, badge: "10 Tenders" },
    ],
  },
  {
    id: "burgers",
    number: "03",
    title: "Big Flavour Burgers",
    image: IMG.burger,
    items: [
      { id: "burger-classic", name: "Classic Crispies Burger", description: "Our OG crispy chicken burger — house slaw, pickles, signature mayo on a toasted brioche bun.", price: "£7.99", priceValue: 7.99, image: IMG.burger },
      { id: "burger-plant", name: "Plant Based Burger", description: "A plant-based patty with all the crunch. Lettuce, tomato, vegan mayo. Zero compromise.", price: "£7.99", priceValue: 7.99, image: IMG.burger, badge: "V", badgeVariant: "vegan" },
      { id: "burger-smoked", name: "Smoked Grill Burger", description: "Chargrilled chicken breast, smoked cheddar, caramelised onions, smoky BBQ glaze.", price: "£8.99", priceValue: 8.99, image: IMG.grill },
      { id: "burger-quarter", name: "Quarter Pounder", description: "A thick, seasoned beef-style patty stacked with fresh lettuce, tomato, and special sauce.", price: "£8.49", priceValue: 8.49, image: IMG.burger },
    ],
  },
  {
    id: "box-meals",
    number: "04",
    title: "Box Meals",
    image: IMG.box,
    items: [
      { id: "box-1", name: "The Crispies Box", description: "Placeholder — swap in your real box meal items and prices.", price: "£9.99", priceValue: 9.99, image: IMG.box },
      { id: "box-2", name: "Grilled Box", description: "Placeholder — swap in your real box meal items and prices.", price: "£10.49", priceValue: 10.49, image: IMG.grill },
    ],
  },
  {
    id: "gourmet-burgers",
    number: "05",
    title: "Gourmet Burgers",
    image: IMG.gourmet,
    items: [
      { id: "gourmet-1", name: "Truffle Mayo Burger", description: "Placeholder — swap in your real gourmet burger items and prices.", price: "£9.99", priceValue: 9.99, image: IMG.gourmet },
      { id: "gourmet-2", name: "Double Smash", description: "Placeholder — swap in your real gourmet burger items and prices.", price: "£11.49", priceValue: 11.49, image: IMG.gourmet },
    ],
  },
  {
    id: "big-wrap",
    number: "06",
    title: "The Big Wrap",
    image: IMG.wrap,
    items: [
      { id: "wrap-1", name: "Loaded Chicken Wrap", description: "Placeholder — swap in your real wrap items and prices.", price: "£6.99", priceValue: 6.99, image: IMG.wrap },
    ],
  },
  {
    id: "flaming-grill",
    number: "07",
    title: "Crispies Flaming Grill",
    image: IMG.grill,
    items: [
      { id: "grill-1", name: "Flame Grilled Half Chicken", description: "Placeholder — swap in your real grill items and prices.", price: "£8.99", priceValue: 8.99, image: IMG.grill },
    ],
  },
  {
    id: "platters",
    number: "08",
    title: "Crispies Platters",
    image: IMG.platter,
    items: [
      { id: "platter-1", name: "Family Sharer Platter", description: "Placeholder — swap in your real platter items and prices.", price: "£18.99", priceValue: 18.99, image: IMG.platter },
    ],
  },
  {
    id: "kids-deals",
    number: "09",
    title: "Kids Deals",
    image: IMG.kids,
    items: [
      { id: "kids-1", name: "Kids Tenders Meal", description: "Placeholder — swap in your real kids deal items and prices.", price: "£4.99", priceValue: 4.99, image: IMG.kids },
    ],
  },
  {
    id: "signature-sides",
    number: "10",
    title: "Signature Sides",
    image: IMG.sides,
    items: [
      { id: "side-1", name: "Loaded Fries", description: "Placeholder — swap in your real sides and prices.", price: "£3.99", priceValue: 3.99, image: IMG.sides },
    ],
  },
  {
    id: "desserts",
    number: "11",
    title: "Desserts",
    image: IMG.dessert,
    items: [
      { id: "dessert-1", name: "Chocolate Fudge Cake", description: "Placeholder — swap in your real desserts and prices.", price: "£3.49", priceValue: 3.49, image: IMG.dessert },
    ],
  },
];

const initialDeals: MenuItemType[] = [
  { id: "deal-wing-side", name: "Wing + Side Combo", description: "7 crispy wings paired with loaded fries and a dipping sauce of your choice.", price: "£9.99", priceValue: 9.99, image: IMG.wings, badge: "Popular" },
  { id: "deal-burger-drink", name: "Burger + Drink Deal", description: "Classic Crispies Burger with any regular drink. The perfect lunch combo.", price: "£9.49", priceValue: 9.49, image: IMG.burger, badge: "Lunch" },
  { id: "deal-family", name: "Family Feast", description: "10 wings, 5 tenders, loaded fries, and 4 dips. Feeds the whole crew.", price: "£24.99", priceValue: 24.99, image: IMG.platter, badge: "Save £8" },
  { id: "deal-student", name: "Student Deal", description: "Trio-Tastic tenders with fries and a drink. Show your student ID.", price: "£6.99", priceValue: 6.99, image: IMG.tenders, badge: "Student" },
  { id: "deal-grill-box", name: "Grill Box Meal", description: "Smoked Grill Burger with loaded fries and a side salad.", price: "£11.99", priceValue: 11.99, image: IMG.grill, badge: "New" },
  { id: "deal-kids", name: "Kids Meal Deal", description: "3 tenders, fries, and a fruit shoot. Just for the little ones.", price: "£5.49", priceValue: 5.49, image: IMG.kids },
  { id: "deal-platter-drinks", name: "Platter + 2 Drinks", description: "Family Sharer Platter with two regular soft drinks. Party time.", price: "£21.99", priceValue: 21.99, image: IMG.platter, badge: "Party" },
  { id: "deal-wrap-chips", name: "Wrap + Chips", description: "Loaded Chicken Wrap with a side of seasoned chips and a dip.", price: "£8.49", priceValue: 8.49, image: IMG.wrap },
];

type MenuContextType = {
  categories: MenuCategoryType[];
  deals: MenuItemType[];
  totalItems: number;
  setCategories: (cats: MenuCategoryType[]) => void;
  setDeals: (deals: MenuItemType[]) => void;
};

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MenuCategoryType[]>(initialMenuCategories);
  const [deals, setDeals] = useState<MenuItemType[]>(initialDeals);

  const totalItems = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.items.length, 0),
    [categories],
  );

  return (
    <MenuContext.Provider
      value={{ categories, deals, totalItems, setCategories, setDeals }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}