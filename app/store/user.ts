import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserInfo } from "~/.server/schema/user";

export interface UserStore {
  user?: UserInfo | null;
  credits: number;
  // 充值弹窗控制状态
  showRechargeModal: boolean;
  rechargeModalData?: {
    currentCredits: number;
    requiredCredits?: number;
    trigger?: string; // 触发弹窗的操作标识
  };
  setUser: (user: UserInfo | null) => void;
  clearUser: () => void;
  setCredits: (credits: number) => void;
  updateUser: (user: Partial<UserInfo>) => void;

  // 简化的总积分计算，现在只有登录用户的积分
  getTotalCredits: () => number;
  // 弹窗控制方法
  showRechargeDialog: (data?: Omit<NonNullable<UserStore['rechargeModalData']>, "currentCredits">) => void;
  hideRechargeDialog: () => void;
}

export const useUser = create<UserStore>()(
  persist(
    (set, get) => ({
      user: void 0,
      credits: 0,
      // 充值弹窗初始状态
      showRechargeModal: false,
      rechargeModalData: undefined,

      setUser: (user) => set({ user: user ?? null }),
      clearUser: () => set({ user: null }),
      setCredits: (credits: number) => set({ credits }),
      updateUser: (user: Partial<UserInfo>) => set((state) => ({
        user: state.user ? { ...state.user, ...user } : state.user
      })),

      // 简化的总积分计算
      getTotalCredits: () => {
        const state = get();
        // 如果用户已登录，返回持久积分；否则返回0
        return state.user ? state.credits : 0;
      },

      // 弹窗控制方法实现
      showRechargeDialog: (data) => set({
        showRechargeModal: true,
        rechargeModalData: {
          currentCredits: 0,
          ...data
        }
      }),
      hideRechargeDialog: () => set({
        showRechargeModal: false,
        rechargeModalData: undefined
      }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, credits: state.credits }),
    }
  )
);
