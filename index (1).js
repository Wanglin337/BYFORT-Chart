// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  transactions;
  notifications;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.transactions = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
    this.initializeDemoData();
  }
  initializeDemoData() {
    const demoUser = {
      id: "demo-user-1",
      phoneNumber: "8123456789",
      pin: "123456",
      // In real app, this would be hashed
      name: "Demo User",
      balance: 125e3,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(demoUser.id, demoUser);
    const demoTransaction = {
      id: "demo-txn-1",
      userId: "demo-user-1",
      type: "topup",
      amount: 48800,
      originalAmount: 5e4,
      adminFee: 1200,
      status: "pending",
      recipientPhone: null,
      recipientName: null,
      bankName: "BCA",
      accountNumber: "1234567890",
      senderName: "Demo User",
      proofImageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      notes: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.transactions.set(demoTransaction.id, demoTransaction);
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByPhone(phoneNumber) {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      balance: 0,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUserBalance(userId, newBalance) {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
    }
  }
  async verifyPin(phoneNumber, pin) {
    const user = await this.getUserByPhone(phoneNumber);
    if (user && user.pin === pin) {
      return user;
    }
    return null;
  }
  async createTransaction(insertTransaction) {
    const id = randomUUID();
    const transaction = {
      id,
      type: insertTransaction.type,
      status: insertTransaction.status || "pending",
      userId: insertTransaction.userId,
      amount: insertTransaction.amount,
      originalAmount: insertTransaction.originalAmount,
      adminFee: insertTransaction.adminFee,
      recipientPhone: insertTransaction.recipientPhone || null,
      recipientName: insertTransaction.recipientName || null,
      bankName: insertTransaction.bankName || null,
      accountNumber: insertTransaction.accountNumber || null,
      senderName: insertTransaction.senderName || null,
      proofImageUrl: insertTransaction.proofImageUrl || null,
      notes: insertTransaction.notes || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  async getTransactionsByUser(userId) {
    return Array.from(this.transactions.values()).filter((txn) => txn.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getPendingTransactions() {
    return Array.from(this.transactions.values()).filter((txn) => txn.status === "pending").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async updateTransactionStatus(transactionId, status) {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = /* @__PURE__ */ new Date();
      this.transactions.set(transactionId, transaction);
      return transaction;
    }
    return void 0;
  }
  async getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }
  async createNotification(insertNotification) {
    const id = randomUUID();
    const notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  async getUserNotifications(userId) {
    return Array.from(this.notifications.values()).filter((notif) => notif.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async markNotificationAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
    }
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async getTotalVolume() {
    return Array.from(this.transactions.values()).filter((txn) => txn.status === "approved").reduce((total, txn) => total + txn.amount, 0);
  }
};
var storage = new MemStorage();

// server/routes.ts
import { z as z2 } from "zod";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  pin: text("pin").notNull(),
  name: text("name").notNull(),
  balance: integer("balance").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  // 'topup', 'withdraw', 'send', 'receive'
  amount: integer("amount").notNull(),
  originalAmount: integer("original_amount").notNull(),
  adminFee: integer("admin_fee").notNull().default(1200),
  status: text("status").notNull().default("pending"),
  // 'pending', 'approved', 'rejected'
  recipientPhone: text("recipient_phone"),
  recipientName: text("recipient_name"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  senderName: text("sender_name"),
  proofImageUrl: text("proof_image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var insertUserSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  pin: true,
  name: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});
var loginSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor HP tidak valid"),
  pin: z.string().length(6, "PIN harus 6 digit")
});
var createPinSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor HP tidak valid"),
  pin: z.string().length(6, "PIN harus 6 digit"),
  name: z.string().min(2, "Nama minimal 2 karakter")
});
var topUpSchema = z.object({
  senderName: z.string().min(2, "Nama pengirim wajib diisi"),
  bankName: z.string().min(1, "Pilih bank/e-wallet"),
  accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  originalAmount: z.number().min(12e3, "Minimal top up Rp 12.000").max(1e7, "Maksimal top up Rp 10.000.000"),
  proofImageUrl: z.string().min(1, "Upload bukti transfer")
});
var withdrawSchema = z.object({
  recipientName: z.string().min(2, "Nama penerima wajib diisi"),
  bankName: z.string().min(1, "Pilih bank/e-wallet"),
  accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  originalAmount: z.number().min(55e3, "Minimal penarikan Rp 55.000").max(1e7, "Maksimal penarikan Rp 10.000.000")
});
var sendMoneySchema = z.object({
  recipientPhone: z.string().min(10, "Nomor HP tidak valid"),
  originalAmount: z.number().min(1e4, "Minimal kirim Rp 10.000").max(1e7, "Maksimal kirim Rp 10.000.000"),
  notes: z.string().optional()
});

// server/routes.ts
import multer from "multer";
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, pin } = loginSchema.parse(req.body);
      const user = await storage.verifyPin(phoneNumber, pin);
      if (!user) {
        return res.status(401).json({ message: "Nomor HP atau PIN salah" });
      }
      res.json({
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          balance: user.balance
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { phoneNumber, pin, name } = createPinSchema.parse(req.body);
      const existingUser = await storage.getUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Nomor HP sudah terdaftar" });
      }
      const user = await storage.createUser({
        phoneNumber,
        pin,
        // In production, hash this
        name
      });
      res.json({
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          balance: user.balance
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/auth/check-user", async (req, res) => {
    try {
      const { phoneNumber } = z2.object({ phoneNumber: z2.string() }).parse(req.body);
      const user = await storage.getUserByPhone(phoneNumber);
      res.json({ exists: !!user });
    } catch (error) {
      res.status(400).json({ message: "Nomor HP tidak valid" });
    }
  });
  app2.get("/api/user/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
      res.json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        balance: user.balance
      });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/transactions/topup", upload.single("proofImage"), async (req, res) => {
    try {
      const { userId, senderName, bankName, accountNumber, originalAmount } = topUpSchema.extend({
        userId: z2.string()
      }).parse({
        ...req.body,
        originalAmount: parseInt(req.body.originalAmount)
      });
      if (!req.file) {
        return res.status(400).json({ message: "Upload bukti transfer wajib" });
      }
      const proofImageUrl = `/uploads/${req.file.filename}`;
      const adminFee = 1200;
      const amount = originalAmount - adminFee;
      const transaction = await storage.createTransaction({
        userId,
        type: "topup",
        amount,
        originalAmount,
        adminFee,
        status: "pending",
        recipientPhone: null,
        recipientName: null,
        bankName,
        accountNumber,
        senderName,
        proofImageUrl,
        notes: null
      });
      res.json(transaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/transactions/withdraw", async (req, res) => {
    try {
      const { userId, recipientName, bankName, accountNumber, originalAmount } = withdrawSchema.extend({
        userId: z2.string()
      }).parse({
        ...req.body,
        originalAmount: parseInt(req.body.originalAmount)
      });
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
      const adminFee = 1200;
      const totalAmount = originalAmount + adminFee;
      if (user.balance < totalAmount) {
        return res.status(400).json({ message: "Saldo tidak mencukupi" });
      }
      await storage.updateUserBalance(userId, user.balance - totalAmount);
      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        amount: originalAmount,
        originalAmount,
        adminFee,
        status: "pending",
        recipientPhone: null,
        recipientName,
        bankName,
        accountNumber,
        senderName: null,
        proofImageUrl: null,
        notes: null
      });
      res.json(transaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/transactions/send", async (req, res) => {
    try {
      const { userId, recipientPhone, originalAmount, notes } = sendMoneySchema.extend({
        userId: z2.string()
      }).parse({
        ...req.body,
        originalAmount: parseInt(req.body.originalAmount)
      });
      const sender = await storage.getUser(userId);
      if (!sender) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
      const recipient = await storage.getUserByPhone(recipientPhone);
      if (!recipient) {
        return res.status(404).json({ message: "Penerima tidak terdaftar di BYFORT" });
      }
      if (sender.id === recipient.id) {
        return res.status(400).json({ message: "Tidak bisa mengirim ke diri sendiri" });
      }
      const adminFee = 1200;
      const totalAmount = originalAmount + adminFee;
      if (sender.balance < totalAmount) {
        return res.status(400).json({ message: "Saldo tidak mencukupi" });
      }
      await storage.updateUserBalance(sender.id, sender.balance - totalAmount);
      await storage.updateUserBalance(recipient.id, recipient.balance + originalAmount);
      const senderTransaction = await storage.createTransaction({
        userId: sender.id,
        type: "send",
        amount: -originalAmount,
        originalAmount,
        adminFee,
        status: "approved",
        recipientPhone,
        recipientName: recipient.name,
        bankName: null,
        accountNumber: null,
        senderName: null,
        proofImageUrl: null,
        notes: notes || null
      });
      await storage.createTransaction({
        userId: recipient.id,
        type: "receive",
        amount: originalAmount,
        originalAmount,
        adminFee: 0,
        status: "approved",
        recipientPhone: null,
        recipientName: null,
        bankName: null,
        accountNumber: null,
        senderName: sender.name,
        proofImageUrl: null,
        notes: notes || null
      });
      await storage.createNotification({
        userId: recipient.id,
        title: "Saldo Masuk",
        message: `Anda menerima Rp ${originalAmount.toLocaleString()} dari ${sender.name}`
      });
      res.json(senderTransaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions2 = await storage.getTransactionsByUser(req.params.userId);
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.get("/api/admin/transactions/pending", async (req, res) => {
    try {
      const transactions2 = await storage.getPendingTransactions();
      const transactionsWithUsers = await Promise.all(
        transactions2.map(async (txn) => {
          const user = await storage.getUser(txn.userId);
          return {
            ...txn,
            user: user ? {
              name: user.name,
              phoneNumber: user.phoneNumber
            } : null
          };
        })
      );
      res.json(transactionsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/admin/transactions/:transactionId/approve", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }
      await storage.updateTransactionStatus(transaction.id, "approved");
      if (transaction.type === "topup") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          await storage.updateUserBalance(user.id, user.balance + transaction.amount);
        }
      }
      await storage.createNotification({
        userId: transaction.userId,
        title: "Transaksi Disetujui",
        message: `${transaction.type === "topup" ? "Top up" : "Penarikan"} sebesar Rp ${transaction.originalAmount.toLocaleString()} telah disetujui`
      });
      res.json({ message: "Transaksi berhasil disetujui" });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.post("/api/admin/transactions/:transactionId/reject", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }
      await storage.updateTransactionStatus(transaction.id, "rejected");
      if (transaction.type === "withdraw") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const returnAmount = transaction.originalAmount + transaction.adminFee;
          await storage.updateUserBalance(user.id, user.balance + returnAmount);
        }
      }
      await storage.createNotification({
        userId: transaction.userId,
        title: "Transaksi Ditolak",
        message: `${transaction.type === "topup" ? "Top up" : "Penarikan"} sebesar Rp ${transaction.originalAmount.toLocaleString()} ditolak`
      });
      res.json({ message: "Transaksi berhasil ditolak" });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.get("/api/admin/stats", async (req, res) => {
    try {
      const pendingTransactions = await storage.getPendingTransactions();
      const allUsers = await storage.getAllUsers();
      const totalVolume = await storage.getTotalVolume();
      res.json({
        pendingCount: pendingTransactions.length,
        totalUsers: allUsers.length,
        totalVolume
      });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications2 = await storage.getUserNotifications(req.params.userId);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  });
  app2.use("/uploads", (await import("express")).static("uploads"));
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
