import type { BookSection } from '../utils/search';

export const bookContentOverrides: Record<string, Partial<Pick<BookSection, 'section_title' | 'content_md' | 'tags'>>> = {
  ch_08_intro: {
    content_md: `# Chapter 7: Tummy Troubles, Potty Habits, and Reflux: A Parent's Guide to Infant Digestion

<div style="text-align: center; margin: 8px 0;"><img src="/new-chapters/stool-card-dr-amey-gauns.png" alt="Printable stool colour health card showing normal yellow, green, brown baby stool and warning red, black, pale grey or white stool" style="max-width: 100%; max-height: 170px; border-radius: 4px; border: 1px solid #e2e8f0;"/></div>

As a parent, you will spend a surprising amount of time observing your baby's diapers, listening to their tummy rumbles, and cleaning up spit-up. For new parents, these everyday bodily functions can be a source of constant worry. In this chapter, we will demystify your baby's digestive system.

You will learn what constitutes a normal bowel movement, how to distinguish between a harmless "happy spit-up" and a medical condition like GERD, how to safely manage colic and diarrhea, and when a urinary tract infection or hernia requires a doctor's visit. My goal is to give you peace of mind and the tools to handle these common issues with confidence.`,
    tags: ['stool', 'poop', 'diaper', 'reflux', 'colic', 'diarrhea'],
  },
  ch_08_sec_1: {
    content_md: `## 1. The Potty Diaries: What's Normal in the Diaper?

One of the first things you will notice about your newborn is that their stool changes rapidly in the first week of life.

<div style="text-align: center; margin: 8px 0;"><img src="/new-chapters/stool-card-dr-amey-gauns.png" alt="Printable stool colour health card showing normal yellow, green, brown baby stool and warning red, black, pale grey or white stool" style="max-width: 100%; max-height: 150px; border-radius: 4px; border: 1px solid #e2e8f0;"/></div>

### Meconium: The First Bowel Movement

During the first 24 to 48 hours, your newborn will pass a sticky, tarry, dark-green to black stool called **meconium**. This is made up of amniotic fluid, mucus, skin cells, and other substances swallowed in the womb. Passing meconium is a crucial sign that your baby's digestive tract is open and functioning.

### Breastfed vs. Formula-Fed Poop

Once the meconium clears, usually by the third or fourth day, the colour and texture of your baby's poop will transition.

* **Breastfed babies:** The stool typically becomes loose, light yellow or mustard-coloured, and may contain little seed-like particles. It has a mild, sweetish smell. Breastfed babies often pass stool after many feeds in the early weeks. After 4 to 6 weeks, some breastfed babies pass stool only once every few days, which can still be normal if the stool remains soft and the baby is feeding, passing urine, and gaining weight well.
* **Formula-fed babies:** The stool tends to be firmer, pastier, and ranges from tan to yellow-green or dark brown. It is often smellier than breastfed stool. Formula-fed babies usually pass stool a few times a day initially, then often settle into a less frequent pattern.

### Quick Colour Rule

Yellow, green, tan, orange, and brown stool can be normal when the baby is feeding well, active, comfortable, and passing urine normally. Red stool, black tar-like stool after the meconium period, or white/pale grey/clay-coloured stool should be discussed with your pediatrician promptly.`,
    tags: ['stool', 'poop', 'meconium', 'stool colour', 'breastfed stool', 'formula stool'],
  },
  ch_02_sec_7: {
    content_md: `## 7. Critical Screenings and Preventive Care

Before discharge, ask the hospital team to document the newborn screening tests clearly in the baby file.

### CCHD Pulse Oximetry Screening

Pulse oximetry is a quick, painless screening test that checks oxygen saturation using a soft sensor on the baby's hand/foot. It helps pick up some critical congenital heart diseases before obvious symptoms appear.

<div style="text-align: center; margin: 15px 0;"><img src="/updated-book-images/newborn-pulse-oximeter.jpeg" alt="Newborn pulse oximeter sensor placed gently on the foot for CCHD screening" style="max-width: 100%; max-height: 400px; border-radius: 4px; border: 1px solid #e2e8f0;"/></div>

### Other first-week checks

* Universal newborn hearing screening.
* Birth weight, length, and head circumference recorded on the discharge card.
* BCG, OPV, and Hepatitis B birth dose entered in the vaccination record.
* Follow-up plan for jaundice, feeding, weight check, and any abnormal screening result.

> [!IMPORTANT]
> Screening is not the same as diagnosis. If oxygen saturation is low, the baby needs urgent pediatric review and may need repeat testing or echocardiography.`,
    tags: ['newborn screening', 'pulse oximetry', 'CCHD', 'hearing test', 'birth vaccines'],
  },
  ch_10_sec_3: {
    content_md: `## Tracking Physical Growth: Weight, Length, and Head Size

Growth tracking works best when every visit records three numbers: weight, length/height, and head circumference. One isolated number matters less than the pattern over time.

<div style="text-align: center; margin: 15px 0;"><img src="/updated-book-images/baby-growth-measurement.jpeg" alt="Baby being weighed and measured in a pediatric clinic with weight and length equipment" style="max-width: 100%; max-height: 400px; border-radius: 4px; border: 1px solid #e2e8f0;"/></div>

### What parents should record

* Date of measurement.
* Weight in kg.
* Length/height in cm.
* Head circumference in cm, especially in the first two years.
* Feeding changes, illness, or admission around that period.

### Parent height and expected adult height

Pediatric practice often uses the mid-parental height estimate as a broad guide:

* Boy: (father height + mother height + 13 cm) / 2.
* Girl: (father height + mother height - 13 cm) / 2.
* A usual target range is about 8.5 cm above or below this estimate.

This is only a guide. Prematurity, chronic illness, nutrition, puberty timing, and genetics can all change the growth pattern. Keep serial records in the child's health file and bring them to pediatrician visits, because the trend over time matters more than one isolated reading.`,
    tags: ['growth chart', 'weight', 'height', 'head circumference', 'mid parental height'],
  },
  ch_21_sec_1: {
    section_title: '1. ACVIP-Style Vaccination Record and Reminder Chart',
    content_md: `## 1. ACVIP-Style Vaccination Record and Reminder Chart

The chart below follows the ACVIP-style vaccination card layout used in many pediatric clinics: age, vaccine, due date, given date, brand name, batch/expiry, and signature. Parents can use the baby's date of birth to calculate due dates, mark which vaccines were actually given, and carry this record to every pediatric visit.

<div style="text-align: center; margin: 15px 0;"><img src="/updated-book-images/acvip-vaccination-chart.jpeg" alt="ACVIP-style child vaccination journey chart with due date, given on, brand, batch, and signature columns" style="max-width: 100%; max-height: 520px; border-radius: 4px; border: 1px solid #e2e8f0;"/></div>

| Age | Vaccines on the chart | Record to keep |
| :--- | :--- | :--- |
| Birth | BCG, OPV, Hep B-1 birth dose | Due date, given date, brand/batch if available |
| 6 weeks | DTaP/DTwP-1, IPV-1, Hib-1, Hep B-2, Rota-1, PCV-1 | First primary series visit |
| 10 weeks | DTaP/DTwP-2, IPV-2, Hib-2, Hep B-3, Rota-2, PCV-2 | Second primary series visit |
| 14 weeks | DTaP/DTwP-3, IPV-3, Hib-3, Hep B-4, Rota-3, PCV-3 | Third primary series visit |
| 6 months | Influenza vaccine-1, typhoid vaccine if advised | Start flu series when age-eligible |
| 7 months | Influenza vaccine-2 | Usually 4 weeks after first flu dose |
| 9 months | MMR-1 | Clinic may adjust based on national/local schedule |
| 12 months | Hep A, MCV-2, JE-1, cholera vaccine-1 where indicated | Regional/risk-based vaccines need doctor advice |
| 13 months | JE-2, cholera vaccine-2 where indicated | Follow the brand-specific interval |
| 15 months | MMR-2, Varicella-1, PCV booster | Booster visit |
| 16-18 months | DTaP/DTwP-B1, Hib-B1, IPV-B1 | Booster series |

> [!IMPORTANT]
> Vaccination schedules can change and some vaccines are regional, optional, or risk-based. Use this chart as a parent record and reminder; the final prescription should come from the child's pediatrician.`,
    tags: ['vaccination', 'ACVIP', 'IAP', 'immunization schedule', 'vaccine reminder'],
  },
  ch_06_sec_4: {
    content_md: `## Latching and Positioning: The Keys to Comfort

A good latch should feel like a deep tug, not sharp pain. The baby should be close to the mother, with ear, shoulder, and hip in one line. Bring the baby to the breast, not the breast down to the baby.

### When to get a latch and milk-transfer review

Arrange an observed feed with a pediatrician or lactation professional if any of these happen:

* Nipple pain, cracks, bleeding, flattened nipples after feeds, or pain lasting through the feed.
* Baby is very sleepy at the breast, feeds for very long but still seems hungry, or falls asleep quickly without swallowing.
* Fewer wet nappies than expected, persistent urate crystals after day 4, jaundice, or poor weight gain.
* Clicking sounds, milk leaking from the mouth, repeated choking/coughing at the breast, or suspected tongue-tie.
* Need for nipple shields, top feeds, pumping plan, or relactation support.

### Lactation aids: useful, but not magic fixes

* **Hand expression:** helpful in the first days, during engorgement, or when baby cannot latch. Colostrum can be collected in a clean spoon or syringe.
* **Breast pump:** useful for separation, NICU/preterm feeding, returning to work, or protecting supply. Pain, nipple rubbing, or whitening means the flange size needs review.
* **Nipple shield:** may help selected babies latch, but it should be used after a latch/milk-transfer assessment and followed up with weight checks.
* **Supplemental nursing system/cup/spoon/paladai:** can support babies who need extra milk while protecting breastfeeding skills. Use with clinical guidance.
* **Pillow/foot support:** improves posture. It should support the mother and baby, not force the baby away from the breast.

Galactagogues, herbal products, and medicines should not be the first response to low supply. First check latch, frequency, milk removal, maternal health, and baby's weight pattern.`,
    tags: ['breastfeeding', 'latch', 'milk transfer', 'lactation aids', 'nipple shield', 'pump'],
  },
  ch_06_sec_10: {
    content_md: `## Breastfeeding and Feeding in Special Circumstances

Most babies can continue breastfeeding through ordinary family illnesses, minor maternal infections, and common medications. Stopping feeds suddenly can reduce milk supply and may remove an important source of comfort and hydration for the baby.

### Feeding during illness

* **Vomiting or diarrhea:** continue breastfeeding more often. For babies already on solids, offer small, frequent portions of familiar soft food and follow the clinician's plan for oral rehydration solution.
* **Fever/cold/cough:** offer frequent feeds. Babies may feed for shorter periods because of blocked nose or tiredness.
* **Poor appetite during illness:** do not force feed. Offer breast milk/formula and small energy-dense foods when alert.
* **Recovery phase:** appetite often improves after fever settles. Offer one extra small meal/snack daily for a few days to help catch up.

### Prematurity or NICU admission

For preterm or unwell babies, mother's own expressed milk and skin-to-skin Kangaroo Mother Care are often central to care. The NICU/pediatric team should decide the milk volume, fortifier use, tube/cup/paladai/bottle method, and transition to direct breastfeeding. Parents should ask for a written feeding plan before discharge.

### Maternal medication use

Many common medicines are compatible with breastfeeding, but every new medicine should be checked with the prescribing doctor or pharmacist. Do not stop essential treatment without advice. Seek specific review for chemotherapy drugs, radioactive medicines, sedatives/opioids, anti-seizure medicines, and long-term psychiatric medicines.

### Starting solids while continuing milk

Start complementary feeding after completed 6 months when the baby is developmentally ready. Continue breast milk or formula, begin with thick mashed home foods, move textures gradually, include iron-rich foods, and use responsive feeding: encourage patiently, but never force.

> [!IMPORTANT]
> **Urgent-care warnings during feeding illness:** go to urgent care for repeated vomiting, green vomit, blood in stool/vomit, poor drinking, no wet nappy for 6-8 hours, fast breathing, unusual sleepiness, seizures, or fever in a baby under 3 months.

### Trusted references for parents

* WHO infant and young child feeding: https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding
* WHO preterm/low-birth-weight care: https://www.who.int/news-room/fact-sheets/detail/preterm-birth`,
    tags: ['feeding during illness', 'prematurity', 'medication', 'starting solids', 'WHO', 'urgent care'],
  },
  ch_12_sec_7: {
    content_md: `## 7. First Aid and Life-Saving Protocols for Emergencies

This section is for immediate first aid while arranging medical care. It does not replace emergency services or a pediatrician's assessment.

### Dog, Cat, Monkey, or Bat Bite/Scratch: Rabies First Aid

Treat any bite, scratch, or saliva contact on broken skin as urgent. A scratch can be enough to need rabies post-exposure assessment.

1. **Wash immediately:** hold the wound under running water with soap for a full 15 minutes. If soap is unavailable, keep flushing with clean water.
2. **Apply antiseptic if available:** after washing, use povidone-iodine or another suitable antiseptic if available.
3. **Do not use home remedies:** no chilli, turmeric, oil, toothpaste, mud, ash, or tight bandage. Do not cut the wound or try to make it bleed.
4. **Go the same day:** visit a hospital, emergency department, or anti-rabies clinic. The clinician will decide rabies vaccine, rabies immunoglobulin/monoclonal antibody, tetanus protection, wound care, and antibiotics.
5. **Keep details:** note animal type, time/place, whether the animal is known/vaccinated, and whether the skin was broken. Do not chase or handle an unfamiliar animal.

### When it is an emergency now

Go to emergency care immediately for bites/scratches on the face, head, neck, hands, genitals, deep wounds, heavy bleeding, an unwell child, a bat exposure, or any monkey bite/scratch.

### Other urgent first-aid reminders

* **Burns:** cool running tap water for 20 minutes. No ice, butter, ghee, toothpaste, or turmeric.
* **Poisoning:** call emergency services/poison helpline and do not induce vomiting unless instructed.
* **Choking:** if baby cannot cry, cough, or breathe, start age-appropriate choking first aid and call emergency services.
* **Seizure:** place child on the side, protect from injury, do not restrain, and put nothing in the mouth.

### Trusted reference

* WHO rabies guidance: https://www.who.int/news-room/fact-sheets/detail/rabies
* WHO bite wound/rabies prevention basics are consistent with immediate washing and urgent post-exposure assessment.`,
    tags: ['rabies', 'dog bite', 'cat bite', 'monkey bite', 'bat bite', 'scratch', 'first aid', 'urgent care', 'WHO'],
  },
};
