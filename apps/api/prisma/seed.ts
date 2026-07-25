import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MENU_SEED = [
  {
    id: 'cappuccino',
    category: 'Coffee',
    name: 'Cappuccino',
    description:
      'Cappuccino is a balanced combination of espresso, warm milk, and soft milk foam with a creamy taste and distinctive coffee aroma.',
    composition: ['Espresso', 'Steamed Milk', 'Milk Foam'],
    attributes: [
      { label: 'Origin', value: 'Arabica Coffee Beans' },
      { label: 'Roast Level', value: 'Medium Roast' },
      { label: 'Texture', value: 'Creamy & Velvety' },
      { label: 'Aroma', value: 'Rich Coffee Aroma' },
      { label: 'Best Served', value: 'Hot' },
    ],
    meters: [
      { label: 'Coffee Strength', value: 3 },
      { label: 'Creaminess', value: 4 },
      { label: 'Bitterness', value: 2 },
    ],
    servingDetails: ['Size: 240 ml', 'Milk Based', 'Contains Dairy'],
    price: 32000,
    availability: 'Available all day',
    imageAlt: 'Cappuccino with heart-shaped latte art in a light blue cup',
    sortOrder: 0,
  },
  {
    id: 'espresso',
    category: 'Coffee',
    name: 'Espresso',
    description:
      'A concentrated shot of pure coffee, pulled fast and hot, with a thick crema and bold, intense flavor.',
    composition: ['Espresso Shot'],
    attributes: [
      { label: 'Origin', value: 'Robusta Blend' },
      { label: 'Roast Level', value: 'Dark Roast' },
      { label: 'Texture', value: 'Bold & Syrupy' },
      { label: 'Aroma', value: 'Deep, Earthy Aroma' },
      { label: 'Best Served', value: 'Hot' },
    ],
    meters: [
      { label: 'Coffee Strength', value: 5 },
      { label: 'Creaminess', value: 1 },
      { label: 'Bitterness', value: 4 },
    ],
    servingDetails: ['Size: 60 ml', 'Dairy Free', 'Contains Caffeine'],
    price: 22000,
    availability: 'Available all day',
    imageAlt: 'Small cup of espresso with thick crema',
    sortOrder: 1,
  },
  {
    id: 'croissant',
    category: 'Pastries',
    name: 'Butter Croissant',
    description:
      'A flaky, golden pastry laminated with layers of butter for a light, crisp bite with a soft interior.',
    composition: ['Flour', 'Butter', 'Yeast'],
    attributes: [
      { label: 'Origin', value: 'French Recipe' },
      { label: 'Bake Level', value: 'Golden Brown' },
      { label: 'Texture', value: 'Flaky & Buttery' },
      { label: 'Aroma', value: 'Warm Buttery Aroma' },
      { label: 'Best Served', value: 'Warm' },
    ],
    meters: [
      { label: 'Sweetness', value: 2 },
      { label: 'Flakiness', value: 5 },
      { label: 'Richness', value: 4 },
    ],
    servingDetails: ['Size: 80 g', 'Contains Gluten', 'Contains Dairy'],
    price: 28000,
    availability: 'Available until 4 PM',
    imageAlt: 'Golden butter croissant on a plate',
    sortOrder: 0,
  },
  {
    id: 'chocolate-muffin',
    category: 'Pastries',
    name: 'Chocolate Muffin',
    description:
      'A soft, moist muffin packed with rich chocolate chips, baked until the top is slightly crisp and the inside stays fudgy.',
    composition: ['Flour', 'Cocoa', 'Chocolate Chips'],
    attributes: [
      { label: 'Origin', value: 'Belgian Cocoa' },
      { label: 'Bake Level', value: 'Soft Bake' },
      { label: 'Texture', value: 'Moist & Fudgy' },
      { label: 'Aroma', value: 'Deep Chocolate Aroma' },
      { label: 'Best Served', value: 'Room Temperature' },
    ],
    meters: [
      { label: 'Sweetness', value: 4 },
      { label: 'Flakiness', value: 1 },
      { label: 'Richness', value: 5 },
    ],
    servingDetails: ['Size: 100 g', 'Contains Gluten', 'Contains Dairy'],
    price: 25000,
    availability: 'Available until 6 PM',
    imageAlt: 'Chocolate muffin with visible chocolate chips',
    sortOrder: 1,
  },
  {
    id: 'iced-lemon-tea',
    category: 'Beverages',
    name: 'Iced Lemon Tea',
    description:
      'A refreshing blend of steeped black tea and fresh lemon, served chilled over ice for a crisp, citrusy finish.',
    composition: ['Black Tea', 'Fresh Lemon', 'Sugar Syrup'],
    attributes: [
      { label: 'Origin', value: 'Ceylon Black Tea' },
      { label: 'Serving Style', value: 'Iced' },
      { label: 'Texture', value: 'Light & Crisp' },
      { label: 'Aroma', value: 'Citrus Aroma' },
      { label: 'Best Served', value: 'Cold' },
    ],
    meters: [
      { label: 'Sweetness', value: 3 },
      { label: 'Tartness', value: 4 },
      { label: 'Strength', value: 2 },
    ],
    servingDetails: ['Size: 300 ml', 'Dairy Free', 'Contains Caffeine'],
    price: 18000,
    availability: 'Available all day',
    imageAlt: 'Glass of iced lemon tea with lemon slices',
    sortOrder: 0,
  },
  {
    id: 'mango-smoothie',
    category: 'Beverages',
    name: 'Mango Smoothie',
    description:
      'A thick, chilled blend of ripe mango and yogurt, giving a naturally sweet and tropical refresher.',
    composition: ['Ripe Mango', 'Yogurt', 'Ice'],
    attributes: [
      { label: 'Origin', value: 'Local Mango' },
      { label: 'Serving Style', value: 'Blended' },
      { label: 'Texture', value: 'Thick & Creamy' },
      { label: 'Aroma', value: 'Fresh Tropical Aroma' },
      { label: 'Best Served', value: 'Cold' },
    ],
    meters: [
      { label: 'Sweetness', value: 4 },
      { label: 'Tartness', value: 2 },
      { label: 'Strength', value: 1 },
    ],
    servingDetails: ['Size: 350 ml', 'Contains Dairy', 'Caffeine Free'],
    price: 24000,
    availability: 'Available all day',
    imageAlt: 'Glass of mango smoothie with a mango slice garnish',
    sortOrder: 1,
  },
  {
    id: 'fries',
    category: 'Side Dishes',
    name: 'Crispy Fries',
    description:
      'Golden, crispy potato fries seasoned lightly with sea salt, served hot as the perfect companion to any drink.',
    composition: ['Potato', 'Sea Salt', 'Vegetable Oil'],
    attributes: [
      { label: 'Origin', value: 'Russet Potato' },
      { label: 'Cook Level', value: 'Golden Crisp' },
      { label: 'Texture', value: 'Crispy Outside, Soft Inside' },
      { label: 'Aroma', value: 'Savory Aroma' },
      { label: 'Best Served', value: 'Hot' },
    ],
    meters: [
      { label: 'Saltiness', value: 3 },
      { label: 'Crispiness', value: 5 },
      { label: 'Oiliness', value: 2 },
    ],
    servingDetails: ['Size: 150 g', 'Vegan', 'Contains Gluten Trace'],
    price: 20000,
    availability: 'Available all day',
    imageAlt: 'Bowl of crispy golden fries',
    sortOrder: 0,
  },
  {
    id: 'onion-rings',
    category: 'Side Dishes',
    name: 'Onion Rings',
    description:
      'Thick-cut onion rings coated in a crispy seasoned batter, deep-fried until golden and served piping hot.',
    composition: ['Onion', 'Batter', 'Vegetable Oil'],
    attributes: [
      { label: 'Origin', value: 'Sweet Yellow Onion' },
      { label: 'Cook Level', value: 'Golden Crisp' },
      { label: 'Texture', value: 'Crunchy Outside, Sweet Inside' },
      { label: 'Aroma', value: 'Savory Fried Aroma' },
      { label: 'Best Served', value: 'Hot' },
    ],
    meters: [
      { label: 'Saltiness', value: 2 },
      { label: 'Crispiness', value: 5 },
      { label: 'Oiliness', value: 3 },
    ],
    servingDetails: ['Size: 130 g', 'Vegetarian', 'Contains Gluten'],
    price: 22000,
    availability: 'Available all day',
    imageAlt: 'Basket of golden fried onion rings',
    sortOrder: 1,
  },
];

// BARU — akun staf kasir contoh, aman dijalankan ulang (idempotent, upsert
// by name). Ganti nama/PIN ini sesuai kebutuhan, atau tambah staf baru lewat
// apps/admin → Staf setelah login pertama kali.
const STAFF_SEED = [
  { name: 'Budi', pin: '1111' },
  { name: 'Sari', pin: '2222' },
];

async function main() {
  for (const item of MENU_SEED) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  // BARU — seed akun staf kasir contoh
  for (const staff of STAFF_SEED) {
    await prisma.staff.upsert({
      where: { name: staff.name },
      update: { pin: staff.pin },
      create: staff,
    });
  }

  console.log(
    `Seed selesai — ${MENU_SEED.length} menu item, ${STAFF_SEED.length} staf ditulis ke database.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
