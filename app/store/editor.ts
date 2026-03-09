import { create } from "zustand";

interface EditorState {
    currentPrompt: string;
    currentReferenceImage: string; // URL 字符串
    currentMode: "text-to-image" | "image-to-image" | "image-to-video" | null;
    setEditorPayload: (
        payload: Partial<Omit<EditorState, "setEditorPayload" | "clearEditorPayload">>
    ) => void;
    clearEditorPayload: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    currentPrompt: "",
    currentReferenceImage: "",
    currentMode: null,
    setEditorPayload: (payload) => set((state) => ({ ...state, ...payload })),
    clearEditorPayload: () =>
        set({ currentPrompt: "", currentReferenceImage: "", currentMode: null }),
}));
