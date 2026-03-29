import { TaskDef } from "../types";

export const TASKS: TaskDef[] = [
  {
    id: 1,
    type: "code-fix",
    title: "Fix Bug #1: Unreachable Code",
    scene: {
      npcsPresent: ["ohim"],
    },
    code: `function hitungGaji(jam) {
  let gaji = jam * 50000
  return gaji
  gaji = gaji + bonus  // bug: unreachable code
}`,
    options: [
      { text: 'Pindahkan "gaji = gaji + bonus" ke sebelum return', correct: true },
      { text: 'Hapus "return gaji"', correct: false },
      { text: 'Tambah "console.log(gaji)"', correct: false },
    ],
    onFail: {
      npc: "ohim",
      dialog: "Lu beneran developer ga sih?!",
    },
  },
  {
    id: 2,
    type: "terminal",
    title: "Deploy Emergency",
    scene: {
      npcsPresent: ["ohim"],
    },
    prompt:
      "Server production down! Error: branch belum di-push. Ketik command yang benar:",
    correctAnswer: "git push origin main",
    onFail: {
      npc: "aris",
      dialog: "Gua yang harus beresin ini?!",
    },
  },
  {
    id: 3,
    type: "code-fix",
    title: "Fix Bug #2: Off-by-One",
    scene: {
      npcsPresent: ["ohim", "aris"],
    },
    code: `const users = ["Aris", "Alif", "Ohim"]
for (let i = 0; i <= users.length; i++) {
  console.log(users[i])  // bug: off-by-one
}`,
    options: [
      {
        text: 'Ganti "i <= users.length" jadi "i < users.length"',
        correct: true,
      },
      { text: 'Ganti "let i = 0" jadi "let i = 1"', correct: false },
      { text: 'Tambah "users.push(\\"Angga\\")"', correct: false },
    ],
    onFail: {
      npc: "alif",
      dialog: "Kamu dipecat. Beres-beresin meja lu.",
    },
  },
];
