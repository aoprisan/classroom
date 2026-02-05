import { useState, useEffect, useCallback } from 'react';
import type { StudentMeta, StudentMetaMap } from '../types';
import { saveStudentMeta, loadStudentMeta } from '../lib/storage';

const FIRST_NAMES = [
  'Emma', 'Lucas', 'Léa', 'Hugo', 'Chloé', 'Louis', 'Manon', 'Nathan',
  'Jade', 'Gabriel', 'Inès', 'Raphaël', 'Lina', 'Arthur', 'Camille', 'Jules',
  'Sarah', 'Adam', 'Alice', 'Léo', 'Louise', 'Ethan', 'Anna', 'Noah',
  'Zoé', 'Tom', 'Clara', 'Théo', 'Eva', 'Mathis', 'Rose', 'Sacha',
  'Ambre', 'Axel', 'Lola', 'Mohamed', 'Juliette', 'Maxime', 'Mila', 'Enzo',
  'Nina', 'Paul', 'Margot', 'Rayan', 'Agathe', 'Victor', 'Lucie', 'Aaron',
  'Olivia', 'Nolan', 'Iris', 'Liam', 'Charlotte', 'Robin', 'Pauline', 'Oscar',
  'Lisa', 'Gabin', 'Victoire', 'Malo',
];

const FEMALE_NAMES = new Set([
  'Emma', 'Léa', 'Chloé', 'Manon', 'Jade', 'Inès', 'Lina', 'Camille',
  'Sarah', 'Alice', 'Louise', 'Anna', 'Zoé', 'Clara', 'Eva', 'Rose',
  'Ambre', 'Lola', 'Juliette', 'Mila', 'Nina', 'Margot', 'Agathe', 'Lucie',
  'Olivia', 'Iris', 'Charlotte', 'Pauline', 'Lisa', 'Victoire',
]);

const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier',
  'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier', 'Faure',
  'Rousseau', 'Blanc', 'Guérin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin',
  'Morin', 'Mathieu', 'Clément', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Chevalier',
  'Robin', 'Masson', 'Sanchez', 'Gérard', 'Nguyen', 'Boyer', 'Denis', 'Lemaire',
  'Duval', 'Joly', 'Gautier', 'Roger',
];

function randomMeta(index: number): StudentMeta {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const heightCm = Math.floor(Math.random() * 41) + 130; // 130–170 cm
  const gender = FEMALE_NAMES.has(firstName) ? 'F' as const : 'M' as const;
  return { lastName, firstName, heightCm, gender };
}

export function useStudentMeta(totalStudents: number) {
  const [metaMap, setMetaMap] = useState<StudentMetaMap>(() => {
    const saved = loadStudentMeta();
    const map: StudentMetaMap = {};
    for (let i = 1; i <= totalStudents; i++) {
      const s = saved?.[i];
      const hasContent = s && (s.firstName || s.lastName || s.heightCm || s.gender);
      map[i] = hasContent ? { ...s, gender: s.gender ?? '' } : randomMeta(i - 1);
    }
    return map;
  });

  // Sync with totalStudents changes: prune removed, fill new
  const [prevTotal, setPrevTotal] = useState(totalStudents);
  if (prevTotal !== totalStudents) {
    setPrevTotal(totalStudents);
    const next: StudentMetaMap = {};
    for (let i = 1; i <= totalStudents; i++) {
      next[i] = metaMap[i] ?? randomMeta(i - 1);
    }
    setMetaMap(next);
  }

  // Persist on change
  useEffect(() => {
    saveStudentMeta(metaMap);
  }, [metaMap]);

  const updateStudent = useCallback((num: number, meta: StudentMeta) => {
    setMetaMap((prev) => ({ ...prev, [num]: meta }));
  }, []);

  const getDisplayName = useCallback(
    (num: number): string | undefined => {
      const meta = metaMap[num];
      return meta?.firstName || undefined;
    },
    [metaMap],
  );

  return { metaMap, updateStudent, getDisplayName };
}
