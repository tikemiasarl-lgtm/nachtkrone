export const PRODUCT_CATEGORIES = ["MASK", "COSTUME", "MASK_AND_COSTUME", "ACCESSORIES", "DECORATION_GIFTS", "CARE_STORAGE", "OFFERS"] as const;
export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryValue, string> = {
  MASK: "Masken", COSTUME: "Kostüme", MASK_AND_COSTUME: "Masken & Kostüme",
  ACCESSORIES: "Zubehör", DECORATION_GIFTS: "Deko & Geschenke", CARE_STORAGE: "Pflege & Aufbewahrung", OFFERS: "Angebote",
};
export const PRODUCT_SUBCATEGORIES: Record<ProductCategoryValue, readonly { value: string; label: string }[]> = {
  MASK: [{value:"WOOD_MASK",label:"Holzmasken"},{value:"LATEX_MASK",label:"Latexmasken"},{value:"HORN_MASK",label:"Masken mit Hörnern"},{value:"CUSTOM_MASK",label:"Masken zum Individualisieren"}],
  COSTUME: [{value:"COMPLETE_COSTUME",label:"Komplettkostüme"},{value:"FUR_COSTUME",label:"Fellkostüme"},{value:"MASK_COSTUME_SET",label:"Sets mit Maske"},{value:"CHILD_COSTUME",label:"Kinderkostüme"}],
  MASK_AND_COSTUME: [{value:"MASK_COSTUME_SET",label:"Sets mit Maske"}],
  ACCESSORIES: [{value:"BELL_BELT",label:"Glockengürtel"},{value:"BELLS",label:"Glocken"},{value:"CHAINS",label:"Ketten"},{value:"CLAW_GLOVES",label:"Krallenhandschuhe"},{value:"TAILS",label:"Schwänze"},{value:"GAITERS_BOOT_COVERS",label:"Gamaschen & Stiefelüberzieher"}],
  DECORATION_GIFTS: [{value:"CHRISTMAS_ORNAMENTS",label:"Weihnachtsornamente"},{value:"FIGURINES",label:"Figuren"},{value:"POSTERS",label:"Poster"},{value:"CARDS",label:"Karten"},{value:"CLOTHING",label:"Bekleidung"},{value:"KRAMPUS_GIFTS",label:"Kleine Krampus-Geschenke"}],
  CARE_STORAGE: [{value:"MASK_BAGS",label:"Maskentaschen"},{value:"PADDING",label:"Polsterungen"},{value:"STANDS",label:"Halterungen"},{value:"CARE_ACCESSORIES",label:"Pflegezubehör"}],
  OFFERS: [{value:"NEW_ARRIVALS",label:"Neuheiten"},{value:"PROMOTIONS",label:"Sonderangebote"},{value:"LAST_ITEMS",label:"Letzte verfügbare Artikel"}],
};
