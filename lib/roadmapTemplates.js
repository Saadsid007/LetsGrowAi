// Roadmap templates defining static, structured learning paths.

export const TEMPLATES = [
  {
    id: 'frontend-master',
    title: 'Frontend Master',
    role: 'Frontend Developer',
    defaultDuration: '3 months',
    difficulty: 'intermediate',
    tags: ['Web', 'React', 'UI'],
    coreSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Next.js'],
    weeks: [
      { weekNumber: 1, title: 'HTML/CSS Fundamentals', topics: ['Semantic HTML', 'CSS Flexbox & Grid', 'Responsive Design'], milestone: 'Build a responsive landing page', isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 2, title: 'Advanced CSS & Tools', topics: ['SASS/SCSS', 'Tailwind CSS', 'CSS Animations'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 3, title: 'JavaScript Core', topics: ['ES6+ Features', 'DOM Manipulation', 'Async/Await & Fetch'], milestone: 'Build an API-driven web app', isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 4, title: 'JavaScript Advanced', topics: ['Closures & Scope', 'Prototypal Inheritance', 'Design Patterns'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 5, title: 'React Basics', topics: ['Components & Props', 'State & Lifecycle', 'React Router'], milestone: 'Build a multi-page React app', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 6, title: 'Advanced React', topics: ['Custom Hooks', 'Context API', 'Performance Optimization'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 7, title: 'State Management', topics: ['Redux Toolkit', 'Zustand', 'React Query'], milestone: 'Implement complex state in your app', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 8, title: 'TypeScript Basics', topics: ['Types & Interfaces', 'Generics', 'React with TypeScript'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 9, title: 'Next.js Foundations', topics: ['App Router', 'Server Components', 'Data Fetching'], milestone: 'Migrate React app to Next.js', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 10, title: 'Fullstack Next.js', topics: ['API Routes', 'Auth.js', 'Prisma ORM'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 11, title: 'Testing & CI/CD', topics: ['Jest & React Testing Library', 'Cypress', 'GitHub Actions'], milestone: 'Set up automated tests and deployment', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 12, title: 'Portfolio & Interview Prep', topics: ['Polish Portfolio', 'System Design for Frontend', 'Mock Interviews'], milestone: 'Ready for applications', isSkippableForIntermediate: false, isSkippableForAdvanced: false }
    ]
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    role: 'Data Scientist',
    defaultDuration: '6 months',
    difficulty: 'intermediate',
    tags: ['Data', 'Python', 'ML'],
    coreSkills: ['Python', 'NumPy', 'Pandas', 'Machine Learning', 'SQL', 'Data Visualization'],
    weeks: [
      { weekNumber: 1, title: 'Python Basics', topics: ['Data Types', 'Functions', 'OOP in Python'], milestone: 'Write utility scripts', isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 2, title: 'Data Structures & Algorithms', topics: ['Lists, Sets, Dictionaries', 'Searching & Sorting', 'Complexity Analysis'], milestone: null, isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 3, title: 'SQL & Databases', topics: ['Advanced Queries', 'Joins & Subqueries', 'Database Design'], milestone: 'Analyze a dataset using SQL', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 4, title: 'NumPy & Pandas', topics: ['Arrays & Matrices', 'Dataframes', 'Data Cleaning'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 5, title: 'Data Visualization', topics: ['Matplotlib', 'Seaborn', 'Plotly'], milestone: 'Create an interactive dashboard', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 6, title: 'Statistics & Math', topics: ['Probability distributions', 'Hypothesis Testing', 'Linear Algebra basics'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 7, title: 'Machine Learning Foundations', topics: ['Scikit-learn', 'Linear & Logistic Regression', 'Decision Trees'], milestone: 'Build a predictive model', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 8, title: 'Advanced ML', topics: ['Random Forests', 'XGBoost', 'Clustering (K-Means)'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 9, title: 'Deep Learning Basics', topics: ['Neural Networks', 'TensorFlow/PyTorch basics', 'CNNs'], milestone: 'Build an image classifier', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 10, title: 'NLP Fundamentals', topics: ['Text Processing', 'Word Embeddings', 'Transformers intro'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 11, title: 'Model Deployment', topics: ['Flask/FastAPI', 'Docker for ML', 'Cloud Deployment'], milestone: 'Deploy an ML model via API', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 12, title: 'Capstone Project', topics: ['End-to-end pipeline', 'Presentation skills', 'Interview Prep'], milestone: 'Complete Data Science Portfolio', isSkippableForIntermediate: false, isSkippableForAdvanced: false }
    ]
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    role: 'DevOps Engineer',
    defaultDuration: '4 months',
    difficulty: 'advanced',
    tags: ['Cloud', 'Infrastructure', 'Automation'],
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    weeks: [
      { weekNumber: 1, title: 'Linux Basics & Scripting', topics: ['File Systems', 'Bash Scripting', 'Process Management'], milestone: null, isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 2, title: 'Networking & Security', topics: ['TCP/IP & DNS', 'Firewalls', 'SSH & Keys'], milestone: 'Configure a secure Linux server', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 3, title: 'Containers with Docker', topics: ['Dockerfiles', 'Docker Compose', 'Image Optimization'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 4, title: 'Continuous Integration', topics: ['Git workflows', 'GitHub Actions', 'Jenkins basics'], milestone: 'Build a CI pipeline for a web app', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 5, title: 'Cloud Computing (AWS)', topics: ['EC2 & VPC', 'S3 & IAM', 'Cloud Architecture'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 6, title: 'Infrastructure as Code', topics: ['Terraform basics', 'Modules & State', 'Ansible configuration'], milestone: 'Provision AWS infrastructure via Terraform', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 7, title: 'Container Orchestration', topics: ['Kubernetes architecture', 'Pods & Deployments', 'Services & Ingress'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 8, title: 'Advanced K8s & Helm', topics: ['ConfigMaps & Secrets', 'Helm Charts', 'K8s Security'], milestone: 'Deploy microservices to a K8s cluster', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 9, title: 'Monitoring & Logging', topics: ['Prometheus', 'Grafana', 'ELK Stack'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 10, title: 'Site Reliability & Capstone', topics: ['Incident Response', 'SRE Principles', 'End-to-end DevOps Pipeline'], milestone: 'Complete DevOps Portfolio', isSkippableForIntermediate: false, isSkippableForAdvanced: false }
    ]
  },
  {
    id: 'android-developer',
    title: 'Android Developer',
    role: 'Android Developer',
    defaultDuration: '3 months',
    difficulty: 'intermediate',
    tags: ['Mobile', 'Kotlin', 'Android'],
    coreSkills: ['Kotlin', 'Android Studio', 'Jetpack Compose', 'Room DB', 'Retrofit'],
    weeks: [
      { weekNumber: 1, title: 'Kotlin Fundamentals', topics: ['Syntax & Types', 'Control Flow', 'Functions & Lambdas'], milestone: null, isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 2, title: 'Object-Oriented Kotlin', topics: ['Classes & Interfaces', 'Coroutines intro', 'Collections'], milestone: 'Build a CLI Kotlin app', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 3, title: 'Android Studio & UI Basics', topics: ['Activities & Fragments', 'XML Layouts', 'Material Design'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 4, title: 'Jetpack Compose', topics: ['Declarative UI', 'State in Compose', 'Modifiers'], milestone: 'Build a simple UI with Compose', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 5, title: 'Navigation & Architecture', topics: ['Navigation Component', 'MVVM Pattern', 'ViewModel & LiveData'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 6, title: 'Networking & APIs', topics: ['Retrofit', 'JSON Parsing', 'Coroutines for Network'], milestone: 'Build a weather app fetching from API', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 7, title: 'Local Data Persistence', topics: ['Room Database', 'DataStore', 'Caching strategies'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 8, title: 'Advanced Android', topics: ['Background Processing', 'Push Notifications', 'Publishing to Play Store'], milestone: 'Complete production-ready Android App', isSkippableForIntermediate: false, isSkippableForAdvanced: false }
    ]
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer (Node.js)',
    role: 'Backend Engineer',
    defaultDuration: '3 months',
    difficulty: 'intermediate',
    tags: ['Backend', 'Node.js', 'APIs'],
    coreSkills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'System Design'],
    weeks: [
      { weekNumber: 1, title: 'JavaScript/TypeScript Refresher', topics: ['Async Programming', 'Event Loop', 'TS Types'], milestone: null, isSkippableForIntermediate: true, isSkippableForAdvanced: true },
      { weekNumber: 2, title: 'Node.js & Express Basics', topics: ['Routing', 'Middleware', 'Error Handling'], milestone: 'Build a REST API', isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 3, title: 'Database Design & SQL', topics: ['Relational DBs', 'PostgreSQL', 'Prisma ORM'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: true },
      { weekNumber: 4, title: 'NoSQL & MongoDB', topics: ['Document DBs', 'Mongoose', 'Aggregation Pipeline'], milestone: 'Build an API with MongoDB', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 5, title: 'Authentication & Security', topics: ['JWT', 'OAuth', 'Rate Limiting & CORS'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 6, title: 'Advanced APIs & GraphQL', topics: ['GraphQL Basics', 'Apollo Server', 'WebSockets'], milestone: 'Implement real-time features', isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 7, title: 'Caching & Performance', topics: ['Redis', 'Caching Strategies', 'Query Optimization'], milestone: null, isSkippableForIntermediate: false, isSkippableForAdvanced: false },
      { weekNumber: 8, title: 'System Design & Deployment', topics: ['Microservices Intro', 'Docker Basics', 'AWS EC2/Lambda'], milestone: 'Deploy backend infrastructure', isSkippableForIntermediate: false, isSkippableForAdvanced: false }
    ]
  }
];

export function getAllTemplates() {
  return TEMPLATES;
}

export function getTemplateById(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}
