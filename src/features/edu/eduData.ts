export type EduLesson = {
  id: string;
  title: string;
  desc: string;
  duration: string;
  emoji: string;
  pro?: boolean;
  content: string[]; // kratki paragrafi (v1)
};

export const lessons: EduLesson[] = [
  {
    id: "breath",
    title: "Disanje 101",
    desc: "Ritam i dijafragma",
    duration: "2 min",
    emoji: "🌬️",
    content: [
      "Disanje je osnova za stabilnost karličnog dna. Cilj je ritam: miran udah kroz nos, nešto duži izdah.",
      "Na udah dozvoli stomaku i dijafragmi da se spuste; na izdah lagano aktiviraj karlično dno (kao da zadržavaš mlaz).",
      "Greške: podizanje ramena, zadržavanje daha i guranje stomaka na izdah.",
    ],
  },
  {
    id: "posture",
    title: "Postura",
    desc: "Neutralna kičma",
    duration: "2 min",
    emoji: "🧍",
    content: [
      "Neutralna kičma = lagana krivina u donjem dijelu leđa, rebra spuštena a karlica u srednjem položaju.",
      "U sjedećem položaju osjeti sjedne kosti; u stajanju rasporedi težinu na cijelo stopalo.",
      "Greške: prevelika ekstenzija (izbačena rebra) ili kolaps (zaobljena leđa).",
    ],
  },
  {
    id: "mobility",
    title: "Pelvic mobility",
    desc: "Lagano opuštanje",
    duration: "3 min",
    emoji: "🧘",
    pro: true,
    content: [
      "Sekvenca za nježno opuštanje karličnog dna i mobilnost karlice.",
      "Kombinuj tilting (anterior/posterior) i kruženja karlicom uz ritam disanja.",
      "Dodaj 2–3 ciklusa ‘diši u perineum’ za parasimpatičku smirenost.",
    ],
  },
  {
    id: "awareness",
    title: "Svjesnost",
    desc: "Mind–muscle konekcija",
    duration: "2 min",
    emoji: "🧠",
    content: [
      "Zamisli da podižeš ‘unutrašnje’ tkivo karličnog dna prema gore i blago ka naprijed.",
      "Aktiviraj samo dno karlice — bez stiskanja zadnjice ili bedara.",
      "Radi u kratkim ciklusima 3–5 ponavljanja sa urednim izdahom.",
    ],
  },
  {
    id: "recovery",
    title: "Recovery",
    desc: "Opusti i resetuj",
    duration: "3 min",
    emoji: "🛌",
    pro: true,
    content: [
      "Vježbe produženog izdaha i ‘down-train’ — nauči pustiti napetost nakon serija.",
      "Položaji: ‘child pose’, 90/90 na leđima i duboki izdah uz šapat ‘sss’.",
      "Cilj: tonus nazad u neutralu bez osjećaja ‘prenapregnutosti’.",
    ],
  },
  {
    id: "mistakes",
    title: "Česte greške",
    desc: "Šta izbjegavati",
    duration: "1 min",
    emoji: "⚠️",
    content: [
      "Pretjerana snaga bez kontrole daha; stiskanje gluteusa i bedara; ‘guranje’ stomaka.",
      "Preskakanje odmora i opuštanja; ignorisanje neprijatnosti ili bola.",
      "Plan pobjeđuje snagu: redovnost i forma su prioritet.",
    ],
  },
];

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id) || null;
}
