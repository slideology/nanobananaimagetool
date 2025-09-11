import { create } from "zustand";

interface UserStore {
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
  // 弹窗控制方法
  showRechargeDialog: (data?: UserStore['rechargeModalData']) => void;
  hideRechargeDialog: () => void;
}

export const useUser = create<UserStore>((set) => {
  return {
    user: void 0,
    credits: 0,
    // 充值弹窗初始状态
    showRechargeModal: false,
    rechargeModalData: undefined,
    setUser: (user) => set({ user: user ?? null }),
    clearUser: () => set({ user: null }),
    setCredits: (credits) => set({ credits }),
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
  };
});
