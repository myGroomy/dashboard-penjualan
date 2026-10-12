import Papa from 'papaparse'
import type { RawRow, SalesRow, DataQuality } from './types'

// ===================== DATA PIPELINE =====================

/**
 * Muat dan bersihkan data CSV dari path publik
 * Mengembalikan data bersih dan ringkasan kualitas
 */
export async function loadData(
  csvUrl: string
): Promise<{ data: SalesRow[]; quality: DataQuality }> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, quality } = cleanData(results.data)
        resolve({ data, quality })
      },
      error: (err) => reject(err),
    })
  })
}

/**
 * Muat dari File object (fallback upload CSV)
 */
export async function loadFromFile(
  file: File
): Promise<{ data: SalesRow[]; quality: DataQuality }> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, quality } = cleanData(results.data)
        resolve({ data, quality })
      },
      error: (err) => reject(err),
    })
  })
}

/**
 * Bersihkan data mentah: trim, konversi tipe, hapus baris tidak valid & duplikat
 */
function cleanData(rows: RawRow[]): { data: SalesRow[]; quality: DataQuality } {
  const totalRaw = rows.length
  const seen = new Set<string>()
  const clean: SalesRow[] = []

  for (const r of rows) {
    // Trim semua field string
    const id       = parseInt(r.Product_ID?.trim(), 10)
    const dateStr  = r.Sale_Date?.trim()
    const rep      = r.Sales_Rep?.trim()
    const region   = r.Region?.trim()
    const amount   = parseFloat(r.Sales_Amount?.trim())
    const qty      = parseInt(r.Quantity_Sold?.trim(), 10)
    const category = r.Product_Category?.trim()
    const cost     = parseFloat(r.Unit_Cost?.trim())
    const price    = parseFloat(r.Unit_Price?.trim())
    const custType = r.Customer_Type?.trim()
    const discount = parseFloat(r.Discount?.trim())
    const payment  = r.Payment_Method?.trim()
    const channel  = r.Sales_Channel?.trim()
    const regRep   = r.Region_and_Sales_Rep?.trim()

    // Lewati baris dengan nilai kritis kosong atau tidak valid
    if (
      isNaN(id) || !dateStr || !rep || !region ||
      isNaN(amount) || isNaN(qty) || !category
    ) continue

    // Parse tanggal format YYYY-MM-DD
    const saleDate = new Date(dateStr)
    if (isNaN(saleDate.getTime())) continue

    // Hapus duplikat berdasarkan kombinasi kunci unik
    const key = `${id}-${dateStr}-${rep}-${amount}`
    if (seen.has(key)) continue
    seen.add(key)

    clean.push({
      productId: id,
      saleDate,
      salesRep: rep,
      region,
      salesAmount: amount,
      quantitySold: qty,
      productCategory: category,
      unitCost: isNaN(cost) ? 0 : cost,
      unitPrice: isNaN(price) ? 0 : price,
      customerType: custType || 'Unknown',
      discount: isNaN(discount) ? 0 : discount,
      paymentMethod: payment || 'Unknown',
      salesChannel: channel || 'Unknown',
      regionAndSalesRep: regRep || `${region}-${rep}`,
    })
  }

  return {
    data: clean,
    quality: { totalRaw, totalClean: clean.length, discarded: totalRaw - clean.length },
  }
}
