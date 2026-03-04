import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  module Bet {
    public type Bet = {
      user : Principal;
      marketId : Nat;
      selection : Nat;
      odds : Int;
      stake : Int;
      isBack : Bool;
      status : Text; // "matched", "settled", "cancelled"
    };

    public func compare(by1 : (Principal, MarketId), by2 : (Principal, MarketId)) : Order.Order {
      switch (Principal.compare(by1.0, by2.0)) {
        case (#less) { #less };
        case (#greater) { #greater };
        case (#equal) { Nat.compare(by1.1, by2.1) };
      };
    };
  };

  public type MarketId = Nat;

  public type Market = {
    id : MarketId;
    sport : Text;
    event : Text;
    selections : [Text];
    odds : [[Int]]; // [selection][back/lay]
    status : Text; // "open", "suspended", "settled"
  };

  public type UserProfile = {
    username : Text;
    balance : Int;
  };

  // State
  let markets = Map.empty<MarketId, Market>();
  let bets = Map.empty<(Principal, MarketId), Bet.Bet>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextMarketId = 0;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Market Management
  public shared ({ caller }) func createMarket(sport : Text, event : Text, selections : [Text], odds : [[Int]]) : async MarketId {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create markets");
    };

    let market : Market = {
      id = nextMarketId;
      sport;
      event;
      selections;
      odds;
      status = "open";
    };

    markets.add(nextMarketId, market);
    nextMarketId += 1;
    market.id;
  };

  public shared ({ caller }) func updateMarket(marketId : MarketId, status : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update markets");
    };

    switch (markets.get(marketId)) {
      case (null) { Runtime.trap("Market not found") };
      case (?market) {
        let updatedMarket = {
          market with status;
        };
        markets.add(marketId, updatedMarket);
      };
    };
  };

  public query ({ caller }) func getMarkets() : async [Market] {
    // No authorization check - markets are public information
    markets.values().toArray();
  };

  // Betting
  public shared ({ caller }) func placeBet(marketId : MarketId, selection : Nat, odds : Int, stake : Int, isBack : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bets");
    };

    // Validate market exists and is open
    switch (markets.get(marketId)) {
      case (null) { Runtime.trap("Market not found") };
      case (?market) {
        if (market.status != "open") {
          Runtime.trap("Market is not open for betting");
        };
      };
    };

    // Validate user has sufficient balance
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        if (profile.balance < stake) {
          Runtime.trap("Insufficient balance");
        };
        // Deduct stake from user balance
        let updatedProfile = {
          profile with balance = profile.balance - stake;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };

    let bet : Bet.Bet = {
      user = caller;
      marketId;
      selection;
      odds;
      stake;
      isBack;
      status = "matched";
    };

    bets.add((caller, marketId), bet);
  };

  public query ({ caller }) func getBets() : async [Bet.Bet] {
    // Users can only see their own bets, admins can see all bets
    if (AccessControl.isAdmin(accessControlState, caller)) {
      // Admin sees all bets
      bets.values().toArray();
    } else {
      // Regular users see only their own bets
      let userBets = bets.values().toArray().filter(
        func(bet : Bet.Bet) : Bool {
          bet.user == caller;
        },
      );
      userBets;
    };
  };

  // User Profiles
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Any caller can read their own profile, no role check needed
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateBalance(user : Principal, amount : Int) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update balance");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          profile with balance = profile.balance + amount;
        };
        userProfiles.add(user, updatedProfile);
      };
    };
  };
};
