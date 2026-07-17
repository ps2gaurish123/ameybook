const appLinks = document.querySelectorAll('[data-app-link]');
const isLocalPreview = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1'
  || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(window.location.hostname);
const appUrl = isLocalPreview
  ? `${window.location.protocol}//${window.location.hostname}:5173/`
  : '#inside';
appLinks.forEach((link) => link.setAttribute('href', appUrl));

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation menu');
  if (mobileMenu) mobileMenu.hidden = true;
  document.body.classList.remove('menu-open');
};

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  if (mobileMenu) mobileMenu.hidden = isOpen;
  document.body.classList.toggle('menu-open', !isOpen);
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });

const stageData = {
  pregnancy: {
    kicker: 'PREGNANCY & PREPARATION',
    title: 'Prepare for birth and the first days at home.',
    topics: ['Hospital bag and birth preparation checklists', 'Breastfeeding preparation and newborn essentials', 'Screening, safe sleep and the first paediatric visit'],
    art: 'P', unit: 'pregnancy', screen: 'Prepare for baby', colour: '#f3c966'
  },
  '0-3': {
    kicker: 'NEWBORN CARE',
    title: 'First weeks, one calm step at a time.',
    topics: ['Breastfeeding, latch and milk-transfer checks', 'Newborn screening and safe sleep checklist', 'Birth vaccines and early visit reminders'],
    art: '0–3', unit: 'months', screen: 'Feeding & newborn care', colour: '#f6dcd1'
  },
  '4-6': {
    kicker: 'GROWING & GETTING READY',
    title: 'Follow development and prepare for first foods.',
    topics: ['Growth and milestone records', 'Vaccination reminders and visit notes', 'Readiness signs and safe starting-solids guidance'],
    art: '4–6', unit: 'months', screen: 'Growth & first foods', colour: '#e7efe9'
  },
  '7-12': {
    kicker: 'EXPLORING FOOD & MOVEMENT',
    title: 'Support safe eating, movement and discovery.',
    topics: ['Texture progression and IAP-aligned family foods', 'Allergy guidance and choking prevention', 'Mobility, safety and developmental checklists'],
    art: '7–12', unit: 'months', screen: 'Food, safety & milestones', colour: '#f3c966'
  },
  '1-2': {
    kicker: 'TODDLER YEARS',
    title: 'Keep routines, growth and development on track.',
    topics: ['Toddler feeding and family meal guidance', 'Language, play and developmental milestones', 'Vaccines, growth, sleep and safety records'],
    art: '1–2', unit: 'years', screen: 'Toddler growth & routines', colour: '#d8e7ee'
  }
};

const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const updateStage = (tab, moveFocus = false) => {
  const data = stageData[tab.dataset.stage];
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.setAttribute('tabindex', selected ? '0' : '-1');
  });
  document.querySelector('#panel-stage')?.setAttribute('aria-labelledby', tab.id);
  document.querySelector('#stage-kicker').textContent = data.kicker;
  document.querySelector('#stage-title').textContent = data.title;
  document.querySelector('#stage-list').innerHTML = data.topics.map((topic) => `<li>${topic}</li>`).join('');
  document.querySelector('#stage-art span').textContent = data.art;
  document.querySelector('#stage-art small').textContent = data.unit;
  document.querySelector('#stage-art').style.background = data.colour;
  document.querySelector('#screen-title').textContent = data.screen;
  if (moveFocus) tab.focus();
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => updateStage(tab));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== index) { event.preventDefault(); updateStage(tabs[next], true); }
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('in-view'));
}
