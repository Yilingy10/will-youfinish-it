/* ==========================================================================
   MEMORY FREEZER: the 22 real memories
   These are kept completely apart from the game's records. They are never
   saved to storage, never sent to the shared archive, and the prediction
   machine never sees them.

   Each memory:
     id       two digits, keeps them in order
     when     the date as shown       short   the tiny label in the freezer
     where    the place                what    what kind of ice cream it was
     flavor   what I remember of the flavor (never guessed)
     fate     the stamp at the end, only what actually happened
     title, story   the story. A line starting with "> " is shown as a quote.
     unsure   the things I don't remember
     kind     cup | popsicle | ghost | special   (decides the drawing and how it melts)
     art      the drawing's colours and details
   ========================================================================== */
const MEMORIES = [
  {
    id: '01', when: 'November 2025', short: 'Nov ’25', where: 'DUMBO, Brooklyn', what: 'A cup, bought outside',
    flavor: 'Maybe pistachio?', fate: 'THROWN AWAY', kind: 'cup',
    title: 'The Taxi Arrived',
    story: [
      'One night in DUMBO, we bought ice cream. I think yours was pistachio, but I wouldn’t bet on it.',
      'You’d been eating it for a few minutes when our taxi arrived. So the brand-new ice cream went in the trash right before we got in.',
    ],
    unsure: ['The exact date', 'The flavor'],
    art: { cup: '#FFFDF7', pattern: 'dots', accent: '#B9DB98', scoop: '#D6EDBC', flag: true, abandoned: true },
  },
  {
    id: '02', when: 'Dec 5, 2025', short: 'Dec 5', where: 'Downtown Brooklyn, the cinema', what: 'A cup, from the shop downstairs',
    flavor: 'Forgotten', fate: 'THROWN AWAY', kind: 'cup',
    title: 'Gone Before the Movie',
    story: [
      'We went to see a movie at the cinema under the apartment building we’d later move near. You bought an ice cream downstairs.',
      'I’ve forgotten the flavor. What I do remember: it was in the trash before we even walked into the cinema.',
    ],
    unsure: ['The flavor'],
    art: { cup: '#ECEDFF', pattern: 'film', accent: '#9C94C4', scoop: '#FFF6E6', flag: true, abandoned: true },
  },
  {
    id: '03', when: 'Mar 17, 2026', short: 'Mar 17', where: 'Franklin Ave, Brooklyn, at my place', what: 'Two popsicles, a gift for me',
    flavor: 'Red bean and honeydew, I think', fate: 'GIFTED TO ME', kind: 'popsicle',
    title: 'Cookies for Two Popsicles',
    story: [
      'Back when we both still lived in our old building, I baked cookies and packed a bag of them for you.',
      'You brought me two popsicles. If I remember right, one was red bean and the other was honeydew.',
    ],
    unsure: ['Whether I’m remembering the flavors right'],
    art: { count: 2, wrap: '#FFC6D5', bars: ['#D9AFA6', '#DCF0C6'], labels: ['RED BEAN', 'HONEYDEW'], dessert: 'cookie' },
  },
  {
    id: '04', when: 'Mar 20, 2026', short: 'Mar 20', where: 'American Museum of Natural History, NYC', what: 'Never bought',
    flavor: 'Never got that far', fate: 'NEVER BOUGHT', kind: 'ghost',
    title: 'Ice Cream or Coffee?',
    story: [
      'At the American Museum of Natural History, you noticed the ice cream. Of course you did.',
      'But you were so sleepy that day. In the end, you skipped the ice cream and got a coffee instead.',
    ],
    unsure: [],
    art: { prop: 'coffee' },
  },
  {
    id: '05', when: 'Apr 16, 2026', short: 'Apr 16', where: 'Franklin Ave, Brooklyn, at my place', what: 'One popsicle, a gift for me',
    flavor: 'Don’t remember', fate: 'GIFTED TO ME', kind: 'popsicle',
    title: 'Pudding Delivery',
    story: [
      'I made pudding. When you came over to pick it up, you brought me a popsicle again.',
    ],
    unsure: ['The flavor'],
    art: { count: 1, wrap: '#FFF0A6', bar: '#FFF6E6', dessert: 'pudding' },
  },
  {
    id: '06', when: 'May 10, 2026', short: 'May 10', where: 'Franklin Ave, Brooklyn, at my place', what: 'Two popsicles, a gift for me',
    flavor: 'One was yogurt. The other, I don’t remember.', fate: 'GIFTED TO ME', kind: 'popsicle',
    title: 'Cake and Two More Popsicles',
    story: [
      'This time I made a cake. When you came to get it, you brought me two popsicles. One of them was yogurt.',
    ],
    unsure: ['The other flavor'],
    art: { count: 2, wrap: '#D3D5FB', bars: ['#FFFDF8', '#FFF6E6'], labels: ['YOGURT', '?'], dessert: 'cake' },
  },
  {
    id: '07', when: 'May 13, 2026', short: 'May 13', where: 'Somewhere near Union Square', what: 'An ice cream dessert, at a restaurant',
    flavor: 'Don’t remember. It was sitting in coffee.', fate: 'FINISHED!', kind: 'special',
    title: 'Ice Cream in Coffee',
    story: [
      'We’d finally finished our final presentations, so we went out to dinner to celebrate. You ordered a dessert with ice cream.',
      'Halfway through, you realized the ice cream was sitting in coffee. Then the worrying began: is this really something to eat at night? Am I going to be able to sleep?',
      'It still tasted pretty good, though. You finished it.',
    ],
    unsure: ['Exactly where the restaurant was'],
    art: { special: 'affogato' },
  },
  {
    id: '08', when: 'May 25, 2026', short: 'May 25', where: 'Franklin Ave, Brooklyn, at my place', what: 'One popsicle, a gift for me',
    flavor: 'Don’t remember', fate: 'GIFTED TO ME', kind: 'popsicle',
    title: 'Egg Tarts and Ice Cream',
    story: [
      'I made egg tarts. When you came over to pick them up, you brought a popsicle again.',
    ],
    unsure: ['The flavor'],
    art: { count: 1, wrap: '#D6EDBC', bar: '#FFF6E6', dessert: 'tart' },
  },
  {
    id: '09', when: 'Jun 1, 2026', short: 'Jun 1', where: 'Chinatown, London', what: 'An ice cream dessert, at a dessert shop',
    flavor: 'Maybe mango?', fate: 'FINISHED!', kind: 'special',
    title: 'The One You Actually Finished',
    story: [
      'We went to two museums that day, then took a break at a dessert shop in Chinatown. You ordered a dessert with ice cream. Maybe mango, I think.',
      'Maybe it was because we were starving after a whole day of walking. Either way, this time you actually finished all of it.',
    ],
    unsure: ['The flavor', 'Why you finished it this time'],
    art: { special: 'bowl', mound: '#FFE29A' },
  },
  {
    id: '10', when: 'Jun 4, 2026', short: 'Jun 4', where: 'Greenwich Park, London', what: 'Never bought. The stand was closed.',
    flavor: 'Never got that far', fate: 'NEVER BOUGHT', kind: 'ghost',
    title: 'Five Minutes Too Late?',
    story: [
      'Near Greenwich Park, we passed a children’s playground, and you spotted an ice cream stand next to it. You wanted to get one.',
      'Unfortunately, it was around 5pm, and the stand had already closed.',
    ],
    unsure: [],
    art: { prop: 'closed' },
  },
  {
    id: '11', when: 'Jun 5, 2026', short: 'Jun 5', where: 'Thorpe Park, UK', what: 'Never bought',
    flavor: 'Never got that far', fate: 'NEVER BOUGHT', kind: 'ghost',
    title: 'Ice Cream vs. Roller Coasters',
    story: [
      'At Thorpe Park, you suggested getting ice cream to eat while we walked around.',
      'Then you quickly realized it’s hard to ride roller coasters while holding an ice cream. In the end, you gave up on the idea.',
    ],
    unsure: [],
    art: { prop: 'coaster' },
  },
  {
    id: '12', when: 'Jun 8, 2026', short: 'Jun 8', where: 'Theatre District, London', what: 'A cup, from the cinema',
    flavor: 'Don’t remember', fate: 'THROWN AWAY', kind: 'cup',
    title: 'Not Even Upstairs',
    story: [
      'Before a movie in London, you bought an ice cream in the cinema’s ticket area.',
      'We hadn’t even made it upstairs before you threw it away.',
    ],
    unsure: ['The flavor'],
    art: { cup: '#FFF0F4', pattern: 'stars', accent: '#F7A9C0', scoop: '#FFF6E6', flag: true, abandoned: true },
  },
  {
    id: '13', when: 'Jun 12, 2026', short: 'Jun 12', where: 'London Transport Museum', what: 'A cup, bought outside',
    flavor: 'No idea. It was white.', fate: 'THROWN AWAY', kind: 'cup',
    title: 'The White Ice Cream',
    story: [
      'At the London Transport Museum, you bought a white ice cream. I have no memory of the flavor at all.',
      'I only remember that on the short walk from the gift shop to the museum entrance, you threw it away.',
    ],
    unsure: ['The flavor'],
    art: { cup: '#FFFDF7', pattern: 'stripes', accent: '#F08A9C', scoop: '#FFFFFF', flag: true, abandoned: true },
  },
  {
    id: '14', when: 'Jun 12, 2026, that night', short: 'Jun 12', where: 'Near Oxford Circus, London', what: 'An ice cream dessert. I ordered this one.',
    flavor: 'Something like cinnamon, chocolate and orange?', fate: 'SMASHED FOR FUN', kind: 'special',
    title: 'The Worst Dessert',
    story: [
      'That night we had dinner near Oxford Circus, and I accidentally ordered a truly terrible ice cream dessert. I remember something like cinnamon, chocolate and orange, all at once. It was very strange.',
      'In the end, we just smashed it up together for fun. The dessert was awful, but the whole thing was pretty funny.',
    ],
    unsure: ['The exact flavor combination'],
    art: { special: 'smash' },
  },
  {
    id: '15', when: 'Jun 14, 2026', short: 'Jun 14', where: 'Richmond Park, London', what: 'A cone, from an ice cream van',
    flavor: 'Don’t remember', fate: 'ENDING NOT RECORDED', kind: 'special',
    title: 'The Matching Ice Cream',
    story: [
      'In Richmond Park, you found an ice cream van and bought a cone with a biscuit stick poking out of the top. It looked a little ridiculous.',
      'Even better, a kid walked toward us holding the exact same cone. I saw it and laughed at you a bit.',
    ],
    unsure: ['The flavor', 'Whether you finished it'],
    art: { special: 'matching', scoop: '#FFF6E6' },
  },
  {
    id: '16', when: 'Jul 22, 2026', short: 'Jul 22', where: 'Downtown Brooklyn, the cinema', what: 'Never bought',
    flavor: 'Not this time', fate: 'NEVER BOUGHT', kind: 'ghost',
    title: 'Not Falling for It Again',
    story: [
      'We went back to the cinema from last December. By then, we were about to move to the area.',
      'You noticed the ice cream shop downstairs again, then suddenly remembered: you’d bought one there last year, and it wasn’t good. So you decided not to fall for it again.',
    ],
    unsure: [],
    art: { prop: 'ticket', face: 'nope' },
  },
  {
    id: '17', when: 'Aug 21, 2026', short: 'Aug 21', where: 'Coney Island, Brooklyn', what: 'A cup, from an ice cream shop',
    flavor: 'Maybe Oreo?', fate: 'THROWN AWAY', kind: 'cup',
    title: 'Sunset and a Few Bites',
    story: [
      'One evening we went to Coney Island to see the fireworks. From the subway, it’s a long walk along the windy beach to where the roller coasters are. We watched the sunset as we walked, and after ten-something minutes we were pretty thirsty, so we went into an ice cream shop.',
      'Yours might have been Oreo. But before we’d even started the first ride, you’d had a few bites and thrown it away.',
    ],
    unsure: ['The flavor'],
    art: { cup: '#EAF2FB', pattern: 'waves', accent: '#9CC2E6', scoop: '#F4F0EA', speck: '#6E6461', flag: true, abandoned: true },
  },
  {
    id: '18', when: 'Sep 2, 2026', short: 'Sep 2', where: 'Flatiron, Manhattan', what: 'A cup, from a shop by the road',
    flavor: 'Don’t remember', fate: 'THROWN AWAY', kind: 'cup',
    title: 'Before My Milk Tea',
    story: [
      'We were walking around Flatiron and were already about to head home when you suddenly spotted an ice cream shop by the road. You went straight in and bought one while I waited.',
      'Then I said I wanted to get milk tea nearby. We hadn’t even reached the milk tea shop before your ice cream was in the trash.',
    ],
    unsure: ['The flavor'],
    art: { cup: '#FEF1E6', pattern: 'zigzag', accent: '#F7B98F', scoop: '#FFF6E6', flag: true, abandoned: true },
  },
  {
    id: '19', when: 'Sep 6, 2026', short: 'Sep 6', where: 'Downtown Brooklyn, at my place', what: 'One popsicle, a gift for me',
    flavor: 'Earl Grey (according to you)', fate: 'GIFTED TO ME', kind: 'popsicle',
    title: 'The Earl Grey Incident',
    story: [
      'I made Danish pastries at home, and when you came over, you brought me a popsicle again. For once I remember the flavor, because it tasted a bit strange.',
      'I asked what flavor it was. You said Earl Grey. I couldn’t resist:',
      '> “Why does it taste like the Earl himself?”',
    ],
    unsure: [],
    art: { count: 1, wrap: '#DCD5EC', bar: '#D9C4AC', dessert: 'danish', label: 'EARL GREY' },
  },
  {
    id: '20', when: 'Sep 19, 2026', short: 'Sep 19', where: 'Downtown Brooklyn, the cinema', what: 'Never bought',
    flavor: 'Not this time either', fate: 'NEVER BOUGHT', kind: 'ghost',
    title: 'The Cinema, Again',
    story: [
      'We came back to the same cinema once more. Before the movie, you still went over to study the ice cream shop downstairs.',
      'After careful consideration, you decided not to buy one. Again.',
    ],
    unsure: [],
    art: { prop: 'ticket', face: 'hmm' },
  },
  {
    id: '21', when: 'Oct 21, 2026', short: 'Oct 21', where: 'Pfizer Building, Brooklyn', what: 'Never bought. Just very curious.',
    flavor: 'Still unknown', fate: 'NEVER BOUGHT (AS FAR AS I KNOW)', kind: 'ghost',
    title: 'Asking the Professor',
    story: [
      'There’s an ice cream shop downstairs in the Pfizer Building that you’d been curious about for ages. Every time we walked past it on the way to class, you asked me if their ice cream was any good. I’d never had it either, so I could never answer.',
      'Then one day, our professor bought one and ate it in class. You finally had your chance. In the middle of your own presentation, you asked:',
      '> “Is your ice cream good?”',
    ],
    unsure: ['Whether you ever bought one after that'],
    art: { prop: 'question' },
  },
  {
    id: '22', when: 'Oct 30, 2026', short: 'Oct 30', where: 'Six Flags, New Jersey', what: 'A cup, bought outside',
    flavor: 'Don’t remember', fate: 'ENDING NOT RECORDED', kind: 'cup',
    title: 'Ice Cream Has No Season',
    story: [
      'We went to Six Flags in New Jersey for an early Halloween. It was really cold that night, and neither of us had dressed warmly enough. Even so, you bought an ice cream.',
      'I asked you:',
      '> “It’s this cold, at night. Aren’t you cold?”',
      'You said:',
      '> “I think ice cream doesn’t have a season.”',
    ],
    unsure: ['The flavor', 'Whether you finished it'],
    art: { cup: '#FFF4E0', pattern: 'zigzag', accent: '#F4AE6A', scoop: '#FFF6E6', flag: true, snow: true },
  },
];

