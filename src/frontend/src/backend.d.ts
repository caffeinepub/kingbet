import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Market {
    id: MarketId;
    status: string;
    odds: Array<Array<bigint>>;
    event: string;
    sport: string;
    selections: Array<string>;
}
export interface Bet {
    status: string;
    odds: bigint;
    user: Principal;
    isBack: boolean;
    stake: bigint;
    selection: bigint;
    marketId: bigint;
}
export interface UserProfile {
    username: string;
    balance: bigint;
}
export type MarketId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMarket(sport: string, event: string, selections: Array<string>, odds: Array<Array<bigint>>): Promise<MarketId>;
    getBets(): Promise<Array<Bet>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMarkets(): Promise<Array<Market>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeBet(marketId: MarketId, selection: bigint, odds: bigint, stake: bigint, isBack: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBalance(user: Principal, amount: bigint): Promise<void>;
    updateMarket(marketId: MarketId, status: string): Promise<void>;
}
