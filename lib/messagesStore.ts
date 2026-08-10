export type ChatMessage = {
  id: string;
  from: string;
  to: string;
  childId: string;
  body: string;
  read: boolean;
  createdAt: string;
  fromRole?: 'parent' | 'specialist' | 'admin';
};

const KEY = 'taaluf.messages.v1';

export function loadMessagesLocal(childId?: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as ChatMessage[];
    if (!Array.isArray(list)) return [];
    return childId ? list.filter((m) => m.childId === childId) : list;
  } catch {
    return [];
  }
}

export function saveMessagesLocal(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(messages.slice(0, 500)));
}
