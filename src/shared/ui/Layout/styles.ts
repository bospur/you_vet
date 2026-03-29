import type { SxProps, Theme } from "@mui/material";

export const SIDEBAR_WIDTH = 240;

export const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
  } satisfies SxProps<Theme>,

  drawer: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: SIDEBAR_WIDTH,
      boxSizing: "border-box",
      borderRight: "1px solid",
      borderColor: "divider",
    },
  } satisfies SxProps<Theme>,

  drawerHeader: {
    display: "flex",
    alignItems: "center",
    px: 2,
    py: 2.5,
    borderBottom: "1px solid",
    borderColor: "divider",
  } satisfies SxProps<Theme>,

  navItem: {
    borderRadius: 2,
    mx: 1,
    mb: 0.5,
    "&.active": {
      bgcolor: "primary.main",
      color: "primary.contrastText",
      "& .MuiListItemIcon-root": { color: "primary.contrastText" },
      "&:hover": { bgcolor: "primary.dark" },
    },
  } satisfies SxProps<Theme>,
};

export const appBarSx = (isMobile: boolean): SxProps<Theme> => ({
  width: isMobile ? "100%" : `calc(100% - ${SIDEBAR_WIDTH}px)`,
  ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
});

export const mainSx = (isMobile: boolean): SxProps<Theme> => ({
  flexGrow: 1,
  ml: isMobile ? 0 : `${10}px`,
  mt: "64px",
  p: { xs: 2, sm: 3 },
  bgcolor: "background.default",
  minHeight: "calc(100vh - 64px)",
  width: isMobile ? "100%" : `calc(100% - ${SIDEBAR_WIDTH}px)`,
  boxSizing: "border-box",
});
