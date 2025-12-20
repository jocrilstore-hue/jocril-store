/**
 * Cart-related types
 */

export type { CartItem, Cart } from "@/lib/types";

/**
 * Cart action types (for potential future reducer pattern)
 */
export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<import("@/lib/types").CartItem, "totalPrice"> }
  | { type: "REMOVE_ITEM"; payload: { variantId: number } }
  | { type: "UPDATE_QUANTITY"; payload: { variantId: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: import("@/lib/types").Cart };
