export const ACADEMIC_YEARS = Array.from({ length: 27 }, (_, i) => {
    const start = 2000 + i;
    const end = (start + 1).toString().slice(-2);
    return `${start}-${end}`;
}).reverse(); // 2026-27 down to 2000-01
