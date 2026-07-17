import type { BookSection } from '../utils/search';

const recipeGuide = `
## A fresh, home-kitchen recipe collection

These recipes are simple, home-style ideas for Indian families. They follow IAP infant-and-young-child-feeding principles: start complementary food after completed 6 months, continue breast milk or formula, use thick home-cooked food, offer variety gradually, and avoid added salt in the first year and added sugar in the first two years. Introduce a new allergenic food separately and in a small amount when your baby is well, rather than hiding it inside a new mixed dish.

**Safety for every recipe:** sit with your baby throughout the meal; cook food until soft; mash, mince, or shape it for your baby's skills; and never add honey. Ask your paediatrician for individual guidance for prematurity, poor weight gain, allergy, kidney disease, or swallowing problems.
`;

export const recipeOverrides: Record<string, Pick<BookSection, 'content_md' | 'tags'>> = {
  ch_17_sec_2: {
    content_md: `${recipeGuide}

## 6 months+: first bowls and smooth mashes

### 4. Ragi Potato Comfort Bowl
**You need:** 1 tablespoon ragi flour, 2 tablespoons cooked potato, and water.

**Method:** Whisk ragi flour into cool water before heating. Cook on low heat until glossy and thick. Mash the potato very smoothly, stir it in, and cool to a safe temperature. Start with a few spoonfuls; breast milk or formula remains the main food at this age.

### 1. Red Lentil and Pumpkin Mash
**You need:** 1 tablespoon masoor dal, a small piece of pumpkin, and water.

**Method:** Pressure-cook or simmer until both ingredients collapse easily. Mash thoroughly with cooking water to a thick, spoonable consistency. This gives a gentle iron-and-protein focused bowl without added salt or sugar.

### 6. Apple Oats Spoon Porridge
**You need:** 1 tablespoon plain oats, peeled apple, and water.

**Method:** Cook the apple until soft. Cook oats separately in water, combine, and mash. Keep it thick enough to sit on a spoon; do not add sugar, biscuits, or packaged cereal powder.

### 2. Carrot Moong Dal Silk
**You need:** 1 tablespoon yellow moong dal, a few carrot pieces, and water.

**Method:** Cook until very soft, then blend or press through a sieve only if your baby still needs a smooth texture. Move toward a coarser mash over the next weeks as skills develop.

### 8. Banana Curd Mash
**You need:** ripe banana and plain pasteurised curd, if dairy has already been introduced.

**Method:** Mash a small amount of banana with curd just before serving. Offer it fresh; do not keep leftovers. If this is baby's first dairy exposure, offer plain curd alone first.
`,
    tags: ['recipes', 'feeding', 'solids', '6 months', 'ragi', 'iron'],
  },
  ch_17_sec_3: {
    content_md: `${recipeGuide}

## 7 to 9 months: thicker textures and gentle variety

### 11. Soft Vegetable Dalia
**You need:** broken wheat (dalia), bottle gourd or pumpkin, moong dal, and water.

**Method:** Cook until soft enough to mash between two fingers. Mash coarsely rather than making a thin soup. Let your baby practise moving the thicker texture around the mouth.

### 7. Pear and Ragi Mash
**You need:** cooked pear, prepared plain ragi porridge, and water.

**Method:** Steam the pear until soft and mash it into cooled ragi. This is a different way to serve ragi—not a sweetened dessert. Fruit brings natural flavour, so no jaggery or sugar is needed.

### 14. Spinach Moong Rice Mash
**You need:** rice, yellow moong dal, a small handful of spinach, and water.

**Method:** Cook rice and dal until soft. Add spinach near the end, cook fully, and mash to the texture your baby manages. Serve fresh, without salt.

### 9. Chickpea and Sweet Potato Spread
**You need:** thoroughly cooked chickpeas, steamed sweet potato, and water.

**Method:** Blend or mash until completely smooth—whole chickpeas are a choking risk. Thin only enough for a thick spread or soft mash. Introduce chickpea on a day when you can watch for a reaction.

### 16. Idli and Sambar Vegetable Mash
**You need:** soft homemade idli, well-cooked vegetables from a mild, salt-free portion of sambar, and water.

**Method:** Soak and mash until no firm lumps remain. Keep chilli and salt out of baby's serving; season the family portion after setting baby's food aside.
`,
    tags: ['recipes', 'feeding', 'solids', '7 to 9 months', 'textures', 'iron'],
  },
  ch_17_sec_4: {
    content_md: `${recipeGuide}

## 10 to 12 months: shared meals, soft pieces, and self-feeding practice

### 19. Paneer Pea Rice Bites
**You need:** cooked rice, well-cooked peas, soft paneer, and a little water.

**Method:** Mash all ingredients well and press into two-finger-sized soft logs. They must squash easily between your fingers. Sit with your child while they self-feed; no added salt is needed.

### 23. Chicken and Pumpkin Family Khichdi
**You need:** rice, lentils, finely minced chicken, pumpkin, and water.

**Method:** Cook until chicken is fully done and every ingredient is very soft. Shred or mash any remaining chicken fibres before serving. Make a salt-free baby portion first, then season the family meal separately.

### 17. Lentil Vegetable Uttapam Strips
**You need:** unsalted fermented dosa batter, finely grated carrot or bottle gourd, and a small amount of oil.

**Method:** Cook a soft, thick mini uttapam through on both sides. Cut into long strips that squash easily. Avoid crisp edges and serve only while seated and supervised.

### 25. Egg and Spinach Rice Mash
**You need:** a fully cooked egg, cooked rice, spinach, and water.

**Method:** Introduce well-cooked egg on its own before using it in a mixed dish. Once tolerated, mash it with soft rice and cooked spinach into a moist, easy-to-swallow meal.

### 21. Oat and Vegetable Handheld Squares
**You need:** cooked oats, grated zucchini or carrot, and a small amount of egg or mashed dal as a binder.

**Method:** Steam or pan-cook into a soft square, then cut into finger-length strips. Check that each piece crushes easily; reshape or mash if your child is not yet managing finger foods.
`,
    tags: ['recipes', 'feeding', 'solids', '10 to 12 months', 'finger food', 'family meals'],
  },
};
