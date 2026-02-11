import { createApp } from "vue";
import "./assets/style.css";
import App from "./App.vue";
import router from "./router/index";
import { seedDatabase } from "./stores/db";

// Seed database on startup
seedDatabase().catch(console.error);

createApp(App).use(router).mount("#app");
