

## 🎯 第三方服务概览

### 已集成的第三方服务

| 服务类型 | 服务名称 | 状态 | 用途 |
|---------|---------|------|------|
| 分析工具 | Google Analytics | ✅ 已配置 | 网站流量分析 |
| 分析工具 | Microsoft Clarity | ✅ 已配置 | 用户行为分析 |
| 广告服务 | Google AdSense | ✅ 已配置 | 自动广告投放 |
| 广告服务 | 第三方广告网络 | ✅ 已配置 | 额外广告收入 |

---

## 📊 Google Analytics 配置



### 配置详情

#### 1. HTML 头部配置
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-KJPS3ZZYHC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-KJPS3ZZYHC');
</script>
```





### 使用的跟踪ID
- **主要ID**: `G-KJPS3ZZYHC` (在 index.html 中)


---

## 🎯 Google AdSense 配置

### 配置位置
- **主配置文件**: `frontend/index.html` (第7-8行)
- **组件文件**: `frontend/src/components/GoogleAdSenseBanner.tsx`
- **验证文件**: `frontend/public/ads.txt`

### 配置详情

#### 1. 自动广告配置
```html
<!-- Google AdSense Auto Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3179065211650247" crossorigin="anonymous"></script>
```

#### 2. AdSense 发布商ID
- **发布商ID**: `ca-pub-3179065211650247`
- **广告模式**: 自动广告 (Auto Ads)

#### 3. ads.txt 验证文件
**文件**: `frontend/public/ads.txt`
```
google.com, pub-3179065211650247, DIRECT, f08c47fec0942fa0
```

#### 4. React 组件
**文件**: `frontend/src/components/GoogleAdSenseBanner.tsx`
- 采用自动广告模式，组件返回 null
- AdSense 自动在页面适当位置插入广告

---

## 🔍 Microsoft Clarity 配置



### 配置详情

#### 1. Clarity 跟踪代码
```html
<!-- Microsoft Clarity Analytics -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "sun0y1p1i1");
</script>
```

#### 2. 项目ID
- **Clarity 项目ID**: `sun0y1p1i1`
- **用途**: 用户行为分析、热力图、会话录制

---

## 📢 第三方广告网络配置

### 配置位置
- **主配置文件**: `frontend/index.html` (第19行)

### 配置详情

#### 1. 第三方广告代码
```html
<!-- 第三方广告代码 -->
<script async="async" data-cfasync="false" src="//pl27453148.profitableratecpm.com/c2e95556903c6f4bc49bfefaac809241/invoke.js"></script>
```

#### 2. 广告网络信息
- **广告网络**: profitableratecpm.com
- **广告ID**: `c2e95556903c6f4bc49bfefaac809241`
- **加载方式**: 异步加载

---






  "网站域名": "https://nanobananaimage.org",
