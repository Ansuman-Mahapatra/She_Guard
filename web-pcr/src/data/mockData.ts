export interface Guardian {
  name: string;
  relation: string;
  phone: string;
  email?: string;
  smsStatus: "sent" | "delivered" | "failed";
  emailStatus?: "sent" | "opened" | "failed";
  tracking: boolean;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface EvidenceFile {
  id: string;
  type: "audio" | "photo" | "video";
  name: string;
  capturedAt: string;
  location: { lat: number; lng: number };
  size: string;
  duration?: string;
  ongoing?: boolean;
  url?: string;
}

export interface PoliceUnit {
  id: string;
  unitName: string;
  officers: string[];
  distance: string;
  eta: string;
  status: "en-route" | "arrived" | "available" | "busy";
  speed?: string;
}

export interface ResponseLogEntry {
  time: string;
  message: string;
}

export interface OfficerNote {
  time: string;
  officer: string;
  note: string;
}

export interface Emergency {
  id: string;
  victim: {
    name: string;
    age: number;
    phone: string;
    altPhone?: string;
    email: string;
    address: string;
    bloodGroup: string;
    medical?: string;
    registeredDate: string;
    previousSOS: number;
  };
  type: "ASSAULT" | "HARASSMENT" | "STALKING" | "ACCIDENT" | "MEDICAL" | "KIDNAPPING";
  status: "active" | "resolved" | "false-alarm";
  priority: "high" | "medium" | "low";
  triggeredAt: string;
  elapsedSeconds: number;
  triggerLocation: LocationPoint;
  currentLocation: LocationPoint;
  battery: number;
  connection: "online" | "offline" | "weak";
  signal: string;
  guardians: Guardian[];
  evidence: EvidenceFile[];
  assignedUnits: PoliceUnit[];
  backupUnits: PoliceUnit[];
  responseLog: ResponseLogEntry[];
  notes: OfficerNote[];
  locationHistory: LocationPoint[];
  totalDistance: number;
}

export const mockEmergencies: Emergency[] = [
  {
    id: "EMG-2024-001234",
    victim: {
      name: "Priya Sharma",
      age: 24,
      phone: "+91-9876543210",
      altPhone: "+91-9876543299",
      email: "priya.sharma@email.com",
      address: "Flat 304, Sai Residency, Patia, Bhubaneswar - 751024",
      bloodGroup: "O+",
      medical: "Asthma (carries inhaler)",
      registeredDate: "Jan 15, 2024",
      previousSOS: 1,
    },
    type: "ASSAULT",
    status: "active",
    priority: "high",
    triggeredAt: "09:45:23 PM",
    elapsedSeconds: 154,
    triggerLocation: { lat: 20.2961, lng: 85.8245, accuracy: 12, speed: 0, heading: 0, timestamp: "09:45:23 PM" },
    currentLocation: { lat: 20.2968, lng: 85.8251, accuracy: 15, speed: 5, heading: 45, timestamp: "09:47:58 PM" },
    battery: 67,
    connection: "online",
    signal: "4G",
    guardians: [
      { name: "Sunita Sharma", relation: "Mother", phone: "+91-9876543211", email: "sunita.sharma@email.com", smsStatus: "delivered", emailStatus: "opened", tracking: true },
      { name: "Anjali Sharma", relation: "Sister", phone: "+91-9876543212", smsStatus: "delivered", tracking: false },
      { name: "Neha Patel", relation: "Friend", phone: "+91-9876543213", smsStatus: "delivered", tracking: true },
    ],
    evidence: [
      { id: "ev1", type: "audio", name: "Audio Recording 1", capturedAt: "09:45:23 PM", location: { lat: 20.2961, lng: 85.8245 }, size: "2.3 MB", duration: "2:34", ongoing: true },
      { id: "ev2", type: "photo", name: "Photo Evidence 1", capturedAt: "09:46:10 PM", location: { lat: 20.2963, lng: 85.8247 }, size: "1.8 MB" },
      { id: "ev3", type: "photo", name: "Photo Evidence 2", capturedAt: "09:47:05 PM", location: { lat: 20.2966, lng: 85.825 }, size: "2.1 MB" },
    ],
    assignedUnits: [
      { id: "pcr23", unitName: "PCR-23", officers: ["Const. Rajesh Kumar", "Const. Amit Panda"], distance: "800m", eta: "2 min", status: "en-route", speed: "40 km/h" },
    ],
    backupUnits: [
      { id: "pcr45", unitName: "PCR-45", officers: ["Const. Suresh Nayak", "Const. Mohan Das"], distance: "1.5 km", eta: "4 min", status: "en-route" },
    ],
    responseLog: [
      { time: "09:45:25 PM", message: "Emergency received" },
      { time: "09:45:30 PM", message: "Unit PCR-23 dispatched" },
      { time: "09:45:45 PM", message: "Guardians notified" },
      { time: "09:46:00 PM", message: "Backup unit PCR-45 alerted" },
      { time: "09:47:58 PM", message: "Unit PCR-23 ETA 2 minutes" },
    ],
    notes: [
      { time: "09:45:30 PM", officer: "Officer Verma", note: "Dispatched PCR-23 to location. Victim moving towards Jayadev Vihar. Audio recording active." },
      { time: "09:46:15 PM", officer: "Officer Verma", note: "Mother confirmed victim was returning from work. Backup unit PCR-45 alerted." },
    ],
    locationHistory: [
      { lat: 20.2961, lng: 85.8245, accuracy: 12, speed: 0, heading: 0, timestamp: "09:45:23 PM" },
      { lat: 20.2962, lng: 85.8246, accuracy: 11, speed: 3, heading: 40, timestamp: "09:45:53 PM" },
      { lat: 20.2963, lng: 85.8247, accuracy: 12, speed: 5, heading: 42, timestamp: "09:46:23 PM" },
      { lat: 20.2964, lng: 85.8248, accuracy: 13, speed: 5, heading: 44, timestamp: "09:46:53 PM" },
      { lat: 20.2965, lng: 85.8249, accuracy: 11, speed: 5, heading: 45, timestamp: "09:47:23 PM" },
      { lat: 20.2966, lng: 85.825, accuracy: 12, speed: 6, heading: 45, timestamp: "09:47:46 PM" },
      { lat: 20.2967, lng: 85.825, accuracy: 14, speed: 4, heading: 45, timestamp: "09:47:52 PM" },
      { lat: 20.2968, lng: 85.8251, accuracy: 15, speed: 5, heading: 45, timestamp: "09:47:58 PM" },
    ],
    totalDistance: 450,
  },
  {
    id: "EMG-2024-001235",
    victim: {
      name: "Ritu Mishra",
      age: 30,
      phone: "+91-9123456780",
      email: "ritu.m@email.com",
      address: "House 12, Nayapalli, Bhubaneswar",
      bloodGroup: "A+",
      registeredDate: "Mar 20, 2024",
      previousSOS: 0,
    },
    type: "STALKING",
    status: "active",
    priority: "high",
    triggeredAt: "09:40:11 PM",
    elapsedSeconds: 462,
    triggerLocation: { lat: 20.2891, lng: 85.8190, accuracy: 10, speed: 0, heading: 0, timestamp: "09:40:11 PM" },
    currentLocation: { lat: 20.2900, lng: 85.8195, accuracy: 8, speed: 3, heading: 30, timestamp: "09:47:33 PM" },
    battery: 45,
    connection: "online",
    signal: "4G",
    guardians: [
      { name: "Ramesh Mishra", relation: "Father", phone: "+91-9123456781", smsStatus: "delivered", tracking: true },
      { name: "Kavita Mishra", relation: "Mother", phone: "+91-9123456782", smsStatus: "delivered", tracking: true },
    ],
    evidence: [
      { id: "ev4", type: "audio", name: "Audio Recording 1", capturedAt: "09:40:11 PM", location: { lat: 20.2891, lng: 85.819 }, size: "5.1 MB", duration: "7:22", ongoing: true },
    ],
    assignedUnits: [
      { id: "pcr12", unitName: "PCR-12", officers: ["Const. Deepak Sahoo"], distance: "1.2 km", eta: "3 min", status: "en-route" },
    ],
    backupUnits: [],
    responseLog: [
      { time: "09:40:15 PM", message: "Emergency received" },
      { time: "09:40:22 PM", message: "Unit PCR-12 dispatched" },
      { time: "09:40:30 PM", message: "Guardians notified" },
    ],
    notes: [
      { time: "09:40:22 PM", officer: "Officer Singh", note: "Victim reports being followed. PCR-12 dispatched." },
    ],
    locationHistory: [
      { lat: 20.2891, lng: 85.819, accuracy: 10, speed: 0, heading: 0, timestamp: "09:40:11 PM" },
      { lat: 20.2895, lng: 85.8192, accuracy: 9, speed: 3, heading: 30, timestamp: "09:43:11 PM" },
      { lat: 20.29, lng: 85.8195, accuracy: 8, speed: 3, heading: 30, timestamp: "09:47:33 PM" },
    ],
    totalDistance: 120,
  },
  {
    id: "EMG-2024-001236",
    victim: {
      name: "Ananya Das",
      age: 19,
      phone: "+91-9988776655",
      email: "ananya.d@email.com",
      address: "Room 201, Girls Hostel, KIIT University",
      bloodGroup: "B+",
      registeredDate: "Dec 05, 2023",
      previousSOS: 0,
    },
    type: "HARASSMENT",
    status: "active",
    priority: "medium",
    triggeredAt: "09:42:00 PM",
    elapsedSeconds: 358,
    triggerLocation: { lat: 20.3541, lng: 85.8143, accuracy: 18, speed: 0, heading: 0, timestamp: "09:42:00 PM" },
    currentLocation: { lat: 20.3541, lng: 85.8143, accuracy: 18, speed: 0, heading: 0, timestamp: "09:47:50 PM" },
    battery: 82,
    connection: "online",
    signal: "WiFi",
    guardians: [
      { name: "Sunil Das", relation: "Father", phone: "+91-9988776656", smsStatus: "delivered", tracking: true },
    ],
    evidence: [
      { id: "ev5", type: "photo", name: "Screenshot Evidence", capturedAt: "09:42:15 PM", location: { lat: 20.3541, lng: 85.8143 }, size: "0.8 MB" },
    ],
    assignedUnits: [],
    backupUnits: [],
    responseLog: [
      { time: "09:42:05 PM", message: "Emergency received" },
      { time: "09:42:10 PM", message: "Guardians notified" },
    ],
    notes: [],
    locationHistory: [
      { lat: 20.3541, lng: 85.8143, accuracy: 18, speed: 0, heading: 0, timestamp: "09:42:00 PM" },
    ],
    totalDistance: 0,
  },
  {
    id: "EMG-2024-001230",
    victim: {
      name: "Meera Patnaik",
      age: 35,
      phone: "+91-7654321098",
      email: "meera.p@email.com",
      address: "Plot 45, Chandrasekharpur, Bhubaneswar",
      bloodGroup: "AB+",
      registeredDate: "Nov 10, 2023",
      previousSOS: 2,
    },
    type: "ACCIDENT",
    status: "resolved",
    priority: "high",
    triggeredAt: "08:15:00 PM",
    elapsedSeconds: 5558,
    triggerLocation: { lat: 20.3250, lng: 85.8100, accuracy: 8, speed: 0, heading: 0, timestamp: "08:15:00 PM" },
    currentLocation: { lat: 20.3250, lng: 85.8100, accuracy: 8, speed: 0, heading: 0, timestamp: "08:45:00 PM" },
    battery: 34,
    connection: "offline",
    signal: "None",
    guardians: [
      { name: "Arun Patnaik", relation: "Husband", phone: "+91-7654321099", smsStatus: "delivered", tracking: false },
    ],
    evidence: [],
    assignedUnits: [
      { id: "pcr08", unitName: "PCR-08", officers: ["Const. Bikash Jena", "Const. Pradeep Mohanty"], distance: "0m", eta: "0 min", status: "arrived" },
    ],
    backupUnits: [],
    responseLog: [
      { time: "08:15:05 PM", message: "Emergency received" },
      { time: "08:15:15 PM", message: "Unit PCR-08 dispatched" },
      { time: "08:20:00 PM", message: "Unit PCR-08 arrived" },
      { time: "08:45:00 PM", message: "Emergency resolved - Victim taken to hospital" },
    ],
    notes: [
      { time: "08:20:00 PM", officer: "Officer Das", note: "Minor road accident. Victim conscious with minor injuries. Ambulance called." },
    ],
    locationHistory: [],
    totalDistance: 0,
  },
];

export const dashboardStats = {
  activeEmergencies: 3,
  highPriority: 2,
  onDutyOfficers: 45,
  availableUnits: 23,
  avgResponseTime: 4.2,
  coverage: 94,
};
