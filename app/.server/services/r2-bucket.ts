/**
 * R2存储桶服务 - 用于上传和下载文件到Cloudflare R2存储
 */

/**
 * 上传文件到R2存储桶
 * @param env - Cloudflare环境变量
 * @param files - 要上传的文件（单个文件或文件数组）
 * @param folder - 存储文件夹名称，默认为"cache"
 * @returns 上传结果数组
 */
export async function uploadFiles(env: Env, files: File | File[], folder = "cache") {
  const fileList = Array.isArray(files) ? Array.from(files) : [files];

  const uploadPromises = fileList.map((file) => {
    const path = `${folder}/${file.name}`;
    return env.R2.put(path, file);
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((result) => !!result);
}

/**
 * 从URL下载文件并存储到R2存储桶
 * @param env - Cloudflare环境变量
 * @param files - 包含文件信息的数组（源URL、文件名、扩展名）
 * @param type - 文件类型/分类
 * @returns 下载和存储结果数组
 */
export async function downloadFilesToBucket(
  env: Env,
  files: { src: string; fileName: string; ext: string }[],
  type: string
) {
  const results = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(file.src);
      const blob = await response.blob();
      if (!blob) return null;

      const path = `${type}/${file.fileName}.${file.ext}`;
      return env.R2.put(path, blob);
    })
  );

  return results.filter((result) => !!result);
}

/**
 * 从R2存储桶获取文件
 * @param env - Cloudflare环境变量
 * @param key - 文件在R2中的键值/路径
 * @returns 文件对象或null（如果文件不存在）
 */
export async function getFile(env: Env, key: string) {
  const file = await env.R2.get(key);
  if (!file) return null;
  const blob = await file.blob();
  const fileName = file.key.split("/").pop()!;

  return new File([blob], fileName);
}
