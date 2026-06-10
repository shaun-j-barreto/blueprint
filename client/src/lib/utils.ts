export const dataGridClassNames =
  "border border-brand-500 shadow-sm rounded-lg overflow-hidden";

export const dataGridSxStyles = (isDarkMode: boolean) => {
  return {
    // Base Grid Styles
    border: "none",
    backgroundColor: "var(--color-brand-100)",
    color: "var(--color-brand-900)",

    // Header Row overrides
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "var(--color-brand-200)",
      color: "var(--color-brand-900)",
      borderBottom: "1px solid var(--color-brand-500)",
      // Force MUI's internal header wrappers to inherit background
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: "var(--color-brand-200)",
      },
      "& .MuiDataGrid-filler": {
        backgroundColor: "var(--color-brand-200)",
      },
    },

    // Data Row overrides
    "& .MuiDataGrid-row": {
      borderBottom: "1px solid var(--color-brand-400)",
      "&:hover": {
        backgroundColor: "var(--color-brand-200)",
      },
    },

    // Cell overrides
    "& .MuiDataGrid-cell": {
      borderBottom: "none",
      color: "var(--color-brand-800)",
      display: "flex",
      alignItems: "center", // Vertically centers all text/badges
    },

    // Footer & Pagination overrides
    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "var(--color-brand-200)",
      borderTop: "1px solid var(--color-brand-500)",
      color: "var(--color-brand-900)",
    },
    "& .MuiTablePagination-root": {
      color: "var(--color-brand-900)",
    },
    "& .MuiTablePagination-selectIcon": {
      color: "var(--color-brand-700)",
    },
    "& .MuiIconButton-root": {
      color: "var(--color-brand-700)",
    },
    "& .MuiDataGrid-iconSeparator": {
      color: "var(--color-brand-500)",
    },
  };
};
