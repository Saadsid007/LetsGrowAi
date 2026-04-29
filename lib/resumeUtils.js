import Resume from '../models/Resume';

/**
 * Extracts a massive structured Resume object into a clean plaintext format for AI context.
 */
export function resumeToPlainText(resume) {
  if (!resume || !resume.sections) return '';

  const { personal, education, experience, skills, projects, certifications } = resume.sections;

  let textList = [];

  // Personal Info
  if (personal) {
    if (personal.fullName) textList.push(`NAME: ${personal.fullName}`);
    
    const contactLine = [
       personal.email && `EMAIL: ${personal.email}`,
       personal.phone && `PHONE: ${personal.phone}`,
       personal.location && `LOCATION: ${personal.location}`
    ].filter(Boolean).join(' | ');
    if (contactLine) textList.push(contactLine);

    const linksLine = [
      personal.linkedin && `LINKEDIN: ${personal.linkedin}`,
      personal.github && `GITHUB: ${personal.github}`,
      personal.portfolio && `PORTFOLIO: ${personal.portfolio}`
    ].filter(Boolean).join(' | ');
    if (linksLine) textList.push(linksLine);

    if (personal.summary) {
      textList.push(`\nSUMMARY:\n${personal.summary}`);
    }
  }

  // Experience
  if (experience && experience.length > 0) {
    textList.push('\nEXPERIENCE:');
    experience.forEach(exp => {
      textList.push(`${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`);
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(b => textList.push(`- ${b}`));
      }
    });
  }

  // Education
  if (education && education.length > 0) {
    textList.push('\nEDUCATION:');
    education.forEach(edu => {
      let eduLine = `${edu.degree || 'Degree'} in ${edu.field || 'Field'} from ${edu.institution}`;
      if (edu.endDate) eduLine += ` (${edu.endDate})`;
      textList.push(eduLine);
      if (edu.grade) textList.push(`Grade: ${edu.grade}`);
      if (edu.achievements && edu.achievements.length > 0) {
         edu.achievements.forEach(a => textList.push(`- ${a}`));
      }
    });
  }

  // Skills
  if (skills) {
    textList.push('\nSKILLS:');
    if (skills.technical && skills.technical.length > 0) textList.push(`Technical: ${skills.technical.join(', ')}`);
    if (skills.tools && skills.tools.length > 0) textList.push(`Tools: ${skills.tools.join(', ')}`);
    if (skills.soft && skills.soft.length > 0) textList.push(`Soft: ${skills.soft.join(', ')}`);
    if (skills.languages && skills.languages.length > 0) textList.push(`Languages: ${skills.languages.join(', ')}`);
  }

  // Projects
  if (projects && projects.length > 0) {
    textList.push('\nPROJECTS:');
    projects.forEach(proj => {
      let head = proj.title;
      if (proj.techStack && proj.techStack.length > 0) {
         head += ` | Tech: ${proj.techStack.join(', ')}`;
      }
      textList.push(head);
      if (proj.description) textList.push(proj.description);
      if (proj.bullets && proj.bullets.length > 0) {
         proj.bullets.forEach(b => textList.push(`- ${b}`));
      }
    });
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    textList.push('\nCERTIFICATIONS:');
    certifications.forEach(cert => {
      let cLine = `${cert.name} by ${cert.issuer}`;
      if (cert.issueDate) cLine += ` (${cert.issueDate})`;
      textList.push(cLine);
    });
  }

  return textList.join('\n');
}

/**
 * Calculates a dynamic 0-100 completeness score for the UI
 */
export function calculateCompleteness(resume) {
  if (!resume || !resume.sections) return 0;
  
  let score = 0;
  const { personal, experience, education, skills, projects } = resume.sections;

  // Personal (15pts)
  if (personal?.fullName && personal?.email && personal?.phone) score += 15;
  // Professional Links (10pts)
  if (personal?.linkedin || personal?.github) score += 10;
  // Summary (10pts)
  if (personal?.summary && personal.summary.length > 20) score += 10;
  
  // Experience (15pts + 10pts for descriptive bullets)
  if (experience && experience.length > 0) {
    score += 15;
    const hasGoodBullets = experience.some(exp => exp.bullets && exp.bullets.length >= 3);
    if (hasGoodBullets) score += 10;
  }

  // Education (15pts)
  if (education && education.length > 0) score += 15;

  // Skills (10pts)
  const totalSkills = (skills?.technical?.length || 0) + (skills?.tools?.length || 0);
  if (totalSkills >= 5) score += 10;

  // Projects (10pts)
  if (projects && projects.length > 0) score += 10;

  // Profile photo allowance
  score += 5; // Assumed auto-cap

  return Math.min(score, 100);
}

/**
 * Secures database access ensuring users only touch their own data
 */
export async function validateResumeOwnership(resumeId, userId) {
  try {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    return resume;
  } catch (error) {
    console.error('[validateResumeOwnership]', error);
    return null; // Don't throw to caller, just return null security fail
  }
}
