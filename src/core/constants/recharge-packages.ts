export const RECHARGE_PACKAGES = [
  { id: "pkg-5",  hours: 5,  price: 280, label: "Basico",        popular: false },
  { id: "pkg-10", hours: 10, price: 520, label: "Intermediario", popular: true  },
  { id: "pkg-20", hours: 20, price: 960, label: "Premium",       popular: false },
] as const

export type RechargePackage = (typeof RECHARGE_PACKAGES)[number]
