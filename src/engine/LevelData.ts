import { Level } from '../types';

export const LEVEL_1: Level = {
  id: 1,
  title: 'Tiket #1',
  objective: 'Buat karakter berjalan ke bendera',
  ohimMessage: 'Angga, tolong kerjain ini sebelum deadline ya.',
  timerSeconds: 60,
  coffeeCost: 15,
  keywordEntries: [
    {
      keywords: ['jalan', 'gerak', 'maju', 'bergerak', 'berjalan'],
      category: 'movement',
      correctAction: { action: 'move', speed: 1 },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'random',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Gerak? Oke, aku gerakkan ke... mana ya? Biar random aja."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'left',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Jalan... jalan-jalan? Oke aku jalan mundur aja ya."',
            specialEffect: 'moonwalk',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Gerak? Maksudnya getar di tempat? Oke."',
            specialEffect: 'vibrate',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['kanan'],
      category: 'direction',
      correctAction: { direction: 'right' },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'left',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kanan? Hmm, kanan dari sudut pandang siapa? Aku pilih kiri."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'up',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kanan itu... atas? Aku agak bingung arah."',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Kanan... kanan... *berputar-putar* mana ya kanan?"',
            specialEffect: 'spin',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['kiri'],
      category: 'direction',
      correctAction: { direction: 'left' },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'right',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kiri? Maksudnya kebalikan kiri, alias kanan? Oke!"',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'down',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kiri itu bawah kan? Sama aja."',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Kiri? *sprite terbalik* Ini udah bener kan?"',
            specialEffect: 'flip',
          },
          weight: 1,
        },
      ],
    },
    {
      keywords: ['cepat', 'cepet', 'lari'],
      category: 'speed',
      correctAction: { speed: 2 },
      hallucinations: [
        {
          action: {
            action: 'move',
            speed: 0.01,
            hallucinated: true,
            flavor: 'AI: "Cepat? Oke, cepat versi siput. Teknisnya tetap bergerak."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            speed: 100,
            hallucinated: true,
            flavor: 'AI: "CEPAAAAT! *karakter terbang keluar layar*"',
            specialEffect: 'flyoff',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['bendera', 'flag', 'tujuan', 'target'],
      category: 'target',
      correctAction: { direction: 'right' },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'random',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Bendera? Bendera yang mana? Aku cari random aja."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Bendera? Oke aku pindahkan benderanya. *bendera kabur*"',
            specialEffect: 'flag-runs',
          },
          weight: 2,
        },
      ],
    },
  ],
  defaultAction: {
    action: 'confused',
    hallucinated: false,
    flavor: 'ERROR: Saya tidak mengerti apa yang kamu mau...',
  },
};

export const LEVELS: Level[] = [LEVEL_1];
