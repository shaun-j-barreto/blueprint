/**
 * Task table only. Kept separate from `dataGridSxStyles` so the Teams and
 * Users tables keep their original look.
 */
export const taskDataGridClassNames =
  "task-data-grid overflow-hidden rounded-2xl border border-brand-500/80 bg-brand-100";

export const taskDataGridSxStyles = (isDarkMode: boolean) => {
  return {
    border: "none",
    borderRadius: "1rem",
    backgroundColor: "var(--color-brand-100)",
    color: "var(--color-brand-900)",
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    boxShadow: isDarkMode
      ? "0 1px 2px rgba(0, 0, 0, 0.45)"
      : "0 1px 2px rgba(15, 23, 42, 0.04)",

    // MUI X v9 paints several surfaces from theme tokens rather than classes.
    // The extra class keeps these overrides above MUI's generated variables.
    "&.MuiDataGrid-root": {
      "--DataGrid-t-color-background-base": "var(--color-brand-100)",
      "--DataGrid-t-color-background-overlay": "var(--color-brand-100)",
      "--DataGrid-t-header-background-base": "var(--color-brand-200)",
      "--DataGrid-t-color-border-base": "var(--color-brand-500)",
      "--DataGrid-t-color-foreground-base": "var(--color-brand-900)",
      "--DataGrid-t-color-foreground-muted": "var(--color-brand-700)",
      backgroundColor: "var(--color-brand-100)",
    },

    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "var(--color-brand-200)",
      color: "var(--color-brand-700)",
      borderBottom: "1px solid var(--color-brand-500)",
      minHeight: "44px !important",
      maxHeight: "44px !important",
    },
    "& .MuiDataGrid-columnHeader": {
      backgroundColor: "var(--color-brand-200)",
      padding: "0 16px",
      outline: "none",
      "&:focus, &:focus-within": {
        outline: "none",
      },
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      color: "var(--color-brand-700)",
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    "& .MuiDataGrid-columnHeaderTitleContainer": {
      padding: 0,
    },
    "& .MuiDataGrid-filler": {
      backgroundColor: "var(--color-brand-100)",
    },
    "& .MuiDataGrid-scrollbarFiller": {
      backgroundColor: "var(--color-brand-100)",
    },
    "& .MuiDataGrid-columnHeaders .MuiDataGrid-scrollbarFiller": {
      backgroundColor: "var(--color-brand-200)",
    },
    "& .MuiDataGrid-scrollbar": {
      backgroundColor: "var(--color-brand-200)",
      scrollbarColor: "var(--color-brand-500) var(--color-brand-200)",
      scrollbarWidth: "thin",
    },
    "& .MuiDataGrid-scrollbar::-webkit-scrollbar": {
      width: "10px",
      height: "10px",
    },
    "& .MuiDataGrid-scrollbar::-webkit-scrollbar-track": {
      backgroundColor: "var(--color-brand-200)",
    },
    "& .MuiDataGrid-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--color-brand-500)",
      borderRadius: "9999px",
    },
    // MUI's scrollbar-corner element renders its own native scrollbars.
    "& .MuiDataGrid-main > [aria-hidden='true']:last-child": {
      backgroundColor: "var(--color-brand-200)",
      scrollbarColor: "var(--color-brand-500) var(--color-brand-200)",
      scrollbarWidth: "thin",
    },
    "& .MuiDataGrid-columnSeparator": {
      display: "none",
    },
    "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": {
      color: "var(--color-brand-700)",
    },
    "& .MuiDataGrid-columnHeader .MuiDataGrid-sortButton": {
      backgroundColor: "transparent",
      color: "var(--color-brand-700)",
      "&:hover": {
        backgroundColor: "var(--color-brand-300)",
      },
    },
    "& .MuiDataGrid-iconButtonContainer .MuiIconButton-root": {
      color: "var(--color-brand-700)",
    },

    "& .MuiDataGrid-row": {
      backgroundColor: "var(--color-brand-100)",
      borderBottom: "1px solid var(--color-brand-500)",
      transition: "background-color 150ms ease",
      "&:hover, &.Mui-hovered": {
        backgroundColor: "var(--color-brand-200)",
      },
      "&.Mui-selected, &.Mui-selected:hover": {
        backgroundColor: "var(--color-brand-200)",
      },
    },
    "& .MuiDataGrid-row:last-child": {
      borderBottom: "none",
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "none",
      color: "var(--color-brand-800)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      lineHeight: 1.25,
      overflow: "hidden",
      outline: "none",
      "&:focus, &:focus-within": {
        outline: "none",
      },
    },
    "& .MuiDataGrid-cell--withRenderer": {
      overflow: "hidden",
    },

    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "var(--color-brand-200)",
      borderTop: "1px solid var(--color-brand-500)",
      color: "var(--color-brand-900)",
      minHeight: "48px",
    },
    "& .MuiTablePagination-root": {
      color: "var(--color-brand-900)",
      fontSize: "0.75rem",
    },
    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
      color: "var(--color-brand-700)",
      fontSize: "0.75rem",
      fontWeight: 500,
    },
    "& .MuiTablePagination-selectIcon": {
      color: "var(--color-brand-700)",
    },
    "& .MuiIconButton-root": {
      color: "var(--color-brand-700)",
    },
    "& .MuiDataGrid-overlayWrapper": {
      backgroundColor: "var(--color-brand-100)",
    },
  };
};

/**
 * Pulls the human-readable message out of an RTK Query / fetch error without
 * relying on `any`, so form handlers can surface server validation errors.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;

      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};