// The drawer at the bottom of the freezer: everything I can't date.
const MEMORY_MORE = {
  id: 'more', when: 'Almost every week', short: '', where: 'The supermarket', what: 'Too many to count',
  flavor: 'Lots. I don’t remember which.', fate: 'UNCOUNTED', kind: 'ghost',
  title: 'There Were Many More',
  story: [
    'We also went grocery shopping together almost every week. Sometimes you bought ice cream there too.',
    'But I can’t remember how many times, which days, or what flavors.',
    'There were many more. I just don’t remember them all.',
  ],
  unsure: ['How many', 'Which days', 'Which flavors'],
  art: { prop: 'basket' },
};

// PLACES WE'VE BEEN: the only way a new game record is linked to an old memory
// as "the same place". The player picks one of these by hand on the workbench
// (or after resisting); nothing is ever matched from a typed-in place or from a
// place category like "Ice cream shop". Each id lists the memories that
// happened there. Add a place by copying a line.
const LOCATIONS = {
  cinema:    { label: 'That cinema with the ice cream shop downstairs', memories: ['02', '16', '20'] },
  franklin:  { label: 'My old place on Franklin Ave', memories: ['03', '05', '06', '08'] },
  myplace:   { label: 'My place in Downtown Brooklyn', memories: ['19'] },
  dumbo:     { label: 'DUMBO', memories: ['01'] },
  amnh:      { label: 'The Natural History Museum', memories: ['04'] },
  coney:     { label: 'Coney Island', memories: ['17'] },
  flatiron:  { label: 'Flatiron', memories: ['18'] },
  pfizer:    { label: 'The Pfizer Building', memories: ['21'] },
  sixflags:  { label: 'Six Flags', memories: ['22'] },
  chinatown: { label: 'Chinatown, London', memories: ['09'] },
  greenwich: { label: 'Greenwich Park', memories: ['10'] },
  thorpe:    { label: 'Thorpe Park', memories: ['11'] },
  westend:   { label: 'The cinema in London’s Theatre District', memories: ['12'] },
  ltm:       { label: 'London Transport Museum', memories: ['13'] },
  oxford:    { label: 'Near Oxford Circus', memories: ['14'] },
  richmond:  { label: 'Richmond Park', memories: ['15'] },
};

