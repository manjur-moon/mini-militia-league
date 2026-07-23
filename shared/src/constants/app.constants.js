export const APP_NAME = "Mini Militia League & Analytics";
export const API_PREFIX = "/api/v1";
export const AUTH_PREFIX = "/api/auth";

export const USER_ROLES = Object.freeze({
  PLAYER: "player",
  MODERATOR: "moderator",
  ADMIN: "admin",
});

export const USER_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
});

export const ROLE_ACCESS = Object.freeze({
  PLAYER_AREA: Object.freeze([
    USER_ROLES.PLAYER,
    USER_ROLES.MODERATOR,
    USER_ROLES.ADMIN,
  ]),
  MODERATOR_AREA: Object.freeze([USER_ROLES.MODERATOR, USER_ROLES.ADMIN]),
  ADMIN_AREA: Object.freeze([USER_ROLES.ADMIN]),
});

export const DEFAULT_PAGINATION = Object.freeze({
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
});
