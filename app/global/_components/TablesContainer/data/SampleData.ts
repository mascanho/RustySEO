// @ts-nocheck
import type { Column, Data, CellData, TabData } from "../types/table";

export const columns: Column[] = [
  { Header: "ID", accessor: "id" },
  { Header: "Name", accessor: "name" },
  { Header: "Email", accessor: "email" },
  { Header: "Age", accessor: "age" },
  { Header: "City", accessor: "city" },
  { Header: "Country", accessor: "country" },
  { Header: "Occupation", accessor: "occupation" },
  { Header: "Salary", accessor: "salary" },
  { Header: "Start Date", accessor: "startDate" },
  { Header: "Department", accessor: "department" },
  { Header: "Performance", accessor: "performance" },
  { Header: "Projects", accessor: "projects" },
];

export const data: Data[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    city: "New York",
    country: "USA",
    occupation: "Developer",
    salary: 85000,
    startDate: "2020-01-15",
    department: "IT",
    performance: "Excellent",
    projects: 5,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    city: "London",
    country: "UK",
    occupation: "Designer",
    salary: 75000,
    startDate: "2019-11-01",
    department: "Design",
    performance: "Good",
    projects: 4,
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    age: 35,
    city: "Paris",
    country: "France",
    occupation: "Manager",
    salary: 95000,
    startDate: "2018-06-22",
    department: "Management",
    performance: "Very Good",
    projects: 7,
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    age: 27,
    city: "Tokyo",
    country: "Japan",
    occupation: "Engineer",
    salary: 80000,
    startDate: "2021-03-10",
    department: "Engineering",
    performance: "Excellent",
    projects: 3,
  },
  {
    id: 5,
    name: "Charlie Wilson",
    email: "charlie@example.com",
    age: 32,
    city: "Sydney",
    country: "Australia",
    occupation: "Consultant",
    salary: 90000,
    startDate: "2019-09-05",
    department: "Consulting",
    performance: "Good",
    projects: 6,
  },
];

