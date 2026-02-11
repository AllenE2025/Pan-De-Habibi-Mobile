import { createRouter, createWebHistory } from "vue-router";
import POS from "../pages/POS.vue";
import Sales from "../pages/Sales.vue";
import Products from "../pages/Products.vue";

const routes = [
  {
    path: "/",
    name: "pos",
    component: POS,
    meta: { title: "POS" },
  },
  {
    path: "/sales",
    name: "sales",
    component: Sales,
    meta: { title: "Sales History" },
  },
  {
    path: "/products",
    name: "products",
    component: Products,
    meta: { title: "Products" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
