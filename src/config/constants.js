export const BADGES = [
  { xp:0,    label:"Anfänger",      icon:"🌱", color:"text-green-600"  },
  { xp:100,  label:"Lerner",        icon:"📖", color:"text-blue-500"   },
  { xp:300,  label:"Schüler",       icon:"✏️", color:"text-indigo-500" },
  { xp:600,  label:"Kenner",        icon:"🎯", color:"text-purple-500" },
  { xp:1000, label:"Fortgeschritten",icon:"⚡",color:"text-yellow-500" },
  { xp:2000, label:"Experte",       icon:"🏆", color:"text-orange-500" },
  { xp:4000, label:"Meister",       icon:"🌟", color:"text-rose-500"   },
];
export const getBadge = xp => [...BADGES].reverse().find(b=>xp>=b.xp)||BADGES[0];

export const LEVELS = {
  A1:{ label:"A1 – Beginner",         color:"bg-green-100 text-green-800",  border:"border-green-300"  },
  A2:{ label:"A2 – Elementary",       color:"bg-blue-100 text-blue-800",    border:"border-blue-300"   },
  B1:{ label:"B1 – Intermediate",     color:"bg-yellow-100 text-yellow-800",border:"border-yellow-300" },
  B2:{ label:"B2 – Upper-Intermediate",color:"bg-red-100 text-red-800",     border:"border-red-300"    },
  C1:{ label:"C1 – Advanced",         color:"bg-purple-100 text-purple-800",border:"border-purple-300" },
  C2:{ label:"C2 – Mastery",          color:"bg-indigo-100 text-indigo-800",border:"border-indigo-300" },
};

export const GRAMMAR = {
  A1:[
    { title:"sein – Präsens",       content:"ich bin - du bist - er/sie/es ist\nwir sind - ihr seid - sie/Sie sind" },
    { title:"haben – Präsens",      content:"ich habe - du hast - er/sie/es hat\nwir haben - ihr habt - sie/Sie haben" },
    { title:"Regular verb: machen", content:"ich mache - du machst - er macht\nwir machen - ihr macht - sie machen" },
    { title:"Articles (Nominative)",content:"Masculine: der Hund\nFeminine: die Katze\nNeuter: das Kind\nPlural: die (always)" },
    { title:"Numbers 1–20",         content:"1 eins - 2 zwei - 3 drei - 4 vier - 5 fünf\n6 sechs - 7 sieben - 8 acht - 9 neun - 10 zehn\n11 elf - 12 zwölf - 13 dreizehn - 20 zwanzig" },
  ],
  A2:[
    { title:"Perfekt formation",    content:"haben/sein + Partizip II\nRegular: ge-+stem+-(e)t → gemacht\nIrregular: ge-+stem+-en → gegangen\nSein: motion/change-of-state verbs" },
    { title:"Modal verbs (Präsens)",content:"können: ich kann, du kannst, er kann\nmüssen: ich muss, du musst, er muss\nwollen: ich will, du willst, er will" },
    { title:"Akkusativ case",       content:"der→den (m) - die→die (f) - das→das (n)" },
    { title:"Dativ case",           content:"dem(m/n) - der(f) - den+n(pl)\nAfter: mit, nach, aus, bei, seit, von, zu" },
    { title:"Comparatives",         content:"groß → größer → am größten\nschnell → schneller → am schnellsten\nIrregular: gut→besser→am besten" },
  ],
  B1:[
    { title:"Adjective endings (Nom.)", content:"With der/die/das: -e\nWith ein/eine: -er/-e/-es\nWithout article: -er/-e/-es" },
    { title:"Subordinating conjunctions",content:"weil, dass, obwohl, wenn, als, damit\n→ verb moves to END of clause" },
    { title:"Separable verbs",      content:"aufmachen → ich mache auf\nanrufen → ich rufe an" },
    { title:"Passive (Präsens)",    content:"werden + Partizip II\nDas Buch wird gelesen." },
    { title:"Genitive case",        content:"des Mannes / der Frau / des Kindes\nAfter: wegen, trotz, während, statt" },
  ],
  B2:[
    { title:"Konjunktiv II – Present",content:"sein→wäre - haben→hätte\nkönnen→könnte - würde+Infinitiv" },
    { title:"Konjunktiv II – Past", content:"hätte/wäre + Partizip II\nIch hätte das gemacht." },
    { title:"Indirect speech",      content:"Er sagt, er sei müde.\nSie sagt, sie habe keine Zeit." },
    { title:"Extended adjective",   content:"das schnell fahrende Auto\n(participle as adjective + adverb)" },
  ],
};

