export const GAMES = [
  { id: "pokemon",   label: "Pokémon",   icon: "⚡" },
  { id: "one_piece", label: "One Piece", icon: "☠️" },
] as const;

export type GameId = typeof GAMES[number]["id"];

export const GAME_LABELS: Record<GameId, string> = {
  pokemon:   "⚡ Pokémon",
  one_piece: "☠️ One Piece",
};

export const PH_CITIES: { region: string; cities: string[] }[] = [
  {
    region: "Metro Manila (NCR)",
    cities: [
      "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila",
      "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig",
      "Quezon City", "San Juan", "Taguig", "Valenzuela",
    ],
  },
  {
    region: "Near NCR / Rizal / Laguna / Cavite",
    cities: [
      "Antipolo", "Bacoor", "Biñan", "Calamba", "Imus", "Meycauayan",
      "San Jose del Monte", "Santa Rosa",
    ],
  },
  {
    region: "Central Luzon",
    cities: [
      "Angeles City", "Malolos", "Olongapo", "San Fernando (Pampanga)",
      "San Fernando (La Union)", "Tarlac City",
    ],
  },
  {
    region: "CALABARZON",
    cities: ["Batangas City", "Cabanatuan", "Lipa", "Lucena", "Naga"],
  },
  {
    region: "Ilocos / CAR",
    cities: ["Baguio", "Dagupan", "Laoag", "Vigan"],
  },
  {
    region: "Visayas",
    cities: ["Bacolod", "Cebu City", "Iloilo City", "Mandaue", "Ormoc", "Tacloban"],
  },
  {
    region: "Mindanao",
    cities: [
      "Cagayan de Oro", "Davao City", "General Santos",
      "Iligan", "Koronadal", "Zamboanga City",
    ],
  },
];
