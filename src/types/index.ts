
export type SushiCategory = 
  | "box" 
  | "plateaux" 
  | "yakitori" 
  | "accompagnements" 
  | "desserts" 
  | "gunkan" 
  | "sashimi" 
  | "poke" 
  | "chirashi" 
  | "green" 
  | "nigiri" 
  | "signature" 
  | "temaki" 
  | "maki_wrap" 
  | "maki" 
  | "california" 
  | "crispy" 
  | "spring" 
  | "salmon" 
  | "boissons"
  | "box_du_midi"
  | "custom"
  | "poke_custom";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: SushiCategory;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  allergens?: string[];
  pieces?: number;
  prepTime?: number;
}

export interface MenuCategory {
  id: SushiCategory;
  name: string;
  description?: string;
  items: MenuItem[];
}

export interface DeliveryZone {
  name: string;
  available: boolean;
  minOrder?: number;
  deliveryFee?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  code?: string;
  discount: number;
  isPercentage: boolean;
  minOrder?: number;
  applicableCategories?: SushiCategory[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface OrderType {
  id: "delivery" | "pickup" | "dine-in";
  name: string;
  description: string;
  icon: string;
}

export interface UserAddress {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  additionalInfo?: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses: UserAddress[];
  loyaltyPoints: number;
  orders: Order[];
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  total: number;
  discount?: number;
  promoCode?: string;
  orderType: "delivery" | "pickup" | "dine-in";
  status: "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled";
  paymentMethod: "credit-card" | "cash" | "paypal";
  paymentStatus: "pending" | "paid" | "failed";
  deliveryAddress?: UserAddress;
  deliveryInstructions?: string;
  scheduledFor: Date;
  createdAt: Date;
  customerNotes?: string;
  pickupTime?: string;
  contactPreference?: string;
  allergies?: string[];
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}
