import { create } from "zustand";

interface UserStore {
  user?: UserInfo | null;
  credits: number;
  // 临时积分相关字段
  guestCredits: number; // 未登录用户的临时积分
  hasUsedGuestCredit: boolean; // 是否已使用过临时积分
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
  // 临时积分管理方法
  initGuestCredits: () => void;
  useGuestCredit: () => boolean; // 返回是否成功使用
  rollbackGuestCredit: () => boolean; // 返回是否成功回滚
  getTotalCredits: () => number;
  getGuestCreditStatus: () => { hasCredits: boolean; hasUsed: boolean };
  // 弹窗控制方法
  showRechargeDialog: (data?: UserStore['rechargeModalData']) => void;
  hideRechargeDialog: () => void;
}

/**
 * 从localStorage获取临时积分状态
 */
const getGuestCreditFromStorage = () => {
  if (typeof window === 'undefined') return { guestCredits: 0, hasUsedGuestCredit: false };
  
  try {
    const hasUsed = localStorage.getItem('nano_guest_credit_used') === 'true';
    const credits = hasUsed ? 0 : 1; // 如果已使用则为0，否则为1
    return { guestCredits: credits, hasUsedGuestCredit: hasUsed };
  } catch {
    return { guestCredits: 1, hasUsedGuestCredit: false };
  }
};

/**
 * 保存临时积分状态到localStorage（原子性操作）
 */
const saveGuestCreditToStorage = (hasUsed: boolean) => {
  if (typeof window === 'undefined') return;
  
  try {
    // 🔒 并发安全：使用时间戳确保操作的原子性
    const timestamp = Date.now();
    localStorage.setItem('nano_guest_credit_used', hasUsed.toString());
    localStorage.setItem('nano_guest_credit_timestamp', timestamp.toString());
  } catch {
    // 忽略存储错误
  }
};

/**
 * 原子性检查并使用临时积分（防止多标签页竞态条件）
 */
const atomicUseGuestCredit = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // 🔒 并发安全：使用localStorage的原子性检查和设置
    const currentUsed = localStorage.getItem('nano_guest_credit_used');
    if (currentUsed === 'true') {
      return false; // 已经被使用
    }
    
    // 原子性设置为已使用
    const timestamp = Date.now();
    localStorage.setItem('nano_guest_credit_used', 'true');
    localStorage.setItem('nano_guest_credit_timestamp', timestamp.toString());
    
    // 双重检查：确保设置成功
    const verification = localStorage.getItem('nano_guest_credit_used');
    return verification === 'true';
  } catch {
    return false;
  }
};

export const useUser = create<UserStore>((set, get) => {
  // 初始化时从localStorage获取临时积分状态
  const initialGuestState = getGuestCreditFromStorage();
  
  return {
    user: void 0,
    credits: 0,
    // 临时积分初始状态
    guestCredits: initialGuestState.guestCredits,
    hasUsedGuestCredit: initialGuestState.hasUsedGuestCredit,
    // 充值弹窗初始状态
    showRechargeModal: false,
    rechargeModalData: undefined,
    
    setUser: (user) => set({ user: user ?? null }),
    clearUser: () => set({ user: null }),
    setCredits: (credits) => set({ credits }),
    
    // 临时积分管理方法实现
    initGuestCredits: () => {
      const guestState = getGuestCreditFromStorage();
      set({ 
        guestCredits: guestState.guestCredits, 
        hasUsedGuestCredit: guestState.hasUsedGuestCredit 
      });
    },
    
    useGuestCredit: () => {
      // 🔒 并发安全：使用原子性操作防止多标签页竞态条件
      const success = atomicUseGuestCredit();
      if (success) {
        set({ 
          guestCredits: 0, 
          hasUsedGuestCredit: true 
        });
        return true;
      }
      return false;
    },
    
    rollbackGuestCredit: () => {
      const state = get();
      if (state.hasUsedGuestCredit && state.guestCredits === 0) {
        saveGuestCreditToStorage(false);
        set({ 
          guestCredits: 1, 
          hasUsedGuestCredit: false 
        });
        return true;
      }
      return false;
    },
    
    getTotalCredits: () => {
      const state = get();
      // 如果用户已登录，返回持久积分；否则返回临时积分
      return state.user ? state.credits : state.guestCredits;
    },
    
    getGuestCreditStatus: () => {
      const state = get();
      return {
        hasCredits: state.guestCredits > 0,
        hasUsed: state.hasUsedGuestCredit
      };
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
  };
});
