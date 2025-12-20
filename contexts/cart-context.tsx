"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { CartItem, Cart } from "@/lib/types";
import { MAX_CART_QUANTITY, STORAGE_CART_KEY } from "@/lib/constants";
import { logger } from "@/lib/logger";

interface CartContextType {
  cart: Cart;
  addToCart: (item: Omit<CartItem, "totalPrice">) => void;
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (variantId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const defaultCart: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(defaultCart);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(STORAGE_CART_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        logger.error("Failed to parse cart from localStorage", { error: e });
      }
    }
  }, []);

  const hasHydrated = useRef(false);

  useEffect(() => {
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const calculateTotals = (
    items: CartItem[],
  ): { totalItems: number; totalPrice: number } => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return { totalItems, totalPrice };
  };

  const addToCart = (item: Omit<CartItem, "totalPrice">) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (i) => i.variantId === item.variantId,
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...prevCart.items];
        const existingItem = newItems[existingItemIndex];
        if (existingItem) {
          const newQuantity = Math.min(
            existingItem.quantity + item.quantity,
            MAX_CART_QUANTITY,
          );
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
      } else {
        // Add new item
        const newItem: CartItem = {
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        };
        newItems = [...prevCart.items, newItem];
      }

      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  };

  const removeFromCart = (variantId: number) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => item.variantId !== variantId,
      );
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => {
        if (item.variantId === variantId) {
          const newQuantity = Math.min(quantity, MAX_CART_QUANTITY);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
        return item;
      });
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  };

  const getItemQuantity = (variantId: number): number => {
    const item = cart.items.find((i) => i.variantId === variantId);
    return item?.quantity || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
