const MOCK_BROKERS = [
  { id: "b1", username: "Alice Namuli", email: "alice@example.com", phoneNumber: "+256701234567", brokerCode: "BRK-001", subscriptionTier: "fibrous", isVerified: true, isEmailVerified: true, isPhoneVerified: true, location: "Kampala", lastLogin: "2026-07-17T08:30:00Z", createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-07-17T08:30:00Z", isActive: true, isDeleted: false, walletBalance: 1250000, title: "Premium Property Consultant" },
  { id: "b2", username: "Brian Ochieng", email: "brian@example.com", phoneNumber: "+256702345678", brokerCode: "BRK-002", subscriptionTier: "buttress", isVerified: true, isEmailVerified: true, isPhoneVerified: false, location: "Entebbe", lastLogin: "2026-07-16T14:20:00Z", createdAt: "2026-02-20T09:00:00Z", updatedAt: "2026-07-16T14:20:00Z", isActive: true, isDeleted: false, walletBalance: 840000, title: "Residential Specialist" },
  { id: "b3", username: "Carol Atim", email: "carol@example.com", phoneNumber: "+256703456789", brokerCode: "BRK-003", subscriptionTier: "prop", isVerified: false, isEmailVerified: true, isPhoneVerified: true, location: "Jinja", lastLogin: "2026-07-15T11:45:00Z", createdAt: "2026-06-01T07:30:00Z", updatedAt: "2026-07-15T11:45:00Z", isActive: true, isDeleted: false, walletBalance: 120000, title: "New Broker" },
  { id: "b4", username: "David Ssempala", email: "david@example.com", phoneNumber: "+256704567890", brokerCode: "BRK-004", subscriptionTier: "fibrous", isVerified: true, isEmailVerified: true, isPhoneVerified: true, location: "Kampala", lastLogin: "2026-07-18T06:00:00Z", createdAt: "2025-11-10T08:00:00Z", updatedAt: "2026-07-18T06:00:00Z", isActive: true, isDeleted: false, walletBalance: 2100000, title: "Commercial Expert" },
  { id: "b5", username: "Eva Nakato", email: "eva@example.com", phoneNumber: "+256705678901", brokerCode: "BRK-005", subscriptionTier: "buttress", isVerified: true, isEmailVerified: true, isPhoneVerified: true, location: "Mbarara", lastLogin: "2026-07-14T09:15:00Z", createdAt: "2025-09-05T10:30:00Z", updatedAt: "2026-07-14T09:15:00Z", isActive: true, isDeleted: false, walletBalance: 5600000, title: "Luxury Property Advisor" },
];

const MOCK_PROPERTIES = [
  { id: "p1", title: "2BR Apartment in Kololo", description: "Modern apartment with pool", propertyType: "apartment", imageUrl: ["/images.jpg"], videoUrl: [], location: "Kololo, Kampala", brokersUniqueCode: "BRK-001", isAvailable: true, createdAt: "2026-01-20T10:00:00Z", photoCount: 8, videoCount: 1, brokerTier: "fibrous", maxPhotos: 25, maxVideos: 2 },
  { id: "p2", title: "3BR Villa in Muyenga", description: "Spacious family villa", propertyType: "villa", imageUrl: ["/images-1.jpg"], videoUrl: [], location: "Muyenga, Kampala", brokersUniqueCode: "BRK-002", isAvailable: true, createdAt: "2026-03-15T10:00:00Z", photoCount: 12, videoCount: 0, brokerTier: "buttress", maxPhotos: 50, maxVideos: 4 },
  { id: "p3", title: "Office Space in CBD", description: "Prime office location", propertyType: "commercial", imageUrl: ["/images-2.jpg"], videoUrl: [], location: "CBD, Kampala", brokersUniqueCode: "BRK-004", isAvailable: false, createdAt: "2026-05-10T10:00:00Z", photoCount: 5, videoCount: 2, brokerTier: "fibrous", maxPhotos: 25, maxVideos: 2 },
  { id: "p4", title: "Land Plot in Kira", description: "Residential land for sale", propertyType: "land", imageUrl: ["/images.jpg"], videoUrl: [], location: "Kira, Wakiso", brokersUniqueCode: "BRK-001", isAvailable: true, createdAt: "2026-06-22T10:00:00Z", photoCount: 4, videoCount: 0, brokerTier: "fibrous", maxPhotos: 25, maxVideos: 2 },
  { id: "p5", title: "1BR Studio in Ntinda", description: "Cozy studio apartment", propertyType: "apartment", imageUrl: ["/images-1.jpg"], videoUrl: [], location: "Ntinda, Kampala", brokersUniqueCode: "BRK-003", isAvailable: true, createdAt: "2026-07-01T10:00:00Z", photoCount: 6, videoCount: 0, brokerTier: "prop", maxPhotos: 15, maxVideos: 1 },
];

const MOCK_TRANSACTIONS = [
  { id: "t1", type: "booking", date: "2026-07-18T06:30:00Z", reason: "Property booking - Kololo Apartment", recipientName: "Alice Namuli", recipientPhone: "+256701234567", recipientEmail: "alice@example.com", senderName: "Customer", senderPhone: "+256709999999", senderEmail: "customer@example.com", amount: 850000, status: "completed", emailStatus: "sent", referenceNumber: "REF-001", transactionCode: "TXN-001" },
  { id: "t2", type: "subscription", date: "2026-07-17T10:00:00Z", reason: "Premium subscription - July", recipientName: "David Ssempala", recipientPhone: "+256704567890", recipientEmail: "david@example.com", senderName: "Customer", senderPhone: "+256708888888", senderEmail: "customer@example.com", amount: 120000, status: "completed", emailStatus: "sent", referenceNumber: "REF-002", transactionCode: "TXN-002" },
  { id: "t3", type: "withdrawal", date: "2026-07-16T14:00:00Z", reason: "Platform commission withdrawal", recipientName: "Alice Namuli", recipientPhone: "+256701234567", recipientEmail: "alice@example.com", senderName: "Platform", senderPhone: "", senderEmail: "finance@zcanopy.com", amount: 500000, status: "pending", emailStatus: "sent", referenceNumber: "REF-003", transactionCode: "TXN-003" },
  { id: "t4", type: "booking", date: "2026-07-15T09:20:00Z", reason: "Property booking - Muyenga Villa", recipientName: "Brian Ochieng", recipientPhone: "+256702345678", recipientEmail: "brian@example.com", senderName: "Customer", senderPhone: "+256707777777", senderEmail: "customer@example.com", amount: 1500000, status: "completed", emailStatus: "sent", referenceNumber: "REF-004", transactionCode: "TXN-004" },
  { id: "t5", type: "subscription", date: "2026-07-14T11:00:00Z", reason: "Enterprise subscription - July", recipientName: "Eva Nakato", recipientPhone: "+256705678901", recipientEmail: "eva@example.com", senderName: "Customer", senderPhone: "+256706666666", senderEmail: "customer@example.com", amount: 350000, status: "completed", emailStatus: "sent", referenceNumber: "REF-005", transactionCode: "TXN-005" },
  { id: "t6", type: "booking", date: "2026-07-13T16:45:00Z", reason: "Property booking - Kira Land", recipientName: "Alice Namuli", recipientPhone: "+256701234567", recipientEmail: "alice@example.com", senderName: "Customer", senderPhone: "+256705555555", senderEmail: "customer@example.com", amount: 420000, status: "failed", emailStatus: "sent", referenceNumber: "REF-006", transactionCode: "TXN-006" },
];

const MOCK_ADMINS = [
  { id: "a1", username: "Super Admin", email: "superadmin@zcanopy.dev", role: "super_admin", isActive: true, lastLoggedIn: "2026-07-18T05:00:00Z", createdAt: "2025-01-01T08:00:00Z", handledMessages: 145, sentEmails: 320, sentSms: 28 },
  { id: "a2", username: "Admin User", email: "admin@zcanopy.dev", role: "admin", isActive: true, lastLoggedIn: "2026-07-17T18:30:00Z", createdAt: "2025-03-15T09:00:00Z", handledMessages: 89, sentEmails: 150, sentSms: 12 },
  { id: "a3", username: "Support Agent", email: "support@zcanopy.dev", role: "support", isActive: true, lastLoggedIn: "2026-07-18T04:45:00Z", createdAt: "2025-06-20T10:00:00Z", handledMessages: 230, sentEmails: 45, sentSms: 8 },
  { id: "a4", username: "Frozen Admin", email: "frozen@zcanopy.dev", role: "admin", isActive: false, lastLoggedIn: "2026-06-01T12:00:00Z", createdAt: "2025-08-10T11:00:00Z", handledMessages: 12, sentEmails: 5, sentSms: 1 },
];

const MOCK_SYSTEM_MESSAGES = [
  { type: "BROKER_SIGNUP", title: "New broker signup", message: "Eva Nakato (eva@example.com) signed up and is awaiting document approval.", brokerId: "b5", read: false, createdAt: "2026-07-18T05:30:00Z" },
  { type: "BROKER_FEEDBACK", title: "Broker feedback from BRK-003", message: "Email: carol@example.com, Phone: +256703456789, Content: Need help with property listing.", brokerId: "b3", read: false, createdAt: "2026-07-17T16:20:00Z" },
  { type: "PAYMENT_FAILED", title: "Subscription Payment Failed", message: "Payment for basic tier failed for broker Carol Atim: Insufficient balance.", brokerId: "b3", read: true, createdAt: "2026-07-16T09:00:00Z" },
  { type: "BROKER_SIGNUP", title: "New broker signup", message: "Carol Atim (carol@example.com) signed up and is awaiting document approval.", brokerId: "b3", read: true, createdAt: "2026-07-15T11:00:00Z" },
];

const MOCK_CLIENT_MESSAGES = [
  { id: "cm1", senderPhone: "+256701111111", senderName: "John Mukasa", message: "I need assistance with booking a property in Kampala.", sentAt: "2026-07-18T04:30:00Z", read: false },
  { id: "cm2", senderPhone: "+256702222222", senderName: "Sarah Kiggundu", message: "When will my payment be processed?", sentAt: "2026-07-17T15:10:00Z", read: true },
  { id: "cm3", senderPhone: "+256703333333", senderName: "Michael Okello", message: "I want to list my property on the platform.", sentAt: "2026-07-16T08:45:00Z", read: true },
];

const MOCK_LOGS = [
  { id: "l1", level: "info", service: "auth", message: "User login successful: superadmin@zcanopy.dev", timestamp: "2026-07-18T05:42:00Z", metadata: {} },
  { id: "l2", level: "warn", service: "payment", message: "Payment retry attempt 2 for transaction TXN-006", timestamp: "2026-07-18T05:30:00Z", metadata: {} },
  { id: "l3", level: "error", service: "broker", message: "Failed to sync broker profile for BRK-003: timeout", timestamp: "2026-07-18T05:15:00Z", metadata: {} },
  { id: "l4", level: "info", service: "property", message: "Property p5 created successfully", timestamp: "2026-07-18T04:50:00Z", metadata: {} },
  { id: "l5", level: "debug", service: "admin", message: "Commission updated: +120000", timestamp: "2026-07-18T04:00:00Z", metadata: {} },
  { id: "l6", level: "info", service: "notification", message: "Email sent to alice@example.com", timestamp: "2026-07-18T03:30:00Z", metadata: {} },
];

const MOCK_PROPERTY_LOCATIONS = [
  { propertyId: "p1", title: "2BR Apartment in Kololo", location: "Kololo, Kampala", postgisSpatialField: JSON.stringify({ lat: 0.3476, lng: 32.5825 }), brokerCode: "BRK-001" },
  { propertyId: "p2", title: "3BR Villa in Muyenga", location: "Muyenga, Kampala", postgisSpatialField: JSON.stringify({ lat: 0.2958, lng: 32.6154 }), brokerCode: "BRK-002" },
  { propertyId: "p3", title: "Office Space in CBD", location: "CBD, Kampala", postgisSpatialField: JSON.stringify({ lat: 0.3136, lng: 32.5705 }), brokerCode: "BRK-004" },
  { propertyId: "p4", title: "Land Plot in Kira", location: "Kira, Wakiso", postgisSpatialField: JSON.stringify({ lat: 0.3658, lng: 32.6500 }), brokerCode: "BRK-001" },
  { propertyId: "p5", title: "1BR Studio in Ntinda", location: "Ntinda, Kampala", postgisSpatialField: JSON.stringify({ lat: 0.3476, lng: 32.6154 }), brokerCode: "BRK-003" },
];

const MOCK_SESSIONS = [
  { sessionId: "sess-001", deviceId: "dev-abc-123", createdAt: 1752800000000, lastActivityAt: 1752800000000, locationLat: 0.3476, locationLng: 32.5825, locationUpdatedAt: 1752800000000, ttlSecondsRemaining: 3600 },
  { sessionId: "sess-002", deviceId: "dev-def-456", createdAt: 1752713600000, lastActivityAt: 1752796800000, locationLat: 0.0521, locationLng: 32.4639, locationUpdatedAt: 1752796800000, ttlSecondsRemaining: 1800 },
  { sessionId: "sess-003", deviceId: "dev-ghi-789", createdAt: 1752627200000, lastActivityAt: 1752783600000, locationLat: -0.0917, locationLng: 31.4636, locationUpdatedAt: 1752783600000, ttlSecondsRemaining: 7200 },
];

const MOCK_INVOICES = [
  { id: "inv1", invoiceNumber: "INV-2026-001", recipientName: "Alice Namuli", recipientEmail: "alice@example.com", brokerCode: "BRK-001", issueDate: "2026-07-01T00:00:00Z", dueDate: "2026-07-15T00:00:00Z", amount: 1250000, currency: "UGX", status: "sent", description: "Subscription - Fibrous tier (July)" },
  { id: "inv2", invoiceNumber: "INV-2026-002", recipientName: "David Ssempala", recipientEmail: "david@example.com", brokerCode: "BRK-004", issueDate: "2026-07-01T00:00:00Z", dueDate: "2026-07-15T00:00:00Z", amount: 1250000, currency: "UGX", status: "sent", description: "Subscription - Fibrous tier (July)" },
  { id: "inv3", invoiceNumber: "INV-2026-003", recipientName: "Brian Ochieng", recipientEmail: "brian@example.com", brokerCode: "BRK-002", issueDate: "2026-07-01T00:00:00Z", dueDate: "2026-07-15T00:00:00Z", amount: 800000, currency: "UGX", status: "pending", description: "Subscription - Buttress tier (July)" },
  { id: "inv4", invoiceNumber: "INV-2026-004", recipientName: "Carol Atim", recipientEmail: "carol@example.com", brokerCode: "BRK-003", issueDate: "2026-07-01T00:00:00Z", dueDate: "2026-07-15T00:00:00Z", amount: 300000, currency: "UGX", status: "failed", description: "Subscription - Prop tier (July)" },
  { id: "inv5", invoiceNumber: "INV-2026-005", recipientName: "Eva Nakato", recipientEmail: "eva@example.com", brokerCode: "BRK-005", issueDate: "2026-06-01T00:00:00Z", dueDate: "2026-06-15T00:00:00Z", amount: 800000, currency: "UGX", status: "sent", description: "Subscription - Buttress tier (June)" },
  { id: "inv6", invoiceNumber: "INV-2026-006", recipientName: "Alice Namuli", recipientEmail: "alice@example.com", brokerCode: "BRK-001", issueDate: "2026-07-10T00:00:00Z", dueDate: "2026-07-24T00:00:00Z", amount: 850000, currency: "UGX", status: "pending", description: "Featured listing - Kololo Apartment" },
];

const MOCK_INCOME = [
  { month: "Jan", income: 4500000 },
  { month: "Feb", income: 5200000 },
  { month: "Mar", income: 4800000 },
  { month: "Apr", income: 6100000 },
  { month: "May", income: 5800000 },
  { month: "Jun", income: 7200000 },
  { month: "Jul", income: 6900000 },
];

export const mockData = {
  brokers: () => ({ brokers: MOCK_BROKERS, total: MOCK_BROKERS.length, page: 1, limit: 10 }),
  recentSignups: (limit = 10) => ({ brokers: MOCK_BROKERS.slice(0, Math.min(limit, MOCK_BROKERS.length)) }),
  pendingVerifications: (page = 1, limit = 10) => ({
    brokers: MOCK_BROKERS.filter((b) => !b.isVerified),
    total: MOCK_BROKERS.filter((b) => !b.isVerified).length,
    page,
    limit,
  }),
  properties: (_page = 1, _limit = 10) => ({ properties: MOCK_PROPERTIES, total: MOCK_PROPERTIES.length }),
  brokerDetails: (brokerId: string) => {
    const broker = MOCK_BROKERS.find((b) => b.id === brokerId) || MOCK_BROKERS[0];
    return {
      broker: {
        ...broker,
        bio: `Experienced real estate professional with over ${Math.floor(Math.random() * 10 + 2)} years in the industry. Specializes in residential and commercial properties across Uganda.`,
        subscriptionExpiresAt: broker.subscriptionTier === 'prop' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        legalName: broker.username,
        idNumber: `CM${Math.floor(10000000 + Math.random() * 89999999)}`,
        idFrontUrl: "https://placehold.co/600x380/ece5d8/5d4037?text=National+ID+Front",
        idBackUrl: "https://placehold.co/600x380/ece5d8/5d4037?text=National+ID+Back",
      },
      walletBalance: broker.walletBalance,
      transactions: MOCK_TRANSACTIONS.slice(0, 5),
      messages: [
        { id: "m1", senderName: "System", senderPhone: "", message: "Welcome to ZCanopy! Your account has been created.", sentAt: broker.createdAt, read: true, type: "system" },
        { id: "m2", senderName: "Admin", senderPhone: "", message: "Your documents have been verified successfully.", sentAt: "2026-07-16T10:00:00Z", read: true, type: "admin" },
      ],
      bookings: [
        { id: "bk1", propertyId: "p1", propertyTitle: "2BR Apartment in Kololo", customerName: "John Doe", customerPhone: "+256701111111", customerEmail: "john@example.com", date: "2026-07-20T10:00:00Z", status: "confirmed", amount: 850000, transactionCode: "TXN-BK-001" },
      ],
    };
  },
  brokerProperties: (brokerId: string, _page = 1, _limit = 10) => {
    const code = MOCK_BROKERS.find((b) => b.id === brokerId)?.brokerCode || "BRK-001";
    const props = MOCK_PROPERTIES.filter((p) => p.brokersUniqueCode === code);
    return { properties: props, total: props.length };
  },
  transactions: (_page = 1, _limit = 10) => ({ transactions: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length }),
  admins: () => ({ admins: MOCK_ADMINS }),
  systemMessages: (page = 1, limit = 10) => {
    const start = (page - 1) * limit;
    return { messages: MOCK_SYSTEM_MESSAGES.slice(start, start + limit), total: MOCK_SYSTEM_MESSAGES.length, page, limit };
  },
  clientMessages: (page = 1, limit = 10) => {
    const start = (page - 1) * limit;
    return { messages: MOCK_CLIENT_MESSAGES.slice(start, start + limit), total: MOCK_CLIENT_MESSAGES.length, page, limit };
  },
  logs: (page = 1, limit = 10, level?: string, service?: string) => {
    let logs = MOCK_LOGS;
    if (level) logs = logs.filter((l) => l.level === level);
    if (service) logs = logs.filter((l) => l.service === service);
    const start = (page - 1) * limit;
    return { logs: logs.slice(start, start + limit), total: logs.length, page, limit };
  },
  activeSessions: () => ({ sessions: MOCK_SESSIONS, total: MOCK_SESSIONS.length }),
  income: () => ({ entries: MOCK_INCOME }),
  commission: () => ({ platformCommission: 18500000, bookingCommission: 4200000, totalEarnings: 22700000 }),
  currentCommission: () => ({ platformCommission: 18500000, bookingCommission: 4200000, totalEarnings: 22700000 }),
  brokerCommissions: () => ({
    commissions: [
      { brokerId: "b1", brokerCode: "BRK-001", brokerName: "Alice Namuli", tier: "fibrous", totalCommission: 4500000, transactionCount: 12, totalBookings: 18500000 },
      { brokerId: "b2", brokerCode: "BRK-002", brokerName: "Brian Ochieng", tier: "buttress", totalCommission: 3200000, transactionCount: 8, totalBookings: 12800000 },
      { brokerId: "b4", brokerCode: "BRK-004", brokerName: "David Ssempala", tier: "fibrous", totalCommission: 8900000, transactionCount: 24, totalBookings: 35000000 },
      { brokerId: "b5", brokerCode: "BRK-005", brokerName: "Eva Nakato", tier: "buttress", totalCommission: 6100000, transactionCount: 15, totalBookings: 24500000 },
    ],
  }),
  wallet: () => ({ balance: 15000000, currency: "UGX", walletId: "plat-comm-1", name: "Platform Commission Wallet" }),
  invoices: (status?: string) => ({
    invoices: status ? MOCK_INVOICES.filter((i) => i.status === status) : MOCK_INVOICES,
    total: status ? MOCK_INVOICES.filter((i) => i.status === status).length : MOCK_INVOICES.length,
  }),
  notifications: (query = {}) => ({ notifications: [], total: 0, ...query }),
  propertyLocations: () => ({ locations: MOCK_PROPERTY_LOCATIONS }),
  featuredProperties: () => ({
    properties: [
      { id: "p1", title: "2BR Apartment in Kololo", description: "Modern apartment with shared pool, balcony & 24/7 security.", propertyType: "apartment", location: "Kololo, Kampala", brokerCode: "BRK-001", price: 850000, priceLabel: "Booking", imageUrl: "/images.jpg", isAvailable: true },
      { id: "p2", title: "3BR Villa in Muyenga", description: "Spacious family villa with garden, double garage & maid's quarter.", propertyType: "villa", location: "Muyenga, Kampala", brokerCode: "BRK-002", price: 1500000, priceLabel: "Booking", imageUrl: "/images-1.jpg", isAvailable: true },
      { id: "p4", title: "Land Plot in Kira", description: "Residential land for sale, surveyed and ready for title processing.", propertyType: "land", location: "Kira, Wakiso", brokerCode: "BRK-001", price: 420000, priceLabel: "Booking", imageUrl: "/images-2.jpg", isAvailable: true },
      { id: "p5", title: "1BR Studio in Ntinda", description: "Cozy studio apartment, ideal for young professionals. Gated community.", propertyType: "apartment", location: "Ntinda, Kampala", brokerCode: "BRK-003", price: 320000, priceLabel: "Booking", imageUrl: "/images.jpg", isAvailable: true },
    ],
  }),
};
