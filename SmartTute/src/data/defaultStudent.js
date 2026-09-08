export const defaultStudent = {
  name: "",
  nickname: "",

  avatar: {
    preset: "hero1",
    skinTone: "#FFDBAC",
    hairStyle: "short",
    hairColor: "#3B82F6",
    shirtColor: "#38BDF8",
    pantsColor: "#1E293B",
    shoesColor: "#FFFFFF",
    accessory: "glasses"
  },

  stats: {
    questionsAnswered: 24,
    correctAnswers: 19
  },

  isSetupComplete: false
};

export const AVATAR_CATALOG = {
  presets: [
    {
      id: "hero1",
      name: "Star Scholar",
      skinTone: "#FFDBAC",
      hairStyle: "short",
      hairColor: "#3B82F6",
      shirtColor: "#38BDF8",
      pantsColor: "#1E293B",
      shoesColor: "#FFFFFF",
      accessory: "glasses"
    },
    {
      id: "hero2",
      name: "Math Wizard",
      skinTone: "#F1C27D",
      hairStyle: "curly",
      hairColor: "#8B5CF6",
      shirtColor: "#A78BFA",
      pantsColor: "#475569",
      shoesColor: "#F8FAFC",
      accessory: "hat"
    },
    {
      id: "hero3",
      name: "Problem Solver",
      skinTone: "#8D5524",
      hairStyle: "bob",
      hairColor: "#EC4899",
      shirtColor: "#F472B6",
      pantsColor: "#0F172A",
      shoesColor: "#F472B6",
      accessory: "none"
    },
    {
      id: "hero4",
      name: "Logic Champion",
      skinTone: "#C58C85",
      hairStyle: "spiky",
      hairColor: "#10B981",
      shirtColor: "#34D399",
      pantsColor: "#334155",
      shoesColor: "#10B981",
      accessory: "headband"
    }
  ],
  skinTones: [
    { id: "#FFDBAC", name: "Light" },
    { id: "#F1C27D", name: "Warm" },
    { id: "#E0AC69", name: "Tan" },
    { id: "#C58C85", name: "Deep Tan" },
    { id: "#8D5524", name: "Brown" },
    { id: "#503335", name: "Dark" }
  ],
  hairStyles: [
    { id: "short", name: "Short" },
    { id: "curly", name: "Curly" },
    { id: "bob", name: "Bob" },
    { id: "spiky", name: "Spiky" },
    { id: "ponytail", name: "Ponytail" }
  ],
  hairColors: [
    { id: "#2C1B18", name: "Black" },
    { id: "#3B82F6", name: "Blue" },
    { id: "#8B5CF6", name: "Purple" },
    { id: "#EC4899", name: "Pink" },
    { id: "#10B981", name: "Emerald" },
    { id: "#F59E0B", name: "Gold" }
  ],
  shirtColors: [
    { id: "#38BDF8", name: "Cyan" },
    { id: "#A78BFA", name: "Violet" },
    { id: "#F472B6", name: "Rose" },
    { id: "#34D399", name: "Mint" },
    { id: "#FBBF24", name: "Amber" },
    { id: "#6366F1", name: "Indigo" }
  ],
  accessories: [
    { id: "none", name: "None" },
    { id: "glasses", name: "Glasses" },
    { id: "hat", name: "Star Cap" },
    { id: "headband", name: "Headband" }
  ]
};
