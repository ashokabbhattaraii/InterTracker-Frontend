export type AttendanceStatus = "P" | "A" | "L" | "HD" | "AL" | "UL" | "CL" | "ND";

export interface Intern {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "intern" | "supervisor" | "admin";
  shift: string;
  joinDate: string;
  supervisor: string;
  attendanceRate: number;
  callsThisMonth: number;
  toursThisMonth: number;
  clBalance: number;
  clUsed: number;
  kpiStatus: "green" | "yellow" | "red";
}

export interface CallLog {
  id: string;
  internId: string;
  internName: string;
  date: string;
  callsMade: number;
  callsConnected: number;
  visitsBooked: number;
  registrations: number;
  notes: string;
}

export interface TourLog {
  id: string;
  internId: string;
  internName: string;
  date: string;
  visitorName: string;
  visitors: number;
  outcome: "Interested" | "Not Interested" | "Enrolled";
  notes: string;
}

export interface LeaveRequest {
  id: string;
  internId: string;
  internName: string;
  date: string;
  type: "AL" | "HD" | "CL";
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
}

export interface Alert {
  id: string;
  type: "late" | "absent" | "pattern" | "kpi" | "leave";
  message: string;
  internName: string;
  timestamp: string;
  read: boolean;
}

export const interns: Intern[] = [
  { id: "INT-01", name: "Aarav Sharma", email: "aarav@herald.edu.np", phone: "9841000001", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-15", supervisor: "Priya Thapa", attendanceRate: 96, callsThisMonth: 142, toursThisMonth: 8, clBalance: 2, clUsed: 1, kpiStatus: "green" },
  { id: "INT-02", name: "Sita Gurung", email: "sita@herald.edu.np", phone: "9841000002", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-15", supervisor: "Priya Thapa", attendanceRate: 88, callsThisMonth: 98, toursThisMonth: 5, clBalance: 1, clUsed: 2, kpiStatus: "yellow" },
  { id: "INT-03", name: "Bikash Adhikari", email: "bikash@herald.edu.np", phone: "9841000003", role: "intern", shift: "10:00 AM - 6:00 PM", joinDate: "2026-02-01", supervisor: "Priya Thapa", attendanceRate: 72, callsThisMonth: 65, toursThisMonth: 2, clBalance: 0, clUsed: 3, kpiStatus: "red" },
  { id: "INT-04", name: "Manisha KC", email: "manisha@herald.edu.np", phone: "9841000004", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-20", supervisor: "Priya Thapa", attendanceRate: 94, callsThisMonth: 130, toursThisMonth: 7, clBalance: 2, clUsed: 0, kpiStatus: "green" },
  { id: "INT-05", name: "Rohan Bhandari", email: "rohan@herald.edu.np", phone: "9841000005", role: "intern", shift: "10:00 AM - 6:00 PM", joinDate: "2026-02-01", supervisor: "Rajesh Shrestha", attendanceRate: 91, callsThisMonth: 115, toursThisMonth: 6, clBalance: 1, clUsed: 1, kpiStatus: "green" },
  { id: "INT-06", name: "Anjali Maharjan", email: "anjali@herald.edu.np", phone: "9841000006", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-15", supervisor: "Rajesh Shrestha", attendanceRate: 85, callsThisMonth: 88, toursThisMonth: 4, clBalance: 0, clUsed: 2, kpiStatus: "yellow" },
  { id: "INT-07", name: "Dipesh Tamang", email: "dipesh@herald.edu.np", phone: "9841000007", role: "intern", shift: "10:00 AM - 6:00 PM", joinDate: "2026-02-15", supervisor: "Rajesh Shrestha", attendanceRate: 78, callsThisMonth: 72, toursThisMonth: 3, clBalance: 1, clUsed: 1, kpiStatus: "red" },
  { id: "INT-08", name: "Kriti Rai", email: "kriti@herald.edu.np", phone: "9841000008", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-20", supervisor: "Rajesh Shrestha", attendanceRate: 98, callsThisMonth: 155, toursThisMonth: 10, clBalance: 3, clUsed: 0, kpiStatus: "green" },
  { id: "INT-09", name: "Sujan Karki", email: "sujan@herald.edu.np", phone: "9841000009", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-03-01", supervisor: "Priya Thapa", attendanceRate: 90, callsThisMonth: 108, toursThisMonth: 5, clBalance: 1, clUsed: 1, kpiStatus: "green" },
  { id: "INT-10", name: "Puja Basnet", email: "puja@herald.edu.np", phone: "9841000010", role: "intern", shift: "10:00 AM - 6:00 PM", joinDate: "2026-03-01", supervisor: "Rajesh Shrestha", attendanceRate: 82, callsThisMonth: 80, toursThisMonth: 3, clBalance: 0, clUsed: 2, kpiStatus: "yellow" },
  { id: "INT-11", name: "Anil Shrestha", email: "anil@herald.edu.np", phone: "9841000011", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-01-15", supervisor: "Priya Thapa", attendanceRate: 95, callsThisMonth: 138, toursThisMonth: 9, clBalance: 2, clUsed: 1, kpiStatus: "green" },
  { id: "INT-12", name: "Sabina Lama", email: "sabina@herald.edu.np", phone: "9841000012", role: "intern", shift: "9:00 AM - 5:00 PM", joinDate: "2026-02-01", supervisor: "Priya Thapa", attendanceRate: 69, callsThisMonth: 55, toursThisMonth: 1, clBalance: 0, clUsed: 3, kpiStatus: "red" },
];

export const attendanceGrid: Record<string, Record<string, AttendanceStatus>> = {
  "INT-01": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "L", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "CL", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-02": { "2026-06-01": "P", "2026-06-02": "L", "2026-06-03": "P", "2026-06-04": "A", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "L", "2026-06-11": "P", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "AL", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "P", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "L", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-03": { "2026-06-01": "P", "2026-06-02": "A", "2026-06-03": "A", "2026-06-04": "P", "2026-06-05": "UL", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "A", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "L", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "A", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "UL", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "A", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "L", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-04": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "P", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "P", "2026-06-13": "AL", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "P", "2026-06-29": "P" },
  "INT-05": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "L", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "P", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "AL", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-06": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "A", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "L", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "A", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "A", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "HD", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-07": { "2026-06-01": "P", "2026-06-02": "A", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "UL", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "A", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "A", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "L", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "A", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "UL", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-08": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "P", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "P", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "P", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "P", "2026-06-29": "P" },
  "INT-09": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "L", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "AL", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "L", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-10": { "2026-06-01": "P", "2026-06-02": "A", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "L", "2026-06-07": "ND", "2026-06-08": "P", "2026-06-09": "A", "2026-06-10": "P", "2026-06-11": "P", "2026-06-12": "P", "2026-06-13": "HD", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "A", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "A", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-11": { "2026-06-01": "P", "2026-06-02": "P", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "P", "2026-06-06": "P", "2026-06-07": "P", "2026-06-08": "P", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "L", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "P", "2026-06-16": "P", "2026-06-17": "P", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "P", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "P", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "CL", "2026-06-27": "P", "2026-06-28": "ND", "2026-06-29": "P" },
  "INT-12": { "2026-06-01": "A", "2026-06-02": "A", "2026-06-03": "P", "2026-06-04": "P", "2026-06-05": "UL", "2026-06-06": "P", "2026-06-07": "ND", "2026-06-08": "A", "2026-06-09": "P", "2026-06-10": "P", "2026-06-11": "A", "2026-06-12": "P", "2026-06-13": "P", "2026-06-14": "ND", "2026-06-15": "UL", "2026-06-16": "P", "2026-06-17": "A", "2026-06-18": "P", "2026-06-19": "P", "2026-06-20": "A", "2026-06-21": "ND", "2026-06-22": "P", "2026-06-23": "A", "2026-06-24": "P", "2026-06-25": "P", "2026-06-26": "P", "2026-06-27": "UL", "2026-06-28": "ND", "2026-06-29": "P" },
};

export const callLogs: CallLog[] = [
  { id: "CL001", internId: "INT-01", internName: "Aarav Sharma", date: "2026-06-29", callsMade: 18, callsConnected: 12, visitsBooked: 3, registrations: 1, notes: "Good conversion rate today" },
  { id: "CL002", internId: "INT-02", internName: "Sita Gurung", date: "2026-06-29", callsMade: 12, callsConnected: 7, visitsBooked: 1, registrations: 0, notes: "" },
  { id: "CL003", internId: "INT-04", internName: "Manisha KC", date: "2026-06-29", callsMade: 16, callsConnected: 10, visitsBooked: 2, registrations: 1, notes: "Student very interested in BIT" },
  { id: "CL004", internId: "INT-05", internName: "Rohan Bhandari", date: "2026-06-29", callsMade: 14, callsConnected: 9, visitsBooked: 2, registrations: 0, notes: "" },
  { id: "CL005", internId: "INT-08", internName: "Kriti Rai", date: "2026-06-29", callsMade: 22, callsConnected: 15, visitsBooked: 4, registrations: 2, notes: "Excellent day! Multiple parents confirmed visits" },
  { id: "CL006", internId: "INT-09", internName: "Sujan Karki", date: "2026-06-29", callsMade: 15, callsConnected: 8, visitsBooked: 2, registrations: 1, notes: "" },
  { id: "CL007", internId: "INT-11", internName: "Anil Shrestha", date: "2026-06-29", callsMade: 17, callsConnected: 11, visitsBooked: 3, registrations: 1, notes: "" },
  { id: "CL008", internId: "INT-06", internName: "Anjali Maharjan", date: "2026-06-29", callsMade: 10, callsConnected: 5, visitsBooked: 1, registrations: 0, notes: "Many numbers not reachable" },
];

export const tourLogs: TourLog[] = [
  { id: "TL001", internId: "INT-01", internName: "Aarav Sharma", date: "2026-06-29", visitorName: "Ramesh Poudel", visitors: 3, outcome: "Interested", notes: "Father and two siblings, interested in BBA" },
  { id: "TL002", internId: "INT-08", internName: "Kriti Rai", date: "2026-06-29", visitorName: "Sunita Tamang", visitors: 2, outcome: "Enrolled", notes: "Enrolled for BIT immediately after tour" },
  { id: "TL003", internId: "INT-04", internName: "Manisha KC", date: "2026-06-28", visitorName: "Bijay Lama", visitors: 1, outcome: "Interested", notes: "Wants to visit again next week" },
  { id: "TL004", internId: "INT-11", internName: "Anil Shrestha", date: "2026-06-28", visitorName: "Suman Rai", visitors: 4, outcome: "Enrolled", notes: "Family visit, student enrolled in BIBM" },
  { id: "TL005", internId: "INT-05", internName: "Rohan Bhandari", date: "2026-06-27", visitorName: "Pradeep Karki", visitors: 2, outcome: "Not Interested", notes: "Wanted BSc which we don't offer" },
  { id: "TL006", internId: "INT-08", internName: "Kriti Rai", date: "2026-06-27", visitorName: "Anita Shrestha", visitors: 2, outcome: "Enrolled", notes: "Instant enrollment after seeing labs" },
];

export const leaveRequests: LeaveRequest[] = [
  { id: "LR001", internId: "INT-02", internName: "Sita Gurung", date: "2026-06-30", type: "AL", reason: "Family function", status: "pending", appliedOn: "2026-06-28" },
  { id: "LR002", internId: "INT-06", internName: "Anjali Maharjan", date: "2026-07-01", type: "CL", reason: "Personal work", status: "pending", appliedOn: "2026-06-29" },
  { id: "LR003", internId: "INT-09", internName: "Sujan Karki", date: "2026-07-02", type: "HD", reason: "Doctor appointment in afternoon", status: "pending", appliedOn: "2026-06-29" },
  { id: "LR004", internId: "INT-01", internName: "Aarav Sharma", date: "2026-06-25", type: "CL", reason: "Personal errand", status: "approved", appliedOn: "2026-06-23" },
  { id: "LR005", internId: "INT-03", internName: "Bikash Adhikari", date: "2026-06-20", type: "AL", reason: "Sick", status: "rejected", appliedOn: "2026-06-20" },
  { id: "LR006", internId: "INT-10", internName: "Puja Basnet", date: "2026-06-18", type: "AL", reason: "Wedding attendance", status: "approved", appliedOn: "2026-06-16" },
];

export const alerts: Alert[] = [
  { id: "A001", type: "late", message: "checked in 22 minutes late", internName: "Sita Gurung", timestamp: "2026-06-29 09:22", read: false },
  { id: "A002", type: "absent", message: "absent without prior leave request", internName: "Bikash Adhikari", timestamp: "2026-06-29 09:30", read: false },
  { id: "A003", type: "kpi", message: "below call target for 3 consecutive days", internName: "Dipesh Tamang", timestamp: "2026-06-29 10:00", read: false },
  { id: "A004", type: "pattern", message: "absent every Monday for past 3 weeks", internName: "Sabina Lama", timestamp: "2026-06-29 08:00", read: true },
  { id: "A005", type: "leave", message: "leave request pending for 24+ hours", internName: "Sita Gurung", timestamp: "2026-06-29 09:00", read: true },
  { id: "A006", type: "kpi", message: "attendance rate dropped below 75%", internName: "Bikash Adhikari", timestamp: "2026-06-28 17:00", read: true },
];

export const todayStats = {
  present: 9,
  absent: 2,
  late: 1,
  totalInterns: 12,
  totalCallsToday: 124,
  totalToursToday: 2,
  pendingLeaves: 3,
  notCheckedIn: ["Bikash Adhikari", "Sabina Lama"],
};