export const cellDetails: { [key: string]: CellData } = {
  "0-id": {
    details: {
      id: 1,
      description: "Unique identifier for the employee",
      dataType: "Integer",
      isNullable: false,
      autoIncrement: true,
      primaryKey: true,
    },
    history: [
      { date: "2020-01-15", event: "Created", user: "System" },
      { date: "2020-01-15", event: "Assigned", user: "HR Manager" },
      { date: "2023-05-01", event: "Verified", user: "Data Analyst" },
    ],
    related: [
      { id: 101, name: "Employee Record", relation: "Primary Key" },
      { id: 201, name: "Payroll", relation: "Foreign Key" },
      { id: 301, name: "Project Assignments", relation: "Foreign Key" },
    ],
  },
  "0-name": {
    details: {
      name: "John Doe",
      fullName: "John Michael Doe",
      preferredName: "Johnny",
      pronunciation: "jon doh",
      nameOrigin: "English",
      title: "Mr.",
    },
    history: [
      { date: "2020-01-15", event: "Hired", user: "HR Manager" },
      { date: "2021-06-01", event: "Name Updated", user: "John Doe" },
      { date: "2022-12-10", event: "Verified", user: "HR Assistant" },
    ],
    related: [
      { id: 501, name: "Emergency Contact", relation: "Family Member" },
      { id: 601, name: "Team Alpha", relation: "Member" },
      { id: 701, name: "Employee Directory", relation: "Listed" },
    ],
  },
  "0-email": {
    details: {
      email: "john@example.com",
      isVerified: true,
      alternateEmail: "johndoe@personal.com",
      communicationPreference: "Email",
      emailSignature: "Best regards, John Doe",
      lastEmailSent: "2023-05-10T14:30:00Z",
    },
    history: [
      { date: "2020-01-15", event: "Created", user: "System" },
      { date: "2020-01-16", event: "Verified", user: "John Doe" },
      { date: "2022-03-22", event: "Updated", user: "John Doe" },
      {
        date: "2023-01-05",
        event: "Alternate Email Added",
        user: "IT Support",
      },
    ],
    related: [
      { id: 801, name: "IT Support Tickets", relation: "Contact Email" },
      { id: 901, name: "Project Notifications", relation: "Recipient" },
      { id: 1001, name: "Company Newsletter", relation: "Subscriber" },
    ],
  },
  "0-age": {
    details: {
      age: 30,
      dateOfBirth: "1993-05-15",
      ageGroup: "30-35",
      generation: "Millennial",
      zodiacSign: "Taurus",
    },
    history: [
      { date: "2020-01-15", event: "Recorded", user: "HR Manager" },
      { date: "2023-05-15", event: "Updated", user: "System" },
      { date: "2023-05-16", event: "Age Group Assigned", user: "HR Analyst" },
    ],
    related: [
      { id: 1101, name: "Benefits Eligibility", relation: "Age-based" },
      { id: 1201, name: "Retirement Planning", relation: "Age-based" },
      { id: 1301, name: "Training Programs", relation: "Generation-specific" },
    ],
  },
  "0-city": {
    details: {
      city: "New York",
      state: "New York",
      country: "USA",
      timezone: "Eastern Time Zone (ET)",
      population: "8.4 million",
      officeLocation: "Manhattan",
    },
    history: [
      { date: "2020-01-15", event: "Recorded", user: "HR Manager" },
      { date: "2022-08-01", event: "Verified", user: "Office Manager" },
      {
        date: "2023-02-15",
        event: "Office Location Updated",
        user: "Facilities Manager",
      },
    ],
    related: [
      { id: 1401, name: "Office Location", relation: "Based In" },
      { id: 1501, name: "Local Tax", relation: "Jurisdiction" },
      { id: 1601, name: "Travel Expenses", relation: "Home Base" },
    ],
  },
  "0-country": {
    details: {
      country: "USA",
      fullName: "United States of America",
      capital: "Washington, D.C.",
      currency: "USD",
      language: "English",
      timeZones: "Multiple (EST, CST, MST, PST, AKST, HST)",
    },
    history: [
      { date: "2020-01-15", event: "Recorded", user: "HR Manager" },
      { date: "2022-09-01", event: "Verified", user: "Compliance Officer" },
    ],
    related: [
      { id: 1701, name: "Payroll", relation: "Tax Jurisdiction" },
      { id: 1801, name: "Benefits", relation: "Country-specific" },
      { id: 1901, name: "Work Visa", relation: "Not Required (Citizen)" },
    ],
  },
  "0-occupation": {
    details: {
      occupation: "Developer",
      jobTitle: "Senior Software Developer",
      department: "IT",
      skillLevel: "Advanced",
      yearsOfExperience: 8,
      programmingLanguages: ["JavaScript", "Python", "Java", "C#"],
    },
    history: [
      { date: "2020-01-15", event: "Hired as Developer", user: "HR Manager" },
      {
        date: "2021-06-01",
        event: "Promoted to Senior Developer",
        user: "IT Manager",
      },
      { date: "2022-12-10", event: "Skills Assessment", user: "Team Lead" },
    ],
    related: [
      { id: 2001, name: "IT Department", relation: "Member" },
      { id: 2101, name: "Project Alpha", relation: "Lead Developer" },
      { id: 2201, name: "Tech Stack Committee", relation: "Member" },
    ],
  },
};

export const tabData: { [key: string]: TabData } = {
  employees: { columns, data },
  departments: {
    columns: [
      { Header: "ID", accessor: "id" },
      { Header: "Name", accessor: "name" },
      { Header: "Manager", accessor: "manager" },
      { Header: "Budget", accessor: "budget" },
    ],
    data: [
      { id: 1, name: "IT", manager: "John Doe", budget: "$500,000" },
      { id: 2, name: "HR", manager: "Jane Smith", budget: "$300,000" },
      { id: 3, name: "Marketing", manager: "Bob Johnson", budget: "$400,000" },
    ],
  },
  projects: {
    columns: [
      { Header: "ID", accessor: "id" },
      { Header: "Name", accessor: "name" },
      { Header: "Status", accessor: "status" },
      { Header: "Deadline", accessor: "deadline" },
    ],
    data: [
      {
        id: 1,
        name: "Website Redesign",
        status: "In Progress",
        deadline: "2023-08-31",
      },
      {
        id: 2,
        name: "Mobile App Development",
        status: "Planning",
        deadline: "2023-12-15",
      },
      {
        id: 3,
        name: "Data Migration",
        status: "Completed",
        deadline: "2023-05-01",
      },
    ],
  },
};
