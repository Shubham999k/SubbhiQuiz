import dotenv from "dotenv";
import Category from "./models/Category.js";
import Question from "./models/Question.js";
import connectDB from "./config/db.js";

// Since the frontend mock data is just JS objects, we can copy them here for the seed script
// to avoid cross-workspace import issues.
const categories = [
  {
    id: "python",
    title: "Python",
    description:
      "Test your knowledge of Python syntax, data structures, and algorithms.",
    icon: "FileCode2",
  },
  {
    id: "java",
    title: "Java",
    description:
      "Object-oriented programming concepts, core Java, and best practices.",
    icon: "Coffee",
  },
  {
    id: "react",
    title: "React",
    description:
      "Component lifecycle, hooks, context API, and advanced React patterns.",
    icon: "Code2",
  },
  {
    id: "javascript",
    title: "JavaScript",
    description:
      "ES6+, closures, asynchronous programming, and DOM manipulation.",
    icon: "TerminalSquare",
  },
  {
    id: "html",
    title: "HTML",
    description:
      "Semantic HTML, forms, accessibility, and modern web standards.",
    icon: "Layout",
  },
  {
    id: "css",
    title: "CSS",
    description:
      "Flexbox, Grid, animations, and responsive web design techniques.",
    icon: "Palette",
  },
  {
    id: "sql",
    title: "SQL",
    description:
      "Query writing, joins, indexing, and database design principles.",
    icon: "Database",
  },
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    description:
      "Arrays, trees, graphs, sorting, searching, and complexity analysis.",
    icon: "Network",
  },
];

