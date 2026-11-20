export const user: User = {
  id: 7,
  username: "teste_local",
  firstName: "Diário",
  secondName: "Local",
  birthDate: new Date(2000, 0, 1),
  gender: "other",
  pronoun: "other",
  createdAt: new Date(2026, 0, 1),
};

export const userInsert: UserInsertBase = {
  firstName: user.firstName,
  secondName: user.secondName,
  username: user.username,
  birthDate: user.birthDate,
  gender: "other",
  pronoun: "other",
  password: "senha-local",
  pin: "1234",
};

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 42,
    userId: user.id,
    content: "Um registro do meu dia",
    noteType: "note",
    moodId: null,
    liked: false,
    fixed: false,
    date: new Date(2026, 0, 10, 12),
    createdAt: new Date(2026, 0, 10, 12),
    updatedAt: null,
    deletedAt: null,
    noteBehaviors: [],
    noteEmotions: [],
    noteImages: [],
    noteReactions: [],
    noteThoughts: [],
    mood: null,
    isRepost: false,
    isPureRepost: false,
    thread: [],
    reposts: [],
    ...overrides,
  };
}
