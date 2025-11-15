"use client";

import * as React from "react";
import { Table } from "@/components/ui/table";
import { Event } from "@/types";
import { useAdminPermission } from "@/hooks/use-admin-permission";
import { createColumns } from "./events-table-columns";
import { useEventsTable } from "./events-table-hooks";
import { useEventsTableHandlers } from "./events-table-handlers";
import { EventsTableProps } from "./events-table-types";
import { EventsTableControls } from "./events-table-controls";
import EventForm from "@/components/events/event-form";
import { Dialog } from "@/components/ui/dialog";
import { flexRender } from "@tanstack/react-table";
import {
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const EventsTable = ({
  events,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = "",
  eventType,
  gender,
  onEventTypeChange,
  onGenderChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: EventsTableProps) => {
  const { isAdmin } = useAdminPermission();

  const {
    editEvent,
    editDialogOpen,
    setEditDialogOpen,
    setEditEvent,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = useEventsTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  });

  const columns = React.useMemo(
    () =>
      createColumns(
        isAdmin,
        handleEdit,
        handleDelete,
        sortBy,
        sortOrder,
        handleSort
      ),
    [isAdmin, handleEdit, handleDelete, sortBy, sortOrder, handleSort]
  );

  const { table } = useEventsTable({
    events,
    columns,
    totalPages: pagination.totalPages,
  });

  const handleCancel = () => {
    setEditDialogOpen(false);
    setEditEvent(null);
  };

  return (
    <div className="w-full space-y-4">
      <EventsTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        eventType={eventType}
        gender={gender}
        onEventTypeChange={onEventTypeChange}
        onGenderChange={onGenderChange}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !table.getRowModel().rows?.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <p className="text-lg font-medium text-muted-foreground">
                      No events found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchValue
                        ? "Try adjusting your search terms or filters."
                        : "No events match the current filters."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        {editEvent && (
          <EventForm
            event={editEvent}
            onSuccess={handleEditSuccess}
            onCancel={handleCancel}
            hasRegistrations={(editEvent.registrations?.length || 0) > 0}
            hasPlayedSets={
              editEvent.matches?.some((m) =>
                m.sets?.some((s) => s.played)
              ) || false
            }
          />
        )}
      </Dialog>
    </div>
  );
};

export default EventsTable;

