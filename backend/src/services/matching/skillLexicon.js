// A small, curated skill dictionary. Each group starts with the canonical
// display name, followed by the spellings we want to recognise in a resume.
// This keeps matching explainable and completely offline — no API key needed.
const SKILL_GROUPS = [
  // "js" is deliberately omitted: after normalisation "Node.js" becomes
  // "node js", so a bare "js" alias would create a false JavaScript match.
  ['JavaScript', 'javascript es6', 'es6', 'vanilla js'],
  ['TypeScript', 'ts'],
  ['React', 'reactjs', 'react js'],
  ['Next.js', 'nextjs', 'next js'],
  ['Vue.js', 'vuejs', 'vue js'],
  ['Angular', 'angularjs'],
  ['Node.js', 'nodejs', 'node js', 'node'],
  ['Express', 'expressjs', 'express js'],
  ['NestJS', 'nest js', 'nestjs'],
  ['Python', 'py'],
  ['Django', 'django rest framework', 'drf'],
  ['Flask'],
  ['FastAPI', 'fast api'],
  ['Java'],
  ['Spring Boot', 'springboot', 'spring'],
  ['Kotlin'],
  ['C#', 'csharp', 'c sharp'],
  ['.NET', 'dotnet', 'asp.net', 'aspnet'],
  ['Go', 'golang'],
  ['Rust'],
  ['Ruby', 'rails', 'ruby on rails'],
  ['PHP', 'laravel'],
  ['Swift'],
  ['SQL', 'structured query language'],
  ['MySQL'],
  ['PostgreSQL', 'postgres', 'postgresql'],
  ['MongoDB', 'mongo'],
  ['Redis'],
  ['Elasticsearch', 'elastic search'],
  ['Firebase'],
  ['Supabase'],
  ['Prisma'],
  ['GraphQL'],
  ['REST APIs', 'rest api', 'restful', 'restful api', 'api development'],
  ['HTML', 'html5'],
  ['CSS', 'css3'],
  ['Tailwind CSS', 'tailwind'],
  ['Bootstrap'],
  ['SASS', 'scss', 'sass scss'],
  ['Redux', 'redux toolkit'],
  ['Zustand'],
  ['React Query', 'tanstack query'],
  ['Docker'],
  ['Kubernetes', 'k8s'],
  ['AWS', 'amazon web services', 's3', 'ec2', 'lambda'],
  ['Azure'],
  ['Google Cloud', 'gcp'],
  ['Terraform'],
  ['Linux', 'unix'],
  ['Nginx'],
  ['Git', 'github', 'gitlab', 'bitbucket'],
  ['CI/CD', 'cicd', 'continuous integration', 'continuous delivery'],
  ['Jenkins'],
  ['GitHub Actions', 'github actions'],
  ['Jest'],
  ['Vitest'],
  ['Cypress'],
  ['Playwright'],
  ['Selenium'],
  ['Postman'],
  ['Agile', 'scrum', 'kanban'],
  ['Figma', 'figjam'],
  ['Pandas'],
  ['NumPy', 'numpy'],
  ['Scikit-learn', 'sklearn', 'scikit learn'],
  ['TensorFlow', 'tensorflow'],
  ['PyTorch', 'pytorch'],
  ['OpenCV'],
  ['OpenAI API', 'openai api', 'openai'],
  ['LangChain'],
  ['LangGraph', 'lang graph'],
  ['RAG', 'retrieval augmented generation'],
  ['Prompt Engineering', 'prompt engineering'],
  ['FAISS'],
  ['Pinecone'],
  ['Hugging Face', 'huggingface', 'transformers'],
  ['LangSmith'],
  ['Spark', 'apache spark', 'pyspark'],
  ['Hadoop'],
  ['Kafka', 'apache kafka'],
  ['RabbitMQ'],
  ['Microservices'],
  ['System Design', 'system design'],
  ['WebSockets', 'websocket', 'socket.io'],
  ['JWT', 'json web token', 'jwt auth'],
  ['OAuth', 'oauth2'],
  ['Testing', 'unit testing', 'integration testing', 'tdd'],
];

const aliasToCanonical = new Map();

for (const [canonical, ...aliases] of SKILL_GROUPS) {
  for (const alias of [canonical, ...aliases]) {
    aliasToCanonical.set(normalizeText(alias), canonical);
  }
}

// Punctuation in tech names is inconsistent in real resumes ("Node.JS",
// "node-js", "node js"), so normalise all of it to plain spaces first.
export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[._/\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternFor(key) {
  const escaped = escapeRegex(key);
  const left = /[\w]/.test(key[0]) ? '\\b' : '';
  const right = /[\w]/.test(key[key.length - 1]) ? '\\b' : '';
  return new RegExp(`${left}${escaped}${right}`, 'i');
}

export function canonicalSkill(value) {
  const key = normalizeText(value);
  return aliasToCanonical.get(key) || key || null;
}

export function extractSkills(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const found = new Set();
  for (const [key, canonical] of aliasToCanonical) {
    if (found.has(canonical)) continue;
    if (patternFor(key).test(normalized)) found.add(canonical);
  }

  return [...found].sort((a, b) => a.localeCompare(b)).slice(0, 60);
}

export function canonicalSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  const found = new Set();
  for (const skill of skills) {
    const canonical = canonicalSkill(skill);
    if (canonical) found.add(canonical);
  }
  return [...found];
}
