// v0.1.0 | 2026-11-26 | 全球保固頁的產品清單：讀 warranty_products（業務在 ERP 維護），快取 5 分鐘；ERP 修改時立即清除
// 表還沒建（014 未執行）或讀取失敗時，退回程式內建的清單（lib/globalWarrantyLists.ts），表單不會壞。
import 'server-only'
import { unstable_cache } from 'next/cache'
import { rest } from './supabaseRest'
import { GW_PRODUCTS } from './globalWarrantyLists'

export const GW_PRODUCTS_TAG = 'warranty-products'
export interface GwProduct { category: string; name: string }

async function load(): Promise<GwProduct[]> {
  try {
    const r = await rest<GwProduct[]>('warranty_products?select=name,category&on_sale=eq.true&order=sort.asc,name.asc')
    if (r.ok && Array.isArray(r.data)) return r.data
  } catch { /* 用內建清單 */ }
  return GW_PRODUCTS
}

/** 目前販售中的產品（表單選單與伺服器端檢查共用） */
export const getOnSaleProducts = unstable_cache(load, ['gw-products'], { revalidate: 300, tags: [GW_PRODUCTS_TAG] })
