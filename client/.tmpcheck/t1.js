"use strict";
import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBasket, Truck, Lock } from "lucide-react";
import { useCartStore } from "../store";
import { useThemeStore } from "../store";
import { SlideUp, containerVariants, itemVariants } from "../utils/animations";
import { formatPrice } from "../utils";
export const CartPage = () => {
  const theme = useThemeStore((s) => s.theme);
  const cart = useCartStore(theme);
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = cart();
  const navigate = useNavigate();
  const total = getTotalPrice();
  const FREE_SHIPPING_THRESHOLD = 2e4;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  if (items.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-dvh flex items-center justify-center px-4 py-16", children: /* @__PURE__ */ jsx("div", { className: "text-center px-4", children: /* @__PURE__ */ jsxs(SlideUp, { children: [
      /* @__PURE__ */ jsx("div", { className: "liquid-badge w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(ShoppingBasket, { size: 44, className: "text-primary" }) }),
      /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-extrabold tracking-tight text-dark mb-3", children: "Tu carrito est\xE1 vac\xEDo" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-8", children: "Agrega productos para comenzar tu compra" }),
      /* @__PURE__ */ jsx(Link, { to: "/products", className: "btn-liquid inline-block px-8 py-3", children: "Explorar Productos" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(SlideUp, { children: /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-dark mb-8", children: "Mi Carrito" }) }),
    /* @__PURE__ */ jsx(SlideUp, { delay: 0.05, children: /* @__PURE__ */ jsxs("div", { className: "glass-panel rounded-2xl sm:rounded-full px-5 py-3 mb-8 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Truck, { size: 18, className: "text-primary flex-shrink-0" }),
      missingForFreeShipping > 0 ? /* @__PURE__ */ jsxs("p", { className: "text-sm text-dark min-w-0 flex-1", children: [
        "Te faltan ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-primary-deep", children: formatPrice(missingForFreeShipping) }),
        " para el env\xEDo gratis"
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-primary-deep min-w-0 flex-1", children: "\xA1Tienes env\xEDo gratis en este pedido! \u{1F389}" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsx(
        motion.div,
        {
          variants: containerVariants,
          initial: "hidden",
          animate: "visible",
          className: "space-y-4",
          children: items.map((item) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              variants: itemVariants,
              layout: true,
              className: "glass-panel rounded-3xl p-5 flex flex-col sm:flex-row gap-5",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 bg-white/60 border border-white/70 rounded-2xl overflow-hidden flex items-center justify-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xl", children: item.emoji || "\u{1F6D2}" }),
                  item.image && /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: item.image,
                      alt: item.name,
                      className: "absolute inset-0 w-full h-full object-cover object-center",
                      onError: (e) => e.currentTarget.style.display = "none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-dark", children: item.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mb-2 line-clamp-1", children: item.description }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-primary-deep", children: formatPrice(item.price) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center sm:flex-col sm:items-end justify-between gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => removeItem(item.id),
                      className: "btn-liquid-ghost text-danger p-3 sm:p-2.5",
                      "aria-label": `Eliminar ${item.name}`,
                      children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "liquid-badge flex items-center rounded-full px-1", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => updateQuantity(item.id, Math.max(1, item.quantity - 1)),
                        className: "w-10 h-10 sm:w-9 sm:h-9 rounded-full hover:bg-white/70 transition flex items-center justify-center",
                        "aria-label": "Restar",
                        children: /* @__PURE__ */ jsx(Minus, { size: 15 })
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "px-3 font-bold text-dark text-sm", children: item.quantity }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => updateQuantity(item.id, item.quantity + 1),
                        className: "w-10 h-10 sm:w-9 sm:h-9 rounded-full hover:bg-white/70 transition flex items-center justify-center",
                        "aria-label": "Sumar",
                        children: /* @__PURE__ */ jsx(Plus, { size: 15 })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-dark", children: formatPrice(item.price * item.quantity) })
                ] })
              ]
            },
            item.id
          ))
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsx(SlideUp, { delay: 0.15, children: /* @__PURE__ */ jsxs("div", { className: "glass-strong rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-bold text-dark mb-6", children: "Resumen" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-6 border-b border-white/70 pb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-dark", children: [
            /* @__PURE__ */ jsx("span", { children: "Subtotal:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatPrice(total) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-dark", children: [
            /* @__PURE__ */ jsx("span", { children: "Impuesto (19%):" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatPrice(total * 0.19) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-2xl font-bold text-dark mb-6", children: [
          /* @__PURE__ */ jsx("span", { children: "Total:" }),
          /* @__PURE__ */ jsx("span", { className: "text-primary-deep", children: formatPrice(total * 1.19) })
        ] }),
        /* @__PURE__ */ jsxs(
          motion.button,
          {
            whileTap: { scale: 0.98 },
            onClick: () => navigate("/checkout"),
            className: "btn-liquid w-full py-3 mb-3 flex items-center justify-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Lock, { size: 16 }),
              "Proceder al Pago"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => navigate("/products"),
            className: "btn-liquid-ghost w-full py-3 mb-3 text-primary-deep",
            children: "Seguir Comprando"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: clearCart,
            className: "btn-liquid-ghost w-full text-danger text-sm py-2.5",
            children: "Vaciar Carrito"
          }
        )
      ] }) }) })
    ] })
  ] }) });
};
