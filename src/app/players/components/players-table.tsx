"use client";

import * as React from "react";
import { Table } from "@/components/ui/table";
import { Player } from "@/types";
import { useAdminPermission } from "@/hooks/use-admin-permission";
import { createColumns } from "./players-table-columns";
import { PlayersTableControls } from "./players-table-controls";
import { PlayersTablePagination } from "./players-table-pagination";
import { PlayersTableHeader } from "./players-table-header";
import { PlayersTableBody } from "./players-table-body";
import { PlayersTableEditDialog } from "./players-table-edit-dialog";
import { usePlayersTableHandlers } from "./players-table-handlers";
import { usePlayersTable } from "./players-table-hooks";
import { PlayersTableProps } from "./players-table-types";

const PlayersTable = ({
  players,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = "",
  gender,
  ageGroup,
  onGenderChange,
  onAgeGroupChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: PlayersTableProps) => {
  const { isAdmin } = useAdminPermission();

  const {
    editPlayer,
    editDialogOpen,
    setEditDialogOpen,
    setEditPlayer,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  } = usePlayersTableHandlers({
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

  const { table } = usePlayersTable({
    players,
    columns,
    totalPages: pagination.totalPages,
  });

  const handleCancel = () => {
    setEditDialogOpen(false);
    setEditPlayer(null);
  };

  return (
    <div className="w-full space-y-4">
      <PlayersTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        gender={gender}
        ageGroup={ageGroup}
        onGenderChange={onGenderChange}
        onAgeGroupChange={onAgeGroupChange}
      />
      <div className="rounded-md border">
        <Table>
          <PlayersTableHeader table={table} />
          <PlayersTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <PlayersTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
      <PlayersTableEditDialog
        player={editPlayer}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default PlayersTable;