const questions = [
  {
    category: "python",
    difficulty: "easy",
    text: "What is the output of the following Python code?\n\nprint(type([]))",
    options: [
      "<class 'list'>",
      "<class 'array'>",
      "<class 'tuple'>",
      "<class 'set'>",
    ],
    correctAnswer: 0,
  },
  {
    category: "python",
    difficulty: "easy",
    text: "Which of the following is not a valid variable name in Python?",
    options: ["my_var", "myVar", "2nd_var", "_my_var"],
    correctAnswer: 2,
  },
  {
    category: "python",
    difficulty: "medium",
    text: "What is the output of the following Python code?\n\nx = [1, 2, 3]\ny = x\ny[0] = 4\nprint(x)",
    options: ["[1, 2, 3]", "[4, 2, 3]", "[4]", "Error"],
    correctAnswer: 1,
  },
  {
    category: "python",
    difficulty: "medium",
    text: "Which keyword is used to handle exceptions in Python?",
    options: ["catch", "except", "handle", "try"],
    correctAnswer: 1,
  },
  {
    category: "python",
    difficulty: "hard",
    text: "What does the following list comprehension evaluate to?\n\n[x for x in range(5) if x % 2 == 0]",
    options: ["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "[2, 4]"],
    correctAnswer: 0,
  },
  {
    category: "python",
    difficulty: "hard",
    text: "What is the purpose of the 'yield' keyword in Python?",
    options: [
      "To pause the execution of a function",
      "To return a value and terminate a function",
      "To define a generator function",
      "To raise an exception",
    ],
    correctAnswer: 2,
  },
  {
    category: "java",
    difficulty: "easy",
    text: "Which data type is used to create a variable that should store text?",
    options: ["String", "string", "Txt", "myString"],
    correctAnswer: 0,
  },
  {
    category: "java",
    difficulty: "easy",
    text: "How do you create a single-line comment in Java?",
    options: ["// comment", "/* comment", "<!-- comment -->", "# comment"],
    correctAnswer: 0,
  },
  {
    category: "java",
    difficulty: "medium",
    text: "What is the size of an int variable in Java?",
    options: ["8 bits", "16 bits", "32 bits", "64 bits"],
    correctAnswer: 2,
  },
  {
    category: "java",
    difficulty: "medium",
    text: "Which of these access specifiers can be used for an interface in Java?",
    options: ["public", "protected", "private", "All of the above"],
    correctAnswer: 0,
  },
  {
    category: "java",
    difficulty: "hard",
    text: "What is the difference between '==' and '.equals()' in Java?",
    options: [
      "'==' compares object references, '.equals()' compares values",
      "'==' compares values, '.equals()' compares object references",
      "Both compare values",
      "Both compare object references",
    ],
    correctAnswer: 0,
  },
  {
    category: "javascript",
    difficulty: "easy",
    text: "Inside which HTML element do we put the JavaScript?",
    options: ["<scripting>", "<script>", "<javascript>", "<js>"],
    correctAnswer: 1,
  },
  {
    category: "javascript",
    difficulty: "easy",
    text: "How do you write 'Hello World' in an alert box?",
    options: [
      "alert('Hello World');",
      "msg('Hello World');",
      "msgBox('Hello World');",
      "alertBox('Hello World');",
    ],
    correctAnswer: 0,
  },
  {
    category: "javascript",
    difficulty: "medium",
    text: "What is the output of 'typeof null' in JavaScript?",
    options: ["'null'", "'undefined'", "'object'", "'string'"],
    correctAnswer: 2,
  },
  {
    category: "javascript",
    difficulty: "medium",
    text: "Which of the following methods is used to access an HTML element by id?",
    options: [
      "getElementById()",
      "getElement(id)",
      "getElementByID()",
      "getIdElement()",
    ],
    correctAnswer: 0,
  },
  {
    category: "javascript",
    difficulty: "hard",
    text: "What does the 'this' keyword refer to in an arrow function?",
    options: [
      "The global object",
      "The element that triggered the event",
      "The object that owns the function",
      "The lexical scope surrounding the arrow function",
    ],
    correctAnswer: 3,
  },
  {
    category: "react",
    difficulty: "easy",
    text: "What is React?",
    options: [
      "A JavaScript framework for building user interfaces",
      "A JavaScript library for building user interfaces",
      "A CSS framework",
      "A database management system",
    ],
    correctAnswer: 1,
  },
  {
    category: "react",
    difficulty: "easy",
    text: "Which hook is used to manage state in a functional component?",
    options: ["useEffect", "useContext", "useState", "useReducer"],
    correctAnswer: 2,
  },
  {
    category: "react",
    difficulty: "medium",
    text: "What is the purpose of the 'key' prop in React lists?",
    options: [
      "To identify which items have changed, been added, or been removed",
      "To style list items",
      "To set the index of the list item",
      "To trigger an event when clicked",
    ],
    correctAnswer: 0,
  },
  {
    category: "react",
    difficulty: "medium",
    text: "What does useEffect do if you pass an empty array as the second argument?",
    options: [
      "It runs after every render",
      "It runs only once after the initial render",
      "It never runs",
      "It runs on unmount only",
    ],
    correctAnswer: 1,
  },
  {
    category: "react",
    difficulty: "hard",
    text: "What is the Virtual DOM?",
    options: [
      "A direct copy of the real DOM kept in the browser's memory",
      "A lightweight, in-memory representation of the real DOM",
      "A CSS processor used by React",
      "An alternative to the DOM used in older browsers",
    ],
    correctAnswer: 1,
  },
  {
    category: "html",
    difficulty: "easy",
    text: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language",
      "Hyper Tool Markup Language",
    ],
    correctAnswer: 0,
  },
  {
    category: "html",
    difficulty: "easy",
    text: "Who is making the Web standards?",
    options: [
      "Mozilla",
      "Microsoft",
      "The World Wide Web Consortium",
      "Google",
    ],
    correctAnswer: 2,
  },
  {
    category: "html",
    difficulty: "medium",
    text: "Choose the correct HTML element for the largest heading:",
    options: ["<h6>", "<head>", "<h1>", "<heading>"],
    correctAnswer: 2,
  },
  {
    category: "html",
    difficulty: "medium",
    text: "What is the correct HTML for creating a hyperlink?",
    options: [
      "<a url='http://www.w3schools.com'>W3Schools.com</a>",
      "<a name='http://www.w3schools.com'>W3Schools.com</a>",
      "<a href='http://www.w3schools.com'>W3Schools</a>",
      "<a>http://www.w3schools.com</a>",
    ],
    correctAnswer: 2,
  },
  {
    category: "css",
    difficulty: "easy",
    text: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Colorful Style Sheets",
    ],
    correctAnswer: 2,
  },
  {
    category: "css",
    difficulty: "easy",
    text: "Where in an HTML document is the correct place to refer to an external style sheet?",
    options: [
      "In the <body> section",
      "In the <head> section",
      "At the end of the document",
      "Before the <html> tag",
    ],
    correctAnswer: 1,
  },
  {
    category: "css",
    difficulty: "medium",
    text: "Which HTML tag is used to define an internal style sheet?",
    options: ["<style>", "<script>", "<css>", "<link>"],
    correctAnswer: 0,
  },
  {
    category: "css",
    difficulty: "medium",
    text: "Which CSS property is used to change the background color?",
    options: ["color", "bgcolor", "background-color", "bg-color"],
    correctAnswer: 2,
  },
  {
    category: "sql",
    difficulty: "easy",
    text: "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Strong Question Language",
      "Structured Question Language",
      "System Query Language",
    ],
    correctAnswer: 0,
  },
  {
    category: "sql",
    difficulty: "easy",
    text: "Which SQL statement is used to extract data from a database?",
    options: ["EXTRACT", "SELECT", "GET", "OPEN"],
    correctAnswer: 1,
  },
  {
    category: "sql",
    difficulty: "medium",
    text: "Which SQL statement is used to update data in a database?",
    options: ["SAVE", "MODIFY", "UPDATE", "SAVE AS"],
    correctAnswer: 2,
  },
  {
    category: "sql",
    difficulty: "medium",
    text: "Which SQL statement is used to delete data from a database?",
    options: ["REMOVE", "COLLAPSE", "DELETE", "CLEAR"],
    correctAnswer: 2,
  },
  {
    category: "sql",
    difficulty: "hard",
    text: "What does the UNION operator do?",
    options: [
      "Combines the result sets of two or more SELECT statements",
      "Returns true if any of the subqueries meet the condition",
      "Returns the intersection of two queries",
      "Filters records based on multiple conditions",
    ],
    correctAnswer: 0,
  },
  {
    category: "dsa",
    difficulty: "easy",
    text: "Which data structure uses LIFO (Last In First Out)?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctAnswer: 1,
  },
  {
    category: "dsa",
    difficulty: "easy",
    text: "Which data structure uses FIFO (First In First Out)?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctAnswer: 0,
  },
  {
    category: "dsa",
    difficulty: "medium",
    text: "What is the time complexity of a binary search on a sorted array?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctAnswer: 2,
  },
  {
    category: "dsa",
    difficulty: "medium",
    text: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
    correctAnswer: 2,
  },
  {
    category: "dsa",
    difficulty: "hard",
    text: "What is an AVL tree?",
    options: [
      "A self-balancing binary search tree",
      "A tree with at most 3 children per node",
      "A tree used specifically for string matching",
      "An unweighted graph structure",
    ],
    correctAnswer: 0,
  },
];

dotenv.config();

const importData = async () => {
  try {
    await connectDB();
    if (!process.env.MONGODB_URI) {
      console.log("No MONGODB_URI found. Exiting seed script.");
      process.exit();
    }

    await Category.deleteMany();
    await Question.deleteMany();

    await Category.insertMany(categories);

    // Add real category ObjectId references to questions
    const questionsWithRefs = questions.map((q) => {
      // Keep category string ID so it matches the frontend request which filters by string ID
      return q;
    });

    await Question.insertMany(questionsWithRefs);

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