export const STARTER = [
  {id:"s1",front:"the dog",back:"der Hund",gender:"der",plural:"die Hunde",exampleDe:"Der Hund ist groß.",exampleEn:"The dog is big."},
  {id:"s2",front:"the cat",back:"die Katze",gender:"die",plural:"die Katzen",exampleDe:"Die Katze schläft.",exampleEn:"The cat is sleeping."},
  {id:"s3",front:"the child",back:"das Kind",gender:"das",plural:"die Kinder",exampleDe:"Das Kind spielt.",exampleEn:"The child is playing."},
  {id:"s4",front:"the bread",back:"das Brot",gender:"das",plural:"die Brote",exampleDe:"Ich esse das Brot.",exampleEn:"I eat the bread."},
  {id:"s5",front:"the woman",back:"die Frau",gender:"die",plural:"die Frauen",exampleDe:"Die Frau arbeitet.",exampleEn:"The woman works."},
  {id:"s6",front:"the man",back:"der Mann",gender:"der",plural:"die Männer",exampleDe:"Der Mann liest.",exampleEn:"The man reads."},
  {id:"s7",front:"the house",back:"das Haus",gender:"das",plural:"die Häuser",exampleDe:"Das Haus ist alt.",exampleEn:"The house is old."},
  {id:"s8",front:"to go",back:"gehen",gender:"verb",plural:"",exampleDe:"Ich gehe in die Schule.",exampleEn:"I go to school."},
  {id:"s9",front:"to eat",back:"essen",gender:"verb",plural:"",exampleDe:"Wir essen Abendessen.",exampleEn:"We eat dinner."},
  {id:"s10",front:"to speak",back:"sprechen",gender:"verb",plural:"",exampleDe:"Sie spricht Deutsch.",exampleEn:"She speaks German."},
  {id:"s11",front:"the water",back:"das Wasser",gender:"das",plural:"die Wasser",exampleDe:"Ich trinke Wasser.",exampleEn:"I drink water."},
  {id:"s12",front:"the school",back:"die Schule",gender:"die",plural:"die Schulen",exampleDe:"Die Schule beginnt um 8 Uhr.",exampleEn:"School starts at 8."},
];

export const WOTD_LIST = [
  {word:"der Augenblick",en:"the moment",ex:"Genieße jeden Augenblick.",gender:"der"},
  {word:"die Sehnsucht",en:"longing / yearning",ex:"Sie hat Sehnsucht nach Hause.",gender:"die"},
  {word:"das Fernweh",en:"wanderlust",ex:"Fernweh treibt mich in die Welt.",gender:"das"},
  {word:"die Gemütlichkeit",en:"cosiness / conviviality",ex:"Das Café hat viel Gemütlichkeit.",gender:"die"},
  {word:"der Weltschmerz",en:"world-weariness",ex:"Manchmal fühle ich Weltschmerz.",gender:"der"},
  {word:"das Fingerspitzengefühl",en:"sensitivity / tact",ex:"Er handelt mit Fingerspitzengefühl.",gender:"das"},
  {word:"die Verschlimmbessern",en:"making things worse while trying to improve",ex:"Pass auf, das ist reines Verschlimmbessern.",gender:"die"},
  {word:"der Torschlusspanik",en:"fear of missing out",ex:"Torschlusspanik treibt sie an.",gender:"der"},
];

export const GS = {
  der:{badge:"bg-blue-600 text-white",soft:"bg-blue-50 text-blue-700 border-blue-200",label:"der"},
  die:{badge:"bg-rose-500 text-white",soft:"bg-rose-50 text-rose-700 border-rose-200",label:"die"},
  das:{badge:"bg-emerald-600 text-white",soft:"bg-emerald-50 text-emerald-700 border-emerald-200",label:"das"},
  verb:{badge:"bg-purple-600 text-white",soft:"bg-purple-50 text-purple-700 border-purple-200",label:"verb"},
};

