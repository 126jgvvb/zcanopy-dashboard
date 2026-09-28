"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  useAdminData,
  Panel,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { adminApi, formatDate } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";
import { ArrowLeft, Download, Eye, CreditCard, FileText, Calendar, Heart, FileType } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin } = useAuth();
  const customerId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "invoices" | "bookings" | "favorites">("overview");
  const [exporting, setExporting] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const customer = useAdminData((token) => adminApi.customerDetails(token, customerId));
  const transactions = useAdminData((token) => adminApi.customerTransactions(token, customerId, 1, 50));
  const invoices = useAdminData((token) => adminApi.customerInvoices(token, customerId, 1, 50));
  const bookings = useAdminData((token) => adminApi.customerBookings(token, customerId, 1, 50));
  const favorites = useAdminData((token) => adminApi.customerFavorites(token, customerId, 1, 50));

  const canManage = can(admin?.role, "manage_customers");

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await adminApi.exportCustomers(admin!.token);
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `customer-${customerId}-report-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!c) return;
    setPdfGenerating(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [169, 113, 14];
      const accentGold: [number, number, number] = [209, 160, 84];

      // Helper to add a section title
      const addSectionTitle = (title: string, y: number) => {
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, y);
        return y + 8;
      };

      // Helper to add key-value pairs
      const addKeyValue = (key: string, value: string, y: number) => {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "bold");
        doc.text(`${key}:`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        doc.text(value, 60, y);
        return y + 6;
      };

      // Title
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("ZCanopy Admin Dashboard", 14, 22);
      doc.setFontSize(16);
      doc.text("Customer Detail Report", 14, 30);

      // Line separator
      doc.setDrawColor(...accentGold);
      doc.setLineWidth(0.5);
      doc.line(14, 34, 196, 34);

      let y = 42;

      // Customer Info
      y = addSectionTitle("Customer Information", y);
      y = addKeyValue("Customer ID", c.id, y);
      y = addKeyValue("Name", `${c.firstName} ${c.lastName}`, y);
      y = addKeyValue("Email", c.email, y);
      y = addKeyValue("Phone", c.phoneNumber || "—", y);
      y = addKeyValue("Auth Provider", c.authProvider.charAt(0).toUpperCase() + c.authProvider.slice(1), y);
      y = addKeyValue("Status", c.isActive ? "Active" : "Inactive", y);
      y = addKeyValue("Joined", c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—", y);

      y += 6;

      // Overview Stats
      y = addSectionTitle("Overview Statistics", y);
      const stats = [
        ["Total Transactions", transactions.data?.total ?? 0],
        ["Total Invoices", invoices.data?.total ?? 0],
        ["Total Bookings", bookings.data?.total ?? 0],
        ["Favorites", favorites.data?.total ?? 0],
      ];
autoTable(doc, {
          startY: y,
          head: [["Metric", "Count"]],
          body: stats,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255 },
          margin: { left: 14, right: 14 },
        });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Transactions
      const txRows = (transactions.data?.transactions ?? []).map((t: { date: string; type: string; propertyTitle: string; brokerName: string; amount: number; status: string; referenceNumber: string; transactionCode: string }) => [
        new Date(t.date).toLocaleDateString(),
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        t.propertyTitle,
        t.brokerName,
        `UGX ${t.amount.toLocaleString()}`,
        t.status.charAt(0).toUpperCase() + t.status.slice(1),
        t.referenceNumber,
        t.transactionCode,
      ]);
      if (txRows.length > 0) {
        y = addSectionTitle("Transactions", y);
        autoTable(doc, {
          startY: y,
          head: [["Date", "Type", "Property", "Broker", "Amount", "Status", "Reference", "Txn Code"]],
          body: txRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Invoices
      const invRows = (invoices.data?.invoices ?? []).map((i: { invoiceNumber: string; issueDate: string; dueDate: string; amount: number; currency: string; status: string; description: string }) => [
        i.invoiceNumber,
        new Date(i.issueDate).toLocaleDateString(),
        new Date(i.dueDate).toLocaleDateString(),
        `${i.currency} ${i.amount.toLocaleString()}`,
        i.status.charAt(0).toUpperCase() + i.status.slice(1),
        i.description,
      ]);
      if (invRows.length > 0) {
        y = addSectionTitle("Invoices", y);
        autoTable(doc, {
          startY: y,
          head: [["Invoice #", "Issue Date", "Due Date", "Amount", "Status", "Description"]],
          body: invRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Bookings
      const bkRows = (bookings.data?.bookings ?? []).map((b: { bookingDate: string; propertyTitle: string; brokerName: string; brokerCode: string; amount: number; status: string; transactionCode: string }) => [
        new Date(b.bookingDate).toLocaleDateString(),
        b.propertyTitle,
        `${b.brokerName} (${b.brokerCode})`,
        `UGX ${b.amount.toLocaleString()}`,
        b.status.charAt(0).toUpperCase() + b.status.slice(1),
        b.transactionCode,
      ]);
      if (bkRows.length > 0) {
        y = addSectionTitle("Bookings", y);
        autoTable(doc, {
          startY: y,
          head: [["Booking Date", "Property", "Broker", "Amount", "Status", "Txn Code"]],
          body: bkRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Favorites
      const favRows = (favorites.data?.favorites ?? []).map((f: { propertyTitle: string; propertyType: string; location: string; price: number; addedAt: string }) => [
        f.propertyTitle,
        f.propertyType.charAt(0).toUpperCase() + f.propertyType.slice(1),
        f.location,
        `UGX ${f.price.toLocaleString()}`,
        new Date(f.addedAt).toLocaleDateString(),
      ]);
      if (favRows.length > 0) {
        y = addSectionTitle("Favorites", y);
        autoTable(doc, {
          startY: y,
          head: [["Property", "Type", "Location", "Price", "Added"]],
          body: favRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleString()} | ZCanopy Admin Dashboard | Page ${i} of ${pageCount}`,
          14,
          285
        );
      }

      doc.save(`customer-${c.id}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const c = customer.data?.customer;

  if (customer.loading) {
    return <LoadingState label="Loading customer details" />;
  }

  if (customer.error || !c) {
    return <ErrorState message={customer.error || "Customer not found"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="hover-gold flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="hover-gold flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Download CSV"}
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={pdfGenerating}
                className="hover-gold flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                style={{ backgroundColor: COLORS.accentGold }}
              >
                <FileType className="h-4 w-4" />
                {pdfGenerating ? "Generating..." : "Download PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      <Panel title={`${c.firstName} ${c.lastName}`} action={
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            c.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {c.isActive ? "Active" : "Inactive"}
          </span>
          <span className="text-sm text-gray-500">Joined {formatDate(c.createdAt)}</span>
        </div>
      }>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">Email</p>
            <p className="mt-1 text-lg font-semibold text-[var(--zcanopy-card-brown)]">{c.email}</p>
          </div>
          <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">Phone</p>
            <p className="mt-1 text-lg font-semibold text-[var(--zcanopy-card-brown)]">{c.phoneNumber || "—"}</p>
          </div>
          <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">Auth Provider</p>
            <p className="mt-1 text-lg font-semibold text-[var(--zcanopy-card-brown)] capitalize">{c.authProvider}</p>
          </div>
        </div>
      </Panel>

      <div className="border-b border-[var(--zcanopy-border)]">
        <nav className="flex gap-1 -mb-px" aria-label="Tabs">
          {([
            { id: "overview", label: "Overview", icon: Eye },
            { id: "transactions", label: "Transactions", icon: CreditCard },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "favorites", label: "Favorites", icon: Heart },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-[var(--zcanopy-accent-gold)] text-[var(--zcanopy-card-brown)]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <Panel title="Overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Transactions"
              value={transactions.data?.total ?? 0}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <StatCard
              label="Total Invoices"
              value={invoices.data?.total ?? 0}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Total Bookings"
              value={bookings.data?.total ?? 0}
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label="Favorites"
              value={favorites.data?.total ?? 0}
              icon={<Heart className="h-5 w-5" />}
            />
          </div>
        </Panel>
      )}

      {activeTab === "transactions" && (
        <Panel title="Transactions">
          {transactions.loading ? (
            <LoadingState label="Loading transactions" />
          ) : transactions.error ? (
            <ErrorState message={transactions.error} />
          ) : (
            <TransactionTable rows={transactions.data?.transactions ?? []} />
          )}
        </Panel>
      )}

      {activeTab === "invoices" && (
        <Panel title="Invoices">
          {invoices.loading ? (
            <LoadingState label="Loading invoices" />
          ) : invoices.error ? (
            <ErrorState message={invoices.error} />
          ) : (
            <InvoiceTable rows={invoices.data?.invoices ?? []} />
          )}
        </Panel>
      )}

      {activeTab === "bookings" && (
        <Panel title="Bookings">
          {bookings.loading ? (
            <LoadingState label="Loading bookings" />
          ) : bookings.error ? (
            <ErrorState message={bookings.error} />
          ) : (
            <BookingTable rows={bookings.data?.bookings ?? []} />
          )}
        </Panel>
      )}

      {activeTab === "favorites" && (
        <Panel title="Favorites">
          {favorites.loading ? (
            <LoadingState label="Loading favorites" />
          ) : favorites.error ? (
            <ErrorState message={favorites.error} />
          ) : (
            <FavoriteTable rows={favorites.data?.favorites ?? []} />
          )}
        </Panel>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-5 shadow-[var(--zcanopy-shadow-sm)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-[var(--zcanopy-accent-gold)]" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--zcanopy-card-brown)]">{value}</p>
        </div>
        <div className="text-[var(--zcanopy-accent-gold)]">{icon}</div>
      </div>
    </div>
  );
}

function TransactionTable({
  rows,
}: {
  rows: Array<{
    id: string;
    type: string;
    date: string;
    propertyTitle: string;
    propertyId: string;
    brokerName: string;
    amount: number;
    status: string;
    referenceNumber: string;
    transactionCode: string;
  }>;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No transactions found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Date</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Property</th>
            <th className="py-2 pr-4">Broker</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Reference</th>
            <th className="py-2">Transaction Code</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-[#D1A054]/5">
              <td className="py-3 pr-4 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
              <td className="py-2 pr-4 capitalize">{t.type}</td>
              <td className="py-2 pr-4 font-medium">{t.propertyTitle}</td>
              <td className="py-2 pr-4 text-gray-500">{t.brokerName}</td>
              <td className="py-2 pr-4 font-semibold text-[var(--zcanopy-card-brown)]">UGX {t.amount.toLocaleString()}</td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : t.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : t.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t.status}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono text-sm">{t.referenceNumber}</td>
              <td className="py-2 font-mono text-sm">{t.transactionCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceTable({
  rows,
}: {
  rows: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
  }>;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No invoices found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Invoice #</th>
            <th className="py-2 pr-4">Issue Date</th>
            <th className="py-2 pr-4">Due Date</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((i) => (
            <tr key={i.id} className="hover:bg-[#D1A054]/5">
              <td className="py-3 pr-4 font-mono">{i.invoiceNumber}</td>
              <td className="py-2 pr-4 text-gray-500">{new Date(i.issueDate).toLocaleDateString()}</td>
              <td className="py-2 pr-4 text-gray-500">{new Date(i.dueDate).toLocaleDateString()}</td>
              <td className="py-2 pr-4 font-semibold text-[var(--zcanopy-card-brown)]">{i.currency} {i.amount.toLocaleString()}</td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    i.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : i.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {i.status}
                </span>
              </td>
              <td className="py-2 text-gray-500">{i.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingTable({
  rows,
}: {
  rows: Array<{
    id: string;
    propertyId: string;
    propertyTitle: string;
    brokerName: string;
    brokerCode: string;
    bookingDate: string;
    status: string;
    amount: number;
    transactionCode: string;
  }>;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No bookings found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Booking Date</th>
            <th className="py-2 pr-4">Property</th>
            <th className="py-2 pr-4">Broker</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Transaction Code</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-[#D1A054]/5">
              <td className="py-3 pr-4 text-gray-500">{new Date(b.bookingDate).toLocaleDateString()}</td>
              <td className="py-2 pr-4 font-medium">{b.propertyTitle}</td>
              <td className="py-2 pr-4 text-gray-500">{b.brokerName} ({b.brokerCode})</td>
              <td className="py-2 pr-4 font-semibold text-[var(--zcanopy-card-brown)]">UGX {b.amount.toLocaleString()}</td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    b.status === "confirmed" || b.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : b.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {b.status}
                </span>
              </td>
              <td className="py-2 font-mono text-sm">{b.transactionCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FavoriteTable({
  rows,
}: {
  rows: Array<{
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyType: string;
    location: string;
    price: number;
    imageUrl: string;
    addedAt: string;
  }>;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No favorites found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Property</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Location</th>
            <th className="py-2 pr-4">Price</th>
            <th className="py-2 pr-4">Added</th>
            <th className="py-2">Image</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((f) => (
            <tr key={f.id} className="hover:bg-[#D1A054]/5">
              <td className="py-3 pr-4 font-medium">{f.propertyTitle}</td>
              <td className="py-2 pr-4 capitalize">{f.propertyType}</td>
              <td className="py-2 pr-4 text-gray-500">{f.location}</td>
              <td className="py-2 pr-4 font-semibold text-[var(--zcanopy-card-brown)]">UGX {f.price.toLocaleString()}</td>
              <td className="py-2 pr-4 text-gray-500">{new Date(f.addedAt).toLocaleDateString()}</td>
              <td className="py-2">
                <img
                  src={f.imageUrl}
                  alt={f.propertyTitle}
                  className="h-12 w-16 object-cover rounded-lg"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}