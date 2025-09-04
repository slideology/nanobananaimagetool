# 图片生成流程监控系统使用指南

## 概述

本监控系统为图片生成流程的七个关键步骤提供了完整的日志监控功能，帮助开发者快速定位问题和优化性能。

## 监控的七个步骤

1. **📱 前端数据收集** - 用户上传图片和选择发型
2. **🔗 后端API接收** - 服务器接收前端请求
3. **⚙️ 业务逻辑处理** - 数据验证和任务创建
4. **🤖 Kie AI调用** - 调用AI服务进行图片处理
5. **🔄 异步回调处理** - 处理AI服务的回调结果
6. **⏱️ 前端状态轮询** - 前端查询任务状态
7. **✅ 结果返回** - 向用户展示处理结果

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动快速监控

```bash
# 启动带监控的开发服务器
pnpm run monitor
```

这将启动开发服务器并实时显示彩色的日志输出，方便开发调试。

### 3. 启动详细监控

```bash
# 启动详细的监控分析
pnpm run monitor:detailed
```

这将启动更详细的监控脚本，提供性能分析和错误统计功能。

## 监控脚本说明

### 快速监控脚本 (`scripts/quick-monitor.mjs`)

**功能特点：**
- 🎨 彩色输出，不同步骤使用不同颜色
- ⚡ 自动启动开发服务器
- 📊 显示任务状态、进度和耗时
- 🔍 实时监控所有日志输出

**使用场景：**
- 日常开发调试
- 快速查看流程状态
- 问题初步排查

### 详细监控脚本 (`scripts/monitor-image-generation.ts`)

**功能特点：**
- 📈 性能统计分析
- 🔍 错误检查和分类
- 📊 流程完整性分析
- 💾 支持数据导出

**使用场景：**
- 性能优化分析
- 深度问题排查
- 生产环境监控
- 数据分析报告

## 日志格式说明

### 标准日志格式

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "step": "frontend_data_collection",
  "action": "start",
  "message": "用户开始上传图片",
  "data": {
    "taskId": "task_123",
    "userId": "user_456",
    "fileSize": 1024000
  },
  "requestId": "req_789"
}
```

### 字段说明

- **timestamp**: 日志时间戳
- **step**: 所属步骤（七个步骤之一）
- **action**: 操作类型（start/update/complete/error）
- **message**: 日志消息
- **data**: 相关数据（任务ID、状态、进度等）
- **requestId**: 请求唯一标识

## 监控配置

### 前端监控配置

在 `app/utils/frontend-logger.ts` 中可以配置：

```typescript
// 是否启用监控
const MONITORING_ENABLED = true;

// 日志级别
const LOG_LEVEL = 'info'; // debug | info | warn | error

// 轮询监控间隔
const POLLING_INTERVAL = 2000; // 毫秒
```

### 后端监控配置

在各个Logger类中可以配置不同的监控参数：

```typescript
// API接收监控
ApiReceptionLogger.configure({
  logRequestDetails: true,
  logResponseTime: true
});

// 业务逻辑监控
BusinessLogicLogger.configure({
  logValidationSteps: true,
  logDatabaseOperations: true
});
```

## 常见问题排查

### 1. 监控脚本无法启动

**问题**: 运行 `pnpm run monitor` 时报错

**解决方案**:
```bash
# 检查依赖是否安装
pnpm install

# 检查chalk依赖
pnpm list chalk

# 重新安装依赖
pnpm install chalk
```

### 2. 日志输出不完整

**问题**: 某些步骤的日志没有显示

**解决方案**:
1. 检查对应Logger类是否正确导入
2. 确认日志级别配置
3. 查看控制台是否有错误信息

### 3. 性能监控数据异常

**问题**: 耗时统计不准确

**解决方案**:
1. 确认系统时间同步
2. 检查requestId是否正确传递
3. 验证开始和结束日志是否配对

## 最佳实践

### 1. 开发环境

- 使用快速监控脚本进行日常开发
- 保持监控脚本运行，及时发现问题
- 定期查看错误日志，优化代码质量

### 2. 测试环境

- 使用详细监控脚本进行性能测试
- 收集完整的流程数据
- 分析瓶颈和优化点

### 3. 生产环境

- 配置适当的日志级别（warn/error）
- 设置日志轮转和清理策略
- 建立告警机制

## 扩展功能

### 1. 自定义监控步骤

可以根据业务需要添加新的监控步骤：

```typescript
// 创建新的Logger类
export class CustomStepLogger {
  static logCustomAction(data: any, requestId: string) {
    Logger.info(
      '自定义步骤执行',
      'custom_step',
      { action: 'execute', data },
      requestId
    );
  }
}
```

### 2. 集成外部监控系统

可以将日志数据发送到外部监控系统：

```typescript
// 发送到监控平台
function sendToMonitoring(logData: any) {
  // 集成Datadog、New Relic等
}
```

## 技术支持

如果在使用监控系统时遇到问题，请：

1. 查看本文档的常见问题部分
2. 检查控制台错误信息
3. 查看相关Logger类的实现
4. 联系开发团队获取支持

---

**更新时间**: 2024年1月20日  
**版本**: v1.0.0