export const questions = [
  // Python
  {
    id: "py_1",
    category: "python",
    difficulty: "easy",
    question:
      "What is the output of the following Python code?\n\nprint(type([]))",
    options: [
      "<class 'list'>",
      "<class 'array'>",
      "<class 'tuple'>",
      "<class 'set'>",
    ],
    correctAnswer: "<class 'list'>",
    explanation:
      "In Python, [] is the literal syntax for a list, so its type is <class 'list'>.",
  },
  {
    id: "py_2",
    category: "python",
    difficulty: "easy",
    question: "Which of the following is not a valid variable name in Python?",
    options: ["my_var", "myVar", "2nd_var", "_my_var"],
    correctAnswer: "2nd_var",
    explanation: "Variable names in Python cannot start with a number.",
  },
  {
    id: "py_3",
    category: "python",
    difficulty: "medium",
    question:
      "What is the output of the following Python code?\n\nx = [1, 2, 3]\ny = x\ny[0] = 4\nprint(x)",
    options: ["[1, 2, 3]", "[4, 2, 3]", "[4]", "Error"],
    correctAnswer: "[4, 2, 3]",
    explanation:
      "Lists are mutable in Python. When you assign y = x, they reference the same list in memory.",
  },
  {
    id: "py_4",
    category: "python",
    difficulty: "medium",
    question: "Which keyword is used to handle exceptions in Python?",
    options: ["catch", "except", "handle", "try"],
    correctAnswer: "except",
    explanation:
      "In Python, the 'try' block is used to test a block of code for errors, and 'except' is used to handle the error.",
  },
  {
    id: "py_5",
    category: "python",
    difficulty: "hard",
    question:
      "What does the following list comprehension evaluate to?\n\n[x for x in range(5) if x % 2 == 0]",
    options: ["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "[2, 4]"],
    correctAnswer: "[0, 2, 4]",
    explanation:
      "The condition 'x % 2 == 0' filters the numbers in range(0, 5) to only include even numbers.",
  },
  {
    id: "py_6",
    category: "python",
    difficulty: "hard",
    question: "What is the purpose of the 'yield' keyword in Python?",
    options: [
      "To pause the execution of a function",
      "To return a value and terminate a function",
      "To define a generator function",
      "To raise an exception",
    ],
    correctAnswer: "To define a generator function",
    explanation:
      "'yield' is used to return a generator object, which can yield a sequence of values over time, preserving its state.",
  },

  // Java
  {
    id: "java_1",
    category: "java",
    difficulty: "easy",
    question:
      "Which data type is used to create a variable that should store text?",
    options: ["String", "string", "Txt", "myString"],
    correctAnswer: "String",
    explanation:
      "In Java, 'String' (with a capital S) is a class used to store text.",
  },
  {
    id: "java_2",
    category: "java",
    difficulty: "easy",
    question: "How do you create a single-line comment in Java?",
    options: ["// comment", "/* comment", "<!-- comment -->", "# comment"],
    correctAnswer: "// comment",
    explanation: "Java uses '//' for single-line comments.",
  },
  {
    id: "java_3",
    category: "java",
    difficulty: "medium",
    question: "What is the size of an int variable in Java?",
    options: ["8 bits", "16 bits", "32 bits", "64 bits"],
    correctAnswer: "32 bits",
    explanation: "An int is a 32-bit signed two's complement integer in Java.",
  },
  {
    id: "java_4",
    category: "java",
    difficulty: "medium",
    question:
      "Which of these access specifiers can be used for an interface in Java?",
    options: ["public", "protected", "private", "All of the above"],
    correctAnswer: "public",
    explanation:
      "Interfaces can only be public or have default access (package-private).",
  },
  {
    id: "java_5",
    category: "java",
    difficulty: "hard",
    question: "What is the difference between '==' and '.equals()' in Java?",
    options: [
      "'==' compares object references, '.equals()' compares values",
      "'==' compares values, '.equals()' compares object references",
      "Both compare values",
      "Both compare object references",
    ],
    correctAnswer:
      "'==' compares object references, '.equals()' compares values",
    explanation:
      "'==' checks if both references point to the same memory location, while '.equals()' evaluates the content.",
  },

  // JavaScript
  {
    id: "js_1",
    category: "javascript",
    difficulty: "easy",
    question: "Inside which HTML element do we put the JavaScript?",
    options: ["<scripting>", "<script>", "<javascript>", "<js>"],
    correctAnswer: "<script>",
    explanation:
      "The <script> tag is used to embed or reference executable code in HTML.",
  },
  {
    id: "js_2",
    category: "javascript",
    difficulty: "easy",
    question: "How do you write 'Hello World' in an alert box?",
    options: [
      "alert('Hello World');",
      "msg('Hello World');",
      "msgBox('Hello World');",
      "alertBox('Hello World');",
    ],
    correctAnswer: "alert('Hello World');",
    explanation:
      "The alert() function displays an alert box with a specified message.",
  },
  {
    id: "js_3",
    category: "javascript",
    difficulty: "medium",
    question: "What is the output of 'typeof null' in JavaScript?",
    options: ["'null'", "'undefined'", "'object'", "'string'"],
    correctAnswer: "'object'",
    explanation:
      "Due to a historical bug in JavaScript, 'typeof null' returns 'object'.",
  },
  {
    id: "js_4",
    category: "javascript",
    difficulty: "medium",
    question:
      "Which of the following methods is used to access an HTML element by id?",
    options: [
      "getElementById()",
      "getElement(id)",
      "getElementByID()",
      "getIdElement()",
    ],
    correctAnswer: "getElementById()",
    explanation: "document.getElementById() is the correct method.",
  },
  {
    id: "js_5",
    category: "javascript",
    difficulty: "hard",
    question: "What does the 'this' keyword refer to in an arrow function?",
    options: [
      "The global object",
      "The element that triggered the event",
      "The object that owns the function",
      "The lexical scope surrounding the arrow function",
    ],
    correctAnswer: "The lexical scope surrounding the arrow function",
    explanation:
      "Arrow functions do not bind their own 'this', they inherit it from the parent scope (lexical scoping).",
  },

  // React
  {
    id: "react_1",
    category: "react",
    difficulty: "easy",
    question: "What is React?",
    options: [
      "A JavaScript framework for building user interfaces",
      "A JavaScript library for building user interfaces",
      "A CSS framework",
      "A database management system",
    ],
    correctAnswer: "A JavaScript library for building user interfaces",
    explanation:
      "React is an open-source JavaScript library developed by Facebook for building user interfaces.",
  },
  {
    id: "react_2",
    category: "react",
    difficulty: "easy",
    question: "Which hook is used to manage state in a functional component?",
    options: ["useEffect", "useContext", "useState", "useReducer"],
    correctAnswer: "useState",
    explanation:
      "useState is the primary hook for adding state variables to functional components.",
  },
  {
    id: "react_3",
    category: "react",
    difficulty: "medium",
    question: "What is the purpose of the 'key' prop in React lists?",
    options: [
      "To identify which items have changed, been added, or been removed",
      "To style list items",
      "To set the index of the list item",
      "To trigger an event when clicked",
    ],
    correctAnswer:
      "To identify which items have changed, been added, or been removed",
    explanation:
      "Keys help React identify which items have changed, been added, or been removed, aiding in efficient re-rendering.",
  },
  {
    id: "react_4",
    category: "react",
    difficulty: "medium",
    question:
      "What does useEffect do if you pass an empty array as the second argument?",
    options: [
      "It runs after every render",
      "It runs only once after the initial render",
      "It never runs",
      "It runs on unmount only",
    ],
    correctAnswer: "It runs only once after the initial render",
    explanation:
      "An empty dependency array [] means the effect doesn't depend on any values from props or state, so it never needs to re-run.",
  },
  {
    id: "react_5",
    category: "react",
    difficulty: "hard",
    question: "What is the Virtual DOM?",
    options: [
      "A direct copy of the real DOM kept in the browser's memory",
      "A lightweight, in-memory representation of the real DOM",
      "A CSS processor used by React",
      "An alternative to the DOM used in older browsers",
    ],
    correctAnswer: "A lightweight, in-memory representation of the real DOM",
    explanation:
      "React uses a Virtual DOM to batch DOM updates for better performance, comparing it with the real DOM to determine necessary changes.",
  },

  // HTML
  {
    id: "html_1",
    category: "html",
    difficulty: "easy",
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language",
      "Hyper Tool Markup Language",
    ],
    correctAnswer: "Hyper Text Markup Language",
    explanation: "HTML stands for Hyper Text Markup Language.",
  },
  {
    id: "html_2",
    category: "html",
    difficulty: "easy",
    question: "Who is making the Web standards?",
    options: [
      "Mozilla",
      "Microsoft",
      "The World Wide Web Consortium",
      "Google",
    ],
    correctAnswer: "The World Wide Web Consortium",
    explanation:
      "The W3C (World Wide Web Consortium) creates and maintains web standards.",
  },
  {
    id: "html_3",
    category: "html",
    difficulty: "medium",
    question: "Choose the correct HTML element for the largest heading:",
    options: ["<h6>", "<head>", "<h1>", "<heading>"],
    correctAnswer: "<h1>",
    explanation: "<h1> defines the most important and largest heading.",
  },
  {
    id: "html_4",
    category: "html",
    difficulty: "medium",
    question: "What is the correct HTML for creating a hyperlink?",
    options: [
      "<a url='http://www.w3schools.com'>W3Schools.com</a>",
      "<a name='http://www.w3schools.com'>W3Schools.com</a>",
      "<a href='http://www.w3schools.com'>W3Schools</a>",
      "<a>http://www.w3schools.com</a>",
    ],
    correctAnswer: "<a href='http://www.w3schools.com'>W3Schools</a>",
    explanation:
      "The href attribute specifies the URL of the page the link goes to.",
  },

  // CSS
  {
    id: "css_1",
    category: "css",
    difficulty: "easy",
    question: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Colorful Style Sheets",
    ],
    correctAnswer: "Cascading Style Sheets",
    explanation: "CSS stands for Cascading Style Sheets.",
  },
  {
    id: "css_2",
    category: "css",
    difficulty: "easy",
    question:
      "Where in an HTML document is the correct place to refer to an external style sheet?",
    options: [
      "In the <body> section",
      "In the <head> section",
      "At the end of the document",
      "Before the <html> tag",
    ],
    correctAnswer: "In the <head> section",
    explanation:
      "External style sheets are referenced within the <head> section using the <link> tag.",
  },
  {
    id: "css_3",
    category: "css",
    difficulty: "medium",
    question: "Which HTML tag is used to define an internal style sheet?",
    options: ["<style>", "<script>", "<css>", "<link>"],
    correctAnswer: "<style>",
    explanation:
      "The <style> element is used to define internal CSS within the <head> section.",
  },
  {
    id: "css_4",
    category: "css",
    difficulty: "medium",
    question: "Which CSS property is used to change the background color?",
    options: ["color", "bgcolor", "background-color", "bg-color"],
    correctAnswer: "background-color",
    explanation:
      "The background-color property is used to specify the background color of an element.",
  },

  // SQL
  {
    id: "sql_1",
    category: "sql",
    difficulty: "easy",
    question: "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Strong Question Language",
      "Structured Question Language",
      "System Query Language",
    ],
    correctAnswer: "Structured Query Language",
    explanation:
      "SQL stands for Structured Query Language, used for managing relational databases.",
  },
  {
    id: "sql_2",
    category: "sql",
    difficulty: "easy",
    question: "Which SQL statement is used to extract data from a database?",
    options: ["EXTRACT", "SELECT", "GET", "OPEN"],
    correctAnswer: "SELECT",
    explanation: "The SELECT statement is used to select data from a database.",
  },
  {
    id: "sql_3",
    category: "sql",
    difficulty: "medium",
    question: "Which SQL statement is used to update data in a database?",
    options: ["SAVE", "MODIFY", "UPDATE", "SAVE AS"],
    correctAnswer: "UPDATE",
    explanation:
      "The UPDATE statement is used to modify the existing records in a table.",
  },
  {
    id: "sql_4",
    category: "sql",
    difficulty: "medium",
    question: "Which SQL statement is used to delete data from a database?",
    options: ["REMOVE", "COLLAPSE", "DELETE", "CLEAR"],
    correctAnswer: "DELETE",
    explanation:
      "The DELETE statement is used to delete existing records in a table.",
  },
  {
    id: "sql_5",
    category: "sql",
    difficulty: "hard",
    question: "What does the UNION operator do?",
    options: [
      "Combines the result sets of two or more SELECT statements",
      "Returns true if any of the subqueries meet the condition",
      "Returns the intersection of two queries",
      "Filters records based on multiple conditions",
    ],
    correctAnswer: "Combines the result sets of two or more SELECT statements",
    explanation:
      "The UNION operator is used to combine the result-set of two or more SELECT statements, removing duplicates by default.",
  },

  // DSA
  {
    id: "dsa_1",
    category: "dsa",
    difficulty: "easy",
    question: "Which data structure uses LIFO (Last In First Out)?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctAnswer: "Stack",
    explanation:
      "A stack is a linear data structure that follows the LIFO principle.",
  },
  {
    id: "dsa_2",
    category: "dsa",
    difficulty: "easy",
    question: "Which data structure uses FIFO (First In First Out)?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    correctAnswer: "Queue",
    explanation:
      "A queue is a linear data structure that follows the FIFO principle.",
  },
  {
    id: "dsa_3",
    category: "dsa",
    difficulty: "medium",
    question:
      "What is the time complexity of a binary search on a sorted array?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctAnswer: "O(log n)",
    explanation:
      "Binary search repeatedly divides the search interval in half, leading to logarithmic time complexity.",
  },
  {
    id: "dsa_4",
    category: "dsa",
    difficulty: "medium",
    question:
      "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
    correctAnswer: "Merge Sort",
    explanation:
      "Merge Sort consistently guarantees O(n log n) performance, whereas the others are typically O(n^2).",
  },
  {
    id: "dsa_5",
    category: "dsa",
    difficulty: "hard",
    question: "What is an AVL tree?",
    options: [
      "A self-balancing binary search tree",
      "A tree with at most 3 children per node",
      "A tree used specifically for string matching",
      "An unweighted graph structure",
    ],
    correctAnswer: "A self-balancing binary search tree",
    explanation:
      "In an AVL tree, the heights of the two child subtrees of any node differ by at most one.",
  },
];
