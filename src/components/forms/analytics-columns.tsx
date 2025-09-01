"use client";
import { ColumnDef } from "@tanstack/react-table";

export type AnalyticsRow = {
  date: string;
  submissions: number;
  failed_webhooks: number;
  emails_sent: number;
  unique_ips: number;
};

export const columns: ColumnDef<AnalyticsRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <button
        className="font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
      </button>
    ),
    cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
  },
  {
    accessorKey: "submissions",
    header: "Submissions",
    cell: ({ row }) => row.getValue("submissions"),
  },
  {
    accessorKey: "failed_webhooks",
    header: "Failed Webhooks",
    cell: ({ row }) => row.getValue("failed_webhooks"),
  },
  {
    accessorKey: "emails_sent",
    header: "Emails Sent",
    cell: ({ row }) => row.getValue("emails_sent"),
  },
  {
    accessorKey: "unique_ips",
    header: "Unique IPs",
    cell: ({ row }) => row.getValue("unique_ips"),
  },
];
