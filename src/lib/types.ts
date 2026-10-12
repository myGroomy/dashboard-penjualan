// Tipe data baris CSV mentah
export interface RawRow {
  Product_ID: string
  Sale_Date: string
  Sales_Rep: string
  Region: string
  Sales_Amount: string
  Quantity_Sold: string
  Product_Category: string
  Unit_Cost: string
  Unit_Price: string
  Customer_Type: string
  Discount: string
  Payment_Method: string
  Sales_Channel: string
  Region_and_Sales_Rep: string
}

// Tipe data baris setelah dibersihkan
export interface SalesRow {
  productId: number
  saleDate: Date
  salesRep: string
  region: string
  salesAmount: number
  quantitySold: number
  productCategory: string
  unitCost: number
  unitPrice: number
  customerType: string
  discount: number
  paymentMethod: string
  salesChannel: string
  regionAndSalesRep: string
}

// State filter global
export interface FilterState {
  region: string
  category: string
  customerType: string
  channel: string
  dateStart: string
  dateEnd: string
}

// Ringkasan kualitas data
export interface DataQuality {
  totalRaw: number
  totalClean: number
  discarded: number
}

// Statistik deskriptif satu kolom
export interface DescStats {
  kolom: string
  count: number
  mean: number
  median: number
  modus: number
  min: number
  max: number
  stdDev: number
  q1: number
  q3: number
}
