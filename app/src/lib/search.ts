/**
 * Coincidencia de texto pensada para español: ignora mayúsculas y acentos,
 * para que "sofia" encuentre a "Sofía" y "lopez" a "López".
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** ¿Alguno de los campos contiene el término? (insensible a acentos/mayúsculas) */
export function matches(term: string, ...fields: (string | null | undefined)[]): boolean {
  const t = normalize(term);
  if (!t) return true;
  return fields.some((f) => f && normalize(f).includes(t));
}
