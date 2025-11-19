import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
export type TipTopicType = "lclsf" | "mclsf";
export type TipScope = "quest" | "general";
export type TipEntry = {
  id: string;
  topicType: TipTopicType;
  topicName: string;
  scope: TipScope;
  source?: { quest?: number };
  createdAt: string;
  unread: boolean;
  cached?: { title?: string; bullets?: Array<{ title: string; summary?: string }> } | null;
};

export type PolicyTipState = {
  entries: TipEntry[];
  lastUnlockedId?: string | null;
  unlock: (e: { topicType: TipTopicType; topicName: string; scope: TipScope; source?: { quest?: number } }) => void;
  markRead: (id: string) => void;
  cacheTip: (id: string, cached: TipEntry["cached"]) => void;
  findById: (id: string) => TipEntry | undefined;
};

type UnlockInput = {
  topicType: TipTopicType;
  topicName: string;
  scope: TipScope;
  source?: { quest?: number };
};


type State = {
  entries: TipEntry[];
  lastUnlockedId?: string | null;
  unlock: (e: Omit<TipEntry, "createdAt" | "unread" | "id">) => void;
  markRead: (id: string) => void;
  cacheTip: (id: string, cached: TipEntry["cached"]) => void;
  unreadCount: () => number;
  list: () => TipEntry[];
  findById: (id: string) => TipEntry | undefined;
};

export const usePolicyTipStore = create<PolicyTipState>()(
  persist<PolicyTipState>(
    (set, get) => ({
      entries: [],
      lastUnlockedId: null,
      unlock: (e) => {
        const id = `${e.topicType}:${e.topicName}`;
        const exists = get().entries.some((x) => x.id === id);
        if (exists) {
          set({
            entries: get().entries.map((x) => (x.id === id ? { ...x, unread: true } : x)),
            lastUnlockedId: id,
          });
          return;
        }
        set({
          entries: [
            {
              ...e,
              id,
              createdAt: new Date().toISOString(),
              unread: true,
              cached: null,
            },
            ...get().entries,
          ],
          lastUnlockedId: id,
        });
      },
      markRead: (id) =>
        set({
          entries: get().entries.map((x) => (x.id === id ? { ...x, unread: false } : x)),
          lastUnlockedId: get().lastUnlockedId === id ? null : get().lastUnlockedId,
        }),
      cacheTip: (id, cached) =>
        set({ entries: get().entries.map((x) => (x.id === id ? { ...x, cached } : x)) }),
      findById: (id) => get().entries.find((x) => x.id === id),
    }),
    { name: "policy-tip-store", storage: createJSONStorage(() => localStorage), version: 1 }
  )
);