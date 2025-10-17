import { eq, sql } from "drizzle-orm";
import { connectDB, schema } from "~/.server/libs/db";
import type { GuestCreditUsage, InsertGuestCreditUsage } from "~/.server/libs/db";

/**
 * 检查IP地址是否已使用过临时积分
 * @param ipAddress IP地址
 * @returns 使用记录或null
 */
export const getGuestCreditUsageByIP = async (ipAddress: string): Promise<GuestCreditUsage | null> => {
  const db = connectDB();
  
  const result = await db.query.guest_credit_usage.findFirst({
    where: eq(schema.guest_credit_usage.ip_address, ipAddress),
  });
  
  return result || null;
};

/**
 * 原子性检查并记录IP地址使用临时积分（防止竞态条件）
 * @param ipAddress IP地址
 * @param userAgent 用户代理字符串
 * @returns 是否成功记录（false表示IP已被使用）
 */
export const atomicCheckAndInsertGuestCreditUsage = async (
  ipAddress: string, 
  userAgent?: string
): Promise<boolean> => {
  const db = connectDB();
  
  try {
    // 🔒 并发安全：使用INSERT OR IGNORE确保原子性
    const insertData: InsertGuestCreditUsage = {
      ip_address: ipAddress,
      user_agent: userAgent || null,
      usage_count: 1,
    };
    
    const result = await db
      .insert(schema.guest_credit_usage)
      .values(insertData)
      .onConflictDoNothing() // 如果IP已存在，不执行插入
      .returning();
      
    // 如果返回结果为空，说明IP已被使用
    return result.length > 0;
  } catch (error) {
    console.error("Failed to insert guest credit usage:", error);
    return false;
  }
};

/**
 * 记录IP地址使用临时积分（兼容性方法）
 * @param ipAddress IP地址
 * @param userAgent 用户代理字符串
 * @returns 创建的记录
 */
export const insertGuestCreditUsage = async (
  ipAddress: string, 
  userAgent?: string
): Promise<GuestCreditUsage> => {
  const db = connectDB();
  
  const insertData: InsertGuestCreditUsage = {
    ip_address: ipAddress,
    user_agent: userAgent || null,
    usage_count: 1,
  };
  
  const [result] = await db
    .insert(schema.guest_credit_usage)
    .values(insertData)
    .returning();
    
  return result;
};

/**
 * 增加IP地址的使用次数
 * @param ipAddress IP地址
 * @returns 更新后的记录
 */
export const incrementGuestCreditUsage = async (ipAddress: string): Promise<GuestCreditUsage[]> => {
  const db = connectDB();
  
  return await db
    .update(schema.guest_credit_usage)
    .set({ 
      usage_count: sql`${schema.guest_credit_usage.usage_count} + 1`,
      used_at: new Date()
    })
    .where(eq(schema.guest_credit_usage.ip_address, ipAddress))
    .returning();
};

/**
 * 清理过期的临时积分使用记录（超过30天）
 * @returns 删除的记录数
 */
export const cleanupExpiredGuestCreditUsage = async (): Promise<number> => {
  const db = connectDB();
  
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  
  const result = await db
    .delete(schema.guest_credit_usage)
    .where(sql`${schema.guest_credit_usage.used_at} < ${thirtyDaysAgo}`)
    .returning();
    
  return result.length;
};

/**
 * 获取临时积分使用统计
 * @returns 统计信息
 */
export const getGuestCreditUsageStats = async () => {
  const db = connectDB();
  
  const totalUsageResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.guest_credit_usage);
    
  const todayUsageResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.guest_credit_usage)
    .where(sql`${schema.guest_credit_usage.used_at} >= strftime('%s', 'now', 'start of day')`);
  
  return {
    totalUsage: totalUsageResult[0].count,
    todayUsage: todayUsageResult[0].count,
  };
};