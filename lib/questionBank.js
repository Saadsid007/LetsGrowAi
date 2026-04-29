const questionBank = {
  'technical': {
    'frontend': [
      'Explain the difference between var, let, and const in JavaScript.',
      'What is the Virtual DOM in React and how does it work?',
      'How does CSS specificity work?',
      'Can you explain the concept of closures in JavaScript?',
      'How do you handle asynchronous operations in JavaScript?',
      'What are some common performance optimization techniques for React applications?',
      'Explain the differences between REST and GraphQL.',
      'What is Redux and why would you use it?',
      'How do you manage state in a modern React application without Redux?',
      'What are React Hooks? Explain useState and useEffect.'
    ],
    'backend': [
      'Explain the difference between SQL and NoSQL databases.',
      'What is database normalization?',
      'How do you scale a Node.js application?',
      'What is a memory leak and how do you prevent it in Node.js?',
      'Explain the concept of middleware in Express.js.',
      'How do you secure a REST API?',
      'What is caching and how would you implement it?',
      'Explain the differences between monolithic and microservices architectures.',
      'What are indexes in a database and how do they work?',
      'Explain WebSockets and when you would use them over HTTP.'
    ],
    'fullstack': [
      'Describe the full request lifecycle from browser to database and back.',
      'How do you handle authentication in a full stack application?',
      'What is CORS and why is it necessary?',
      'How would you design a scalable schema for a social media feed?',
      'Explain SSR vs CSR in modern web frameworks like Next.js.',
      'What are JWTs and how do they differ from session cookies?',
      'How do you deploy a modern full stack application?',
      'What is CI/CD and what does a basic pipeline look like?',
      'How do you handle error logging and monitoring in production?',
      'Explain the MVC pattern and how it applies to modern web frameworks.'
    ],
    'data-analyst': [
      'Explain what a JOIN is in SQL and the types of JOINs.',
      'How do you handle missing or corrupted data in a dataset?',
      'What is the difference between supervised and unsupervised learning?',
      'Explain the concept of variance vs bias in machine learning.',
      'How would you explain a complex data finding to a non-technical stakeholder?',
      'What metric would you use to evaluate a classification model?',
      'Explain A/B testing and how you ensure statistical significance.',
      'What data visualization tools do you prefer and why?',
      'How do you write an efficient SQL query on a very large table?',
      'What is Overfitting and how do you prevent it?'
    ],
    'devops': [
      'What is Docker and how does it differ from traditional virtual machines?',
      'Explain the concept of Infrastructure as Code (IaC).',
      'What is Kubernetes and when should a company use it?',
      'How do you manage secrets and configuration in a CI/CD pipeline?',
      'Explain blue/green deployment strategy.',
      'What is Terraform and how do you manage its state?',
      'How do you monitor a microservices architecture?',
      'Explain the differences between continuous integration, continuous delivery, and continuous deployment.',
      'What is Jenkins and how does it compare to GitHub Actions?',
      'How do you handle database migrations in an automated CI/CD pipeline?'
    ],
    'general': [
      'Can you explain the SOLID principles?',
      'What is the difference between an abstract class and an interface?',
      'Explain the concept of Big O notation.',
      'What is the difference between a stack and a queue?',
      'How does a hash table work internally?'
    ]
  },
  'hr': {
    'general': [
      'Tell me about yourself.',
      'Why do you want to work for our company?',
      'Where do you see yourself in 5 years?',
      'What are your greatest strengths and weaknesses?',
      'Why are you leaving your current job?',
      'What is your expected salary?',
      'How do you handle working under pressure?',
      'Describe your ideal work environment.',
      'What motivates you to do your best work?',
      'Do you have any questions for us?'
    ]
  },
  'behavioral': {
    'general': [
      'Describe a challenging project you worked on and how you overcame the obstacles.',
      'Tell me about a time you had a conflict with a team member and how you resolved it.',
      'Give me an example of a time you failed and what you learned from it.',
      'Tell me about a time you had to take on a leadership role unexpectedly.',
      'Describe a situation where you had to quickly learn a new technology or concept.',
      'Tell me about a time you went above and beyond your job responsibilities.',
      'Describe a time you received constructive feedback. How did you handle it?',
      'Tell me about a time you had to manage competing priorities.',
      'Give an example of a time when you successfully communicated a complex technical issue to a non-technical person.',
      'Describe a project where you had to work with a difficult stakeholder.'
    ]
  },
  'system-design': {
    'general': [
      'How would you design a URL shortener like bit.ly?',
      'Design a rate limiter for an API.',
      'How would you design a messaging queue system?',
      'Design a web crawler.',
      'How would you design a global chat service like WhatsApp?',
      'Design a video streaming platform like YouTube.',
      'How would you design a distributed cache?',
      'Design a ride-sharing service like Uber.',
      'How would you design a highly scalable news feed system?',
      'Design an e-commerce checkout flow to handle Black Friday traffic.'
    ]
  },
  'mixed': {
    'general': [
      'Tell me about a technical challenge you recently solved.',
      'What are the trade-offs between monolithic and microservice architectures?',
      'Tell me about a time you disagreed with a manager.',
      'How do you stay updated with the latest technology trends?',
      'Explain how the internet works in simple terms.'
    ]
  }
};

/**
 * Returns a randomized list of fallback questions based on type and role.
 */
export function getFallbackQuestions(interviewType, role) {
  const type = interviewType.toLowerCase();
  const category = questionBank[type] || questionBank['technical'];
  
  // Try to match the role to a subcategory, otherwise default to general or fullstack
  let roleKey = 'general';
  if (type === 'technical') {
    const r = role.toLowerCase();
    if (r.includes('front')) roleKey = 'frontend';
    else if (r.includes('back')) roleKey = 'backend';
    else if (r.includes('data')) roleKey = 'data-analyst';
    else if (r.includes('devops') || r.includes('cloud')) roleKey = 'devops';
    else roleKey = 'fullstack';
  }

  const questions = category[roleKey] || category['general'] || questionBank['hr']['general'];
  
  // Return a shuffled copy
  return [...questions].sort(() => 0.5 - Math.random());
}
