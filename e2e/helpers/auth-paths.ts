import path from "path";

const AUTH_DIR = path.join(process.cwd(), "e2e/.auth");

export const BUYER_AUTH  = path.join(AUTH_DIR, "buyer.json");
export const SELLER_AUTH = path.join(AUTH_DIR, "seller.json");
