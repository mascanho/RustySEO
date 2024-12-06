interface Section {
  title: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
  assignee?: {
    name: string;
    avatar: string;
  };
}

const sections: Section[] = [
  {
    title: "Technical",
    tasks: [
      {
        id: "1",
        title: "Update component library to match storybook",
        completed: false,
        inProgress: true,
        assignee: {
          name: "Alice",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "2",
        title: "Refactor main components to match system 1.4",
        completed: false,
        assignee: {
          name: "Bob",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "3",
        title: "Implement API integration",
        completed: true,
        assignee: {
          name: "Charlie",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
  {
    title: "On-Page",
    tasks: [
      {
        id: "4",
        title: "Design homepage layout",
        completed: true,
        assignee: {
          name: "Diana",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "5",
        title: "Optimize page load time",
        completed: false,
        inProgress: true,
        assignee: {
          name: "Eve",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
  {
    title: "Off-Page",
    tasks: [
      {
        id: "6",
        title: "Create content strategy",
        completed: true,
        assignee: {
          name: "Frank",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
      {
        id: "7",
        title: "Plan social media campaign",
        completed: false,
        assignee: {
          name: "Grace",
          avatar: "/placeholder.svg?height=32&width=32",
        },
      },
    ],
  },
];

export default sections;
