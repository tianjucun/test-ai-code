import { Request, Response, NextFunction } from 'express'

// 简单的内存缓存
interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5分钟

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const cache = new SimpleCache()

// 中间件函数
export const cacheMiddleware = (ttl: number = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next()
    }

    const key = `${req.method}-${req.originalUrl}`
    const cachedData = cache.get(key)

    if (cachedData) {
      res.set('X-Cache', 'HIT')
      return res.json(cachedData)
    }

    // 拦截res.json来缓存响应
    const originalJson = res.json
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(key, data, ttl)
        res.set('X-Cache', 'MISS')
      }
      return originalJson.call(this, data)
    }

    next()
  }
}

// 健康检查路由缓存（短时间缓存）
export const healthCache = cacheMiddleware(30 * 1000) // 30秒

// AI模型列表缓存（长时间缓存）
export const modelCache = cacheMiddleware(30 * 60 * 1000) // 30分钟

// 定期清理过期缓存
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000) // 每5分钟清理一次