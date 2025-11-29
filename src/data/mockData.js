export const initialCallData = {
    callerName: "Rajesh Kumar",
    age: 65,
    phone: "+91-98765-43210",
    location: "Dadar Station",
    coordinates: [19.0178, 72.8478],
    incidentType: "Cardiac Arrest",
};

export const initialSituationData = {
    symptoms: ["Unconscious", "Not breathing", "Severe chest pain"],
    isUnconscious: true,
    isNotBreathing: true,
    fakeProbability: 15, // 15%
};

export const mockLocations = {
    "Dadar Station": [19.0178, 72.8478],
    "Gateway of India": [18.9220, 72.8347],
    "Bandra Bandstand": [19.0596, 72.8295],
    "Juhu Beach": [19.0988, 72.8264],
    "Andheri Station": [19.1136, 72.8697],
    "Powai Lake": [19.1267, 72.9156],
    "Marine Drive": [18.944, 72.823],
    "Chhatrapati Shivaji Maharaj Terminus": [18.9415, 72.8352]
};

export const initialResources = [
    {
        id: "AMB-042",
        type: "Ambulance (ALS)",
        eta: 5.2,
        distance: 2.1,
        isAiSuggested: true,
        coordinates: [19.0250, 72.8550],
        baseCoordinates: [19.0250, 72.8550]
    },
    {
        id: "AMB-018",
        type: "Ambulance (BLS)",
        eta: 8.5,
        distance: 4.2,
        isAiSuggested: false,
        coordinates: [19.0400, 72.8300],
        baseCoordinates: [19.0400, 72.8300]
    },
    {
        id: "FIRE-101",
        type: "Fire Engine",
        eta: 6.0,
        distance: 3.5,
        isAiSuggested: false,
        coordinates: [19.0100, 72.8600],
        baseCoordinates: [19.0100, 72.8600]
    },
    {
        id: "POL-555",
        type: "Police Patrol",
        eta: 4.0,
        distance: 1.8,
        isAiSuggested: false,
        coordinates: [19.0150, 72.8350],
        baseCoordinates: [19.0150, 72.8350]
    },
    {
        id: "AMB-099",
        type: "Ambulance (ALS)",
        eta: 12.0,
        distance: 8.5,
        isAiSuggested: false,
        coordinates: [19.0600, 72.8400],
        baseCoordinates: [19.0600, 72.8400]
    },
    {
        id: "POL-100",
        type: "Police SUV",
        eta: 2.5,
        distance: 1.2,
        isAiSuggested: false,
        coordinates: [19.0120, 72.8450],
        baseCoordinates: [19.0120, 72.8450]
    },
    {
        id: "FIRE-202",
        type: "Ladder Truck",
        eta: 15.0,
        distance: 10.0,
        isAiSuggested: false,
        coordinates: [19.0800, 72.8800],
        baseCoordinates: [19.0800, 72.8800]
    }
];

export const protocolSteps = [
    "Verify scene safety",
    "Check responsiveness",
    "Call for additional resources",
    "Check breathing and pulse",
    "Begin CPR if no pulse",
    "Attach AED as soon as available",
    "Administer Epinephrine",
    "Secure airway",
    "Monitor vitals",
    "Prepare for transport",
];