// Freezer shelves, top to bottom.
const SHELVES = [
  { label: 'WINTER ’25', ids: ['01', '02'] },
  { label: 'SPRING ’26', ids: ['03', '04', '05', '06', '07', '08'] },
  { label: 'JUNE ’26', ids: ['09', '10', '11', '12', '13', '14', '15'] },
  { label: 'SUMMER & FALL ’26', ids: ['16', '17', '18', '19', '20', '21', '22'] },
];

// Stories that run across several memories. A string ties them together in the freezer.
// Series tied together by hand, by id. The ones marked story are Our Stories in the freezer;
// "never" is a kind of ending (ghosts), shown by the Ghosts filter instead.
const MEMORY_SERIES = {
  cinema:   { story: true, title: 'The Cinema Curse', ids: ['02', '16', '20'], note: 'Same cinema. Same ice cream shop downstairs. Three visits.' },
  exchange: { story: true, title: 'From You', ids: ['03', '05', '06', '08', '19'], note: 'I made dessert. You brought popsicles.' },
  never:    { title: 'Ice Creams That Never Happened', ids: ['04', '10', '11', '16', '20', '21'], note: 'You really wanted these. You didn’t buy them.' },
};

// Every word in the Memory Freezer that isn't part of a story.
const MEMORY_COPY = {
  title: 'THE MEMORY FREEZER',
  sub: 'Nearly a year of ice cream, kept cold.',
  doorNote: '22 memories, November 2025 to October 2026.',
  thawed: (n, total) => n === total ? `All ${total} thawed.` : `${n} of ${total} thawed.`,
  find: 'Find a memory',
  filters: { all: 'Everything', cup: 'Bought outside', never: 'Never happened', special: 'Specials', cinema: 'The Cinema Curse', exchange: 'From You' },
  follow: 'Follow the string.',
  drawer: 'GROCERY RUNS',
  hints: {
    cup: 'TAP THE ICE CREAM TO MELT IT', unwrap: 'TAP TO UNWRAP IT', popsicle: 'TAP TO MELT IT', ghost: 'TAP TO CLEAR THE FOG',
    affogato: 'TAP TO LET IT SINK', bowl: 'TAP TO EAT A SPOONFUL', smash: 'TAP TO SMASH IT', matching: 'TAP TO MELT IT',
  },
  orDrag: 'Or drag across it.',
  skip: 'Skip it, just let me read',
  again: 'Replay the melt',
  unsure: 'Not sure about',
  back: 'Back to the freezer',
  backBench: 'Back to your ice cream',
  part: (i, n) => `Part ${i} of ${n}`,
  placeHint: 'Same place as an old memory in the freezer.',
  placeLook: 'Take a look',
  archiveDoor: 'OPEN THE MEMORY FREEZER',
  archiveDoorSub: 'The ice creams the machine never got to measure.',
};

