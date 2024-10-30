import Hash "mo:base/Hash";

import Array "mo:base/Array";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor WebBuilder {
    // Type definitions
    type Design = {
        elements: [Element];
        history: [HistoryAction];
        deviceView: Text;
    };

    type Element = {
        id: Text;
        type_: Text;
        position: Position;
        styles: Text;
    };

    type Position = {
        x: Nat;
        y: Nat;
    };

    type HistoryAction = {
        type_: Text;
        elementId: ?Text;
        property: ?Text;
        value: ?Text;
        position: ?Position;
    };

    // State variables
    private stable var designEntries : [(Principal, Text)] = [];
    private var designs = HashMap.HashMap<Principal, Text>(10, Principal.equal, Principal.hash);

    // Initialize state from stable variables
    system func preupgrade() {
        designEntries := Iter.toArray(designs.entries());
    };

    system func postupgrade() {
        designs := HashMap.fromIter<Principal, Text>(designEntries.vals(), 10, Principal.equal, Principal.hash);
    };

    // Save a design
    public shared(msg) func saveDesign(designData: Text) : async () {
        let caller = msg.caller;
        designs.put(caller, designData);
        Debug.print("Design saved for user: " # Principal.toText(caller));
    };

    // Load a design
    public shared(msg) func loadDesign() : async ?Text {
        let caller = msg.caller;
        let design = designs.get(caller);
        switch (design) {
            case (null) {
                Debug.print("No design found for user: " # Principal.toText(caller));
                null
            };
            case (?d) {
                Debug.print("Design loaded for user: " # Principal.toText(caller));
                ?d
            };
        };
    };

    // Publish a design
    public shared(msg) func publishDesign(designData: Text) : async Text {
        let caller = msg.caller;
        // In a real-world scenario, you would generate a unique URL and store the design data
        // For this example, we'll just return a mock URL
        let mockUrl = "https://webbuilder.ic0.app/" # Principal.toText(caller);
        Debug.print("Design published for user: " # Principal.toText(caller) # " at URL: " # mockUrl);
        mockUrl
    };

    // Helper function to convert Principal to Text
    public func principalToText(p: Principal) : async Text {
        Principal.toText(p)
    };
}
